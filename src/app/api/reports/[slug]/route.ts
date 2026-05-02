import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireUser, withApi } from "@/lib/api";

const SLUGS = [
  "stock-on-hand",
  "stock-movement-history",
  "project-consumption",
  "slow-moving",
  "maintenance-usage",
] as const;
type Slug = (typeof SLUGS)[number];

export const GET = withApi(async (req, ctx) => {
  await requireUser();
  const { slug } = await ctx.params;

  if (!SLUGS.includes(slug as Slug)) {
    return jsonError(`Unknown report: ${slug}`, 404);
  }

  const url = new URL(req.url);

  switch (slug as Slug) {
    case "stock-on-hand": {
      const category = url.searchParams.get("category");
      const rows = await prisma.$queryRaw<
        {
          rfq: string;
          name: string;
          category: string;
          current_stock: string;
          unit: string;
          status: "in_stock" | "low" | "critical" | "out";
        }[]
      >`
        SELECT rfq, name, category, current_stock, unit, status
        FROM v_items_with_status
        WHERE is_active
          AND (${category}::TEXT IS NULL OR category = ${category})
        ORDER BY name
      `;
      return jsonOk({
        title: "Stock on hand",
        rows: rows.map((r) => ({
          rfq: r.rfq,
          name: r.name,
          category: r.category,
          current: Number(r.current_stock),
          unit: r.unit,
          status: r.status,
        })),
      });
    }

    case "stock-movement-history": {
      const from = url.searchParams.get("from");
      const to   = url.searchParams.get("to");
      const kind = url.searchParams.get("kind");

      const rows = await prisma.$queryRaw<
        {
          movement_date: Date;
          direction: "in" | "out";
          ref_no: string;
          item: string;
          qty: string;
          unit: string;
          counterparty: string | null;
        }[]
      >`
        SELECT
          movement_date, direction, ref_no, item, qty, unit,
          COALESCE(supplier, project) AS counterparty
        FROM v_stock_movement_history
        WHERE (${kind}::TEXT IS NULL OR kind::TEXT = ${kind})
          AND (${from}::DATE IS NULL OR movement_date >= ${from}::DATE)
          AND (${to}::DATE   IS NULL OR movement_date <= ${to}::DATE)
        ORDER BY movement_date DESC, movement_id DESC
        LIMIT 500
      `;
      return jsonOk({
        title: "Stock movement history",
        rows: rows.map((r) => ({
          date: r.movement_date,
          direction: r.direction,
          refNo: r.ref_no,
          item: r.item,
          qty: Number(r.qty),
          unit: r.unit,
          counterparty: r.counterparty,
        })),
      });
    }

    case "project-consumption": {
      const rows = await prisma.$queryRaw<
        {
          wbs: string;
          name: string;
          location: string;
          items_issued: bigint;
          qty_consumed: string;
          last_activity: Date | null;
        }[]
      >`
        SELECT wbs, name, location, items_issued, qty_consumed, last_activity
        FROM v_project_consumption
        ORDER BY qty_consumed DESC NULLS LAST
      `;
      return jsonOk({
        title: "Material consumption per project",
        rows: rows.map((r) => ({
          wbs: r.wbs,
          name: r.name,
          location: r.location,
          itemsIssued: Number(r.items_issued),
          qtyConsumed: Number(r.qty_consumed),
          lastActivity: r.last_activity,
        })),
      });
    }

    case "slow-moving": {
      const minDays = Number(url.searchParams.get("days") ?? 30);
      const rows = await prisma.$queryRaw<
        {
          rfq: string;
          name: string;
          category: string;
          current_stock: string;
          last_issued: Date | null;
          days_idle: number;
        }[]
      >`
        SELECT rfq, name, category, current_stock, last_issued, days_idle
        FROM v_slow_moving_items
        WHERE days_idle >= ${minDays}
        ORDER BY days_idle DESC
      `;
      return jsonOk({
        title: "Slow-moving stock",
        rows: rows.map((r) => ({
          rfq: r.rfq,
          name: r.name,
          category: r.category,
          current: Number(r.current_stock),
          lastIssued: r.last_issued,
          daysIdle: Number(r.days_idle),
        })),
      });
    }

    case "maintenance-usage": {
      const site      = url.searchParams.get("site");
      const direction = url.searchParams.get("direction");
      const rows = await prisma.$queryRaw<
        {
          ref_no: string;
          movement_date: Date;
          direction: "in" | "out";
          item: string;
          qty: string;
          unit: string;
          site: string | null;
          technician: string | null;
        }[]
      >`
        SELECT ref_no, movement_date, direction, item, qty, unit, site, technician
        FROM v_stock_movement_history
        WHERE kind = 'maintenance'
          AND (${site}::TEXT      IS NULL OR site = ${site})
          AND (${direction}::TEXT IS NULL OR direction::TEXT = ${direction})
        ORDER BY movement_date DESC, movement_id DESC
      `;
      return jsonOk({
        title: "Maintenance parts usage",
        rows: rows.map((r) => ({
          refNo: r.ref_no,
          date: r.movement_date,
          direction: r.direction,
          item: r.item,
          qty: Number(r.qty),
          unit: r.unit,
          site: r.site,
          technician: r.technician,
        })),
      });
    }
  }
});
