"use client";

import { ArrowUpRight, Boxes, AlertTriangle, PackagePlus, PackageMinus } from "lucide-react";
import {
  PageHeader,
  Surface,
  MonoCell,
} from "@/components/ui_components/portal/primitives";
import { getDashboard } from "@/services/dashboard";
import { useService } from "@/services/use-service";

export default function DashboardPage() {
  const { data, loading } = useService(getDashboard, []);

  const kpis = data?.kpis;
  const weekDays = data?.weekDays ?? [];
  const weekDayMax = Math.max(1, ...weekDays.flatMap((d) => [d.in, d.out]));

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 animate-page-in">
      <PageHeader
        eyebrow={`Today · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
        title="Operations dashboard"
        subtitle="A live read on inventory, project consumption, and site throughput across Joshob Construction."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total items in stock"
          value={kpis ? kpis.totalInStock.toLocaleString() : loading ? "…" : "—"}
          sub="across all storage locations"
          accent="from-brand-orange/30 to-brand-orange/0"
          icon={Boxes}
          iconClass="text-brand-orange-bright"
        />
        <KpiCard
          label="Items below reorder"
          value={kpis ? kpis.itemsBelowReorder.toLocaleString() : loading ? "…" : "—"}
          sub="needs review today"
          accent="from-rose-400/30 to-rose-400/0"
          icon={AlertTriangle}
          iconClass="text-rose-300"
        />
        <KpiCard
          label="Today's stock in"
          value={kpis ? kpis.todayStockIn.toLocaleString() : loading ? "…" : "—"}
          sub="units received"
          accent="from-emerald-400/30 to-emerald-400/0"
          icon={PackagePlus}
          iconClass="text-emerald-300"
        />
        <KpiCard
          label="Today's stock out"
          value={kpis ? kpis.todayStockOut.toLocaleString() : loading ? "…" : "—"}
          sub="units issued"
          accent="from-amber-400/30 to-amber-400/0"
          icon={PackageMinus}
          iconClass="text-amber-300"
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Stock in vs stock out
              </h2>
              <p className="mt-1 text-xs text-white/90">Last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/95">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-400" /> In
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-amber-400" /> Out
              </span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-7 items-end gap-3 px-1" style={{ height: 200 }}>
            {weekDays.length === 0 && loading
              ? Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="flex h-44 w-full items-end justify-center gap-1.5">
                    <div className="w-3 animate-pulse rounded-t-sm bg-white/5" style={{ height: "40%" }} />
                    <div className="w-3 animate-pulse rounded-t-sm bg-white/5" style={{ height: "60%" }} />
                  </div>
                ))
              : weekDays.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-2">
                    <div className="flex h-44 w-full items-end justify-center gap-1.5">
                      <div
                        className="w-3 rounded-t-sm bg-linear-to-t from-emerald-500 to-emerald-300"
                        style={{ height: `${(d.in / weekDayMax) * 100}%` }}
                      />
                      <div
                        className="w-3 rounded-t-sm bg-linear-to-t from-amber-500 to-amber-300"
                        style={{ height: `${(d.out / weekDayMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-white/85">
                      {d.day}
                    </span>
                  </div>
                ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Today at a glance
            </h2>
            <a
              href="/portal/reorder-alerts"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-orange transition hover:text-brand-orange-bright"
            >
              Reorder alerts <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <ul className="mt-6 space-y-4 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-white/85">Net flow today</span>
              <MonoCell>
                {kpis ? (kpis.todayStockIn - kpis.todayStockOut).toLocaleString() : "—"}
              </MonoCell>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-white/85">Items needing reorder</span>
              <MonoCell>{kpis?.itemsBelowReorder ?? "—"}</MonoCell>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-white/85">Total units on hand</span>
              <MonoCell>{kpis?.totalInStock?.toLocaleString() ?? "—"}</MonoCell>
            </li>
          </ul>
        </Surface>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <Surface className="overflow-hidden p-5">
      <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${accent} opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85">
            {label}
          </p>
          <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-white/90">{sub}</p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Surface>
  );
}
