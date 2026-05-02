import { prisma } from "@/lib/prisma";
import { jsonOk, requireUser, withApi } from "@/lib/api";

type KpiRow = {
  total_in_stock: string | null;
  items_below_reorder: bigint;
  today_stock_in: string;
  today_stock_out: string;
};

type DayRow = {
  day: string;
  in_qty: string;
  out_qty: string;
};

export const GET = withApi(async () => {
  await requireUser();

  const [kpi] = await prisma.$queryRaw<KpiRow[]>`
    SELECT * FROM v_dashboard_kpis
  `;

  const days = await prisma.$queryRaw<DayRow[]>`
    SELECT
      to_char(d::date, 'Dy') AS day,
      COALESCE(SUM(smi.qty) FILTER (WHERE m.direction = 'in'),  0) AS in_qty,
      COALESCE(SUM(smi.qty) FILTER (WHERE m.direction = 'out'), 0) AS out_qty
    FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') d
    LEFT JOIN stock_movements m
      ON m.movement_date = d::date AND m.deleted_at IS NULL
    LEFT JOIN stock_movement_items smi ON smi.movement_id = m.id
    GROUP BY d
    ORDER BY d
  `;

  return jsonOk({
    kpis: {
      totalInStock:    kpi?.total_in_stock      ? Number(kpi.total_in_stock)      : 0,
      itemsBelowReorder: kpi ? Number(kpi.items_below_reorder) : 0,
      todayStockIn:    kpi ? Number(kpi.today_stock_in)  : 0,
      todayStockOut:   kpi ? Number(kpi.today_stock_out) : 0,
    },
    weekDays: days.map((d) => ({
      day: d.day.trim(),
      in: Number(d.in_qty),
      out: Number(d.out_qty),
    })),
  });
});
