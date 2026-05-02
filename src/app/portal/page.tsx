import { Search, ArrowUpRight } from "lucide-react";
import {
  PageHeader,
  Surface,
  StatusPill,
  MonoCell,
  fieldClass,
} from "@/components/ui_components/portal/primitives";
import {
  dashboardKpis,
  dashboardProjects,
  topMaterials,
  weekDays,
  weekDayMax,
  dashboardStatusToTone,
} from "@/utils/sampleData";

export default function DashboardPage() {
  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Today · Apr 27, 2026"
        title="Operations dashboard"
        subtitle="A live read on inventory, project consumption, and warehouse throughput."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map((k) => (
          <Surface key={k.label} className="overflow-hidden p-5">
            <div
              className={`pointer-events-none absolute inset-0 bg-linear-to-br ${k.accent} opacity-60`}
            />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  {k.label}
                </p>
                <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-white">
                  {k.value}
                </p>
                <p className="mt-1 text-xs text-white/55">{k.sub}</p>
              </div>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${k.iconClass}`}
              >
                <k.icon className="h-5 w-5" />
              </span>
            </div>
          </Surface>
        ))}
      </div>

      <Surface className="mt-8 overflow-hidden">
        <div className="flex flex-col gap-4 px-6 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Project material consumption
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Showing 22 of 22 active projects.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search by WBS code or project name..."
              className={`${fieldClass} pl-9`}
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-y border-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                <th className="px-6 py-3 font-medium">WBS</th>
                <th className="px-6 py-3 font-medium">Project name</th>
                <th className="px-6 py-3 font-medium">Items issued</th>
                <th className="px-6 py-3 font-medium">Qty consumed</th>
                <th className="px-6 py-3 font-medium">Most issued</th>
                <th className="px-6 py-3 font-medium">Last issue</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardProjects.map((p) => (
                <tr
                  key={p.name}
                  className="border-b border-white/5 transition hover:bg-white/3"
                >
                  <td className="px-6 py-3.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/5 font-mono text-xs font-semibold text-white">
                      {p.wbs}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-white">{p.name}</td>
                  <td className="px-6 py-3.5 text-white/70">{p.totalIssued}</td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{p.totalQty}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 text-white/70">{p.topItem}</td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{p.lastIssue}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusPill tone={dashboardStatusToTone[p.status]}>{p.status}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Top 5 materials by stock out
              </h2>
              <p className="mt-1 text-xs text-white/50">Last 30 days · units issued</p>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-sky-300 hover:text-sky-200">
              Details <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="mt-6 space-y-4">
            {topMaterials.map((m) => (
              <li key={m.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{m.name}</span>
                  <MonoCell>{m.value.toLocaleString()}</MonoCell>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-sky-400 to-emerald-400"
                    style={{ width: `${(m.value / m.max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Stock in vs stock out
              </h2>
              <p className="mt-1 text-xs text-white/50">Last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-400" /> In
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-amber-400" /> Out
              </span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-7 items-end gap-3 px-1" style={{ height: 200 }}>
            {weekDays.map((d) => (
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
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}
