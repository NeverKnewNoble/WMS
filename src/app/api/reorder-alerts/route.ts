import { prisma } from "@/lib/prisma";
import { jsonOk, requireUser, withApi } from "@/lib/api";

type AlertRow = {
  item_id: bigint;
  name: string;
  category: string;
  current: string;       // numeric → string
  reorder: string;
  shortfall: string;
  suggested: string;
  supplier: string | null;
  severity: "critical" | "low" | "watch" | null;
};

export const GET = withApi(async (req) => {
  await requireUser();
  const url = new URL(req.url);
  const severity = url.searchParams.get("severity");

  const rows = await prisma.$queryRaw<AlertRow[]>`
    SELECT *
    FROM v_reorder_alerts
    ${severity && ["critical", "low", "watch"].includes(severity)
      ? prisma.$queryRaw`WHERE severity = ${severity}::alert_severity`
      : prisma.$queryRaw``}
    ORDER BY shortfall DESC NULLS LAST, name
  `;

  // Summary counts by severity.
  const summary = await prisma.$queryRaw<{ severity: string; count: bigint }[]>`
    SELECT severity, COUNT(*)::bigint AS count
    FROM v_reorder_alerts
    GROUP BY severity
  `;

  return jsonOk({
    alerts: rows.map((r) => ({
      itemId:    r.item_id,
      name:      r.name,
      category:  r.category,
      current:   Number(r.current),
      reorder:   Number(r.reorder),
      shortfall: Number(r.shortfall),
      suggested: Number(r.suggested),
      supplier:  r.supplier,
      severity:  r.severity,
    })),
    summary: summary.map((s) => ({ severity: s.severity, count: Number(s.count) })),
  });
});
