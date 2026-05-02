import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonOk, parseJson, requireUser, withApi } from "@/lib/api";

const NOTIFICATION_DEFAULTS = [
  { key: "low_stock_alert",      label: "Low stock alerts",        description: "Notify when an item hits its reorder threshold", default: true  },
  { key: "stock_in_received",    label: "New stock-in received",   description: "Notify when inbound stock is confirmed",         default: true  },
  { key: "stock_out_dispatched", label: "Stock-out dispatched",    description: "Notify when an outbound dispatch is completed",  default: false },
  { key: "weekly_summary_email", label: "Weekly summary email",    description: "A weekly digest of all warehouse activity",      default: true  },
];

export const GET = withApi(async () => {
  const me = await requireUser();
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: me.id },
  });
  const map = new Map(prefs.map((p) => [p.key, p.enabled]));

  return jsonOk(
    NOTIFICATION_DEFAULTS.map((d) => ({
      key: d.key,
      label: d.label,
      description: d.description,
      enabled: map.get(d.key) ?? d.default,
    })),
  );
});

const patchSchema = z.object({
  key:     z.string().min(1).max(64),
  enabled: z.boolean(),
});

export const PATCH = withApi(async (req) => {
  const me = await requireUser();
  const { key, enabled } = await parseJson(req, patchSchema);

  const pref = await prisma.notificationPreference.upsert({
    where: { userId_key: { userId: me.id, key } },
    update: { enabled },
    create: { userId: me.id, key, enabled },
  });

  return jsonOk({ key: pref.key, enabled: pref.enabled });
});
