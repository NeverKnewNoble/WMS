"use client";

import { AlertOctagon, AlertTriangle, Bell, List } from "lucide-react";
import { clsx } from "clsx";
import {
  PageHeader,
  Surface,
} from "@/components/ui_components/portal/primitives";
import { getReorderAlerts } from "@/services/reorder-alerts";
import { useService } from "@/services/use-service";
import type { AlertSeverity } from "@/types/reorder-alerts";

const SEVERITY_STYLE: Record<
  AlertSeverity,
  { ring: string; icon: string; iconBg: string; Icon: React.ElementType }
> = {
  critical: {
    ring: "ring-rose-500/30 bg-rose-500/5",
    icon: "text-rose-300",
    iconBg: "bg-rose-500/15",
    Icon: AlertOctagon,
  },
  low: {
    ring: "ring-amber-400/25 bg-amber-400/5",
    icon: "text-amber-300",
    iconBg: "bg-amber-400/15",
    Icon: AlertTriangle,
  },
  watch: {
    ring: "ring-cyan-400/25 bg-cyan-400/5",
    icon: "text-cyan-300",
    iconBg: "bg-cyan-400/15",
    Icon: Bell,
  },
};

export default function ReorderAlertsPage() {
  const { data, loading } = useService(() => getReorderAlerts(), []);
  const alerts = data?.alerts ?? [];

  const counts = new Map<AlertSeverity, number>();
  for (const s of data?.summary ?? []) counts.set(s.severity, s.count);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 animate-page-in">
      <PageHeader
        eyebrow="Inventory · Alerts"
        title="Reorder alerts"
        subtitle="Monitor and act on low-stock items before they impact a project."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="All items"
          sub="tracked alerts"
          count={alerts.length}
          ring="ring-white/10 bg-white/3"
          iconClass="text-white/85"
          Icon={List}
        />
        <SummaryCard
          label="Critical"
          sub="out of stock"
          count={counts.get("critical") ?? 0}
          ring="ring-rose-500/30 bg-rose-500/5"
          iconClass="text-rose-300"
          Icon={AlertOctagon}
        />
        <SummaryCard
          label="Low"
          sub="at reorder level"
          count={counts.get("low") ?? 0}
          ring="ring-amber-400/30 bg-amber-400/5"
          iconClass="text-amber-300"
          Icon={AlertTriangle}
        />
        <SummaryCard
          label="Watch"
          sub="approaching reorder"
          count={counts.get("watch") ?? 0}
          ring="ring-cyan-400/30 bg-cyan-400/5"
          iconClass="text-cyan-300"
          Icon={Bell}
        />
      </div>

      <div className="mt-8 space-y-3">
        {loading && alerts.length === 0 ? (
          <Surface className="p-8 text-center text-xs text-white/85">
            Loading reorder alerts…
          </Surface>
        ) : alerts.length === 0 ? (
          <Surface className="p-8 text-center text-xs text-white/85">
            🎉 Every item is above its reorder threshold.
          </Surface>
        ) : (
          alerts.map((a) => {
            const sev = a.severity ? SEVERITY_STYLE[a.severity] : SEVERITY_STYLE.watch;
            return (
              <Surface
                key={a.itemId}
                className={clsx(
                  "p-5 ring-1 ring-inset transition hover:bg-white/3",
                  sev.ring,
                )}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span
                      className={clsx(
                        "flex h-11 w-11 items-center justify-center rounded-xl",
                        sev.iconBg,
                        sev.icon,
                      )}
                    >
                      <sev.Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-white">{a.name}</h3>
                      <p className="mt-0.5 text-xs uppercase tracking-widest text-white/85">
                        {a.category}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-5">
                    <Stat label="Current"        value={a.current.toString()} />
                    <Stat label="Reorder level"  value={a.reorder.toString()} />
                    <Stat
                      label="Shortfall"
                      value={a.shortfall.toString()}
                      valueClass="text-rose-300"
                    />
                    <Stat
                      label="Suggested order"
                      value={a.suggested.toString()}
                      valueClass="text-emerald-300"
                    />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                        Last supplier
                      </p>
                      <p className="mt-1 text-sm text-white">
                        {a.supplier ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </Surface>
            );
          })
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  sub,
  count,
  ring,
  iconClass,
  Icon,
}: {
  label: string;
  sub: string;
  count: number;
  ring: string;
  iconClass: string;
  Icon: React.ElementType;
}) {
  return (
    <Surface className={clsx("p-5 ring-1 ring-inset", ring)}>
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5",
            iconClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="font-mono text-2xl font-semibold text-white">{count}</p>
      </div>
      <p className="mt-3 text-sm font-medium text-white">{label}</p>
      <p className="mt-0.5 text-xs text-white/90">{sub}</p>
    </Surface>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
        {label}
      </p>
      <p className={clsx("mt-1 font-mono text-base font-semibold text-white", valueClass)}>
        {value}
      </p>
    </div>
  );
}
