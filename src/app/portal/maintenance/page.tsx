"use client";

import { useMemo, useState } from "react";
import { Search, PackagePlus, PackageMinus, Trash2 } from "lucide-react";
import {
  PageHeader,
  Surface,
  MonoCell,
  fieldClass,
} from "@/components/ui_components/portal/primitives";
import AddStockInDialog from "@/components/modals/add-stock-in";
import AddStockOutDialog from "@/components/modals/add-stock-out";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import { clsx } from "clsx";
import {
  maintenanceStockIn,
  maintenanceStockOut,
} from "@/utils/sampleData";
import type { MaintenanceReceipt } from "@/types/maintenance";

type Direction = "in" | "out";
type MaintenanceMovement = MaintenanceReceipt & { direction: Direction };

const FILTERS = [
  { key: "all", label: "All movements" },
  { key: "in", label: "Stock in" },
  { key: "out", label: "Stock out" },
] as const;

export default function MaintenancePage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [deleting, setDeleting] = useState<MaintenanceMovement | null>(null);

  const movements = useMemo<MaintenanceMovement[]>(() => {
    const merged: MaintenanceMovement[] = [
      ...maintenanceStockIn.map((r) => ({ ...r, direction: "in" as const })),
      ...maintenanceStockOut.map((r) => ({ ...r, direction: "out" as const })),
    ];
    return merged.sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const rows = useMemo(
    () =>
      filter === "all"
        ? movements
        : movements.filter((m) => m.direction === filter),
    [movements, filter],
  );

  const inCount = movements.filter((m) => m.direction === "in").length;
  const outCount = movements.length - inCount;

  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Operations · Spares & consumables"
        title="Maintenance"
        subtitle="Unified ledger of every maintenance part moving in and out — by site, technician, and application."
        actions={
          <>
            <AddStockInDialog />
            <AddStockOutDialog />
          </>
        }
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-full border border-white/10 bg-white/3 p-1">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? movements.length
                : f.key === "in"
                  ? inCount
                  : outCount;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-medium transition",
                  filter === f.key
                    ? "bg-white text-zinc-900"
                    : "text-white/60 hover:text-white",
                )}
              >
                {f.label}
                <span
                  className={clsx(
                    "rounded-full px-1.5 py-0.5 font-mono text-[10px]",
                    filter === f.key
                      ? "bg-zinc-900/10 text-zinc-900/70"
                      : "bg-white/8 text-white/55",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Surface className="mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input className={`${fieldClass} pl-9`} placeholder="Search items..." />
          </div>
          <input className={fieldClass} type="date" />
          <select className={fieldClass} defaultValue="All Categories">
            <option>All Categories</option>
            <option>Mechanical Parts</option>
            <option>HVAC Parts</option>
            <option>Electrical Parts</option>
          </select>
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Receipt no</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Item / part</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Manufacturer</th>
                <th className="px-6 py-3 font-medium">Vendor</th>
                <th className="px-6 py-3 font-medium text-right">Qty</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium">Storage</th>
                <th className="px-6 py-3 font-medium">Application</th>
                <th className="px-6 py-3 font-medium">Site</th>
                <th className="px-6 py-3 font-medium">Technician</th>
                <th className="px-6 py-3 font-medium">RFQ</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={`${r.direction}-${r.no}`}
                  className="border-b border-white/5 transition hover:bg-white/3"
                >
                  <td className="px-6 py-3.5">
                    <MovementPill direction={r.direction} />
                  </td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{r.no}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{r.date}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-white">{r.item}</td>
                  <td className="px-6 py-3.5 text-white/65">{r.category}</td>
                  <td className="px-6 py-3.5 text-white/65">{r.manufacturer}</td>
                  <td className="px-6 py-3.5 text-white/65">{r.vendor}</td>
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={clsx(
                        "font-mono text-[12.5px] tracking-tight",
                        r.direction === "in"
                          ? "text-emerald-300"
                          : "text-amber-300",
                      )}
                    >
                      {r.direction === "in" ? "+" : "−"}
                      {r.qty}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-white/65">{r.unit}</td>
                  <td className="px-6 py-3.5 text-white/65">{r.storage}</td>
                  <td className="px-6 py-3.5 text-white/65">{r.application}</td>
                  <td className="px-6 py-3.5 text-white/65">{r.site}</td>
                  <td className="px-6 py-3.5 text-white/65">{r.technician}</td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{r.rfq}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleting(r)}
                        aria-label={`Delete ${r.no}`}
                        className="rounded-md p-1.5 text-white/50 transition hover:bg-white/5 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={15}
                    className="px-6 py-10 text-center text-xs text-white/40"
                  >
                    No movements match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4 text-xs text-white/50">
          <p>
            Showing {rows.length}{" "}
            {filter === "all" ? "movements" : filter === "in" ? "inbound" : "outbound"}{" "}
            of {movements.length}
          </p>
          <div className="flex items-center gap-1">
            <button className="rounded-md px-3 py-1 text-white/60 transition hover:bg-white/5 hover:text-white">
              Previous
            </button>
            <button className="rounded-md bg-white/10 px-3 py-1 font-mono text-white">
              1
            </button>
            <button className="rounded-md px-3 py-1 text-white/60 transition hover:bg-white/5 hover:text-white">
              Next
            </button>
          </div>
        </div>
      </Surface>

      <ConfirmDeleteDialog
        open={!!deleting}
        title={
          deleting?.direction === "in"
            ? "Delete this maintenance receipt?"
            : "Delete this maintenance issue?"
        }
        message={
          <>
            You&apos;re about to remove{" "}
            <span className="font-mono text-white">{deleting?.no}</span> for{" "}
            <span className="font-medium text-white">{deleting?.item}</span>.
            Stock levels will not be auto-adjusted.{" "}
            <span className="text-rose-300/90">
              This action cannot be undone.
            </span>
          </>
        }
        details={
          deleting
            ? [
                {
                  label: "Type",
                  value:
                    deleting.direction === "in" ? "Stock in" : "Stock out",
                },
                { label: "Date", value: deleting.date },
                {
                  label: "Quantity",
                  value: `${deleting.qty} ${deleting.unit}`,
                },
                { label: "Site", value: deleting.site },
                { label: "Technician", value: deleting.technician },
                { label: "Application", value: deleting.application },
              ]
            : undefined
        }
        confirmLabel="Delete record"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          // TODO: wire up to backend.
          setDeleting(null);
        }}
      />
    </div>
  );
}

function MovementPill({ direction }: { direction: Direction }) {
  if (direction === "in") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
        <PackagePlus className="h-3 w-3" />
        Stock in
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-amber-300 ring-1 ring-inset ring-amber-400/20">
      <PackageMinus className="h-3 w-3" />
      Stock out
    </span>
  );
}
