import {
  PageHeader,
  Surface,
  MonoCell,
} from "@/components/ui_components/portal/primitives";
import { clsx } from "clsx";
import {
  reorderSummary,
  reorderAlerts,
  severityStyle,
} from "@/utils/sampleData";

export default function ReorderAlertsPage() {
  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Inventory · Alerts"
        title="Reorder alerts"
        subtitle="Monitor and act on low-stock items before they impact a project."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reorderSummary.map((s) => (
          <Surface
            key={s.key}
            className={clsx("p-5 ring-1 ring-inset", s.ring)}
          >
            <div className="flex items-center justify-between">
              <span
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5",
                  s.iconClass,
                )}
              >
                <s.icon className="h-4 w-4" />
              </span>
              <p className="font-mono text-2xl font-semibold text-white">
                {s.count}
              </p>
            </div>
            <p className="mt-3 text-sm font-medium text-white">{s.label}</p>
            <p className="mt-0.5 text-xs text-white/50">{s.sub}</p>
          </Surface>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {reorderAlerts.map((a) => {
          const sev = severityStyle[a.severity];
          return (
            <Surface
              key={a.name}
              className={clsx("p-5 ring-1 ring-inset transition hover:bg-white/3", sev.ring)}
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
                    <p className="mt-0.5 text-xs uppercase tracking-widest text-white/45">
                      {a.category}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-5">
                  <Stat label="Current" value={a.current.toString()} />
                  <Stat label="Reorder level" value={a.reorder.toString()} />
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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                      Last supplier
                    </p>
                    <p className="mt-1 text-sm text-white">{a.supplier}</p>
                  </div>
                </div>
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
      <p className={clsx("mt-1 font-mono text-base font-semibold text-white", valueClass)}>
        {value}
      </p>
    </div>
  );
}
