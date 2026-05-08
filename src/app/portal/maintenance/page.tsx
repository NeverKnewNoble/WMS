"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, PackagePlus, PackageMinus, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import {
  PageHeader,
  Surface,
  MonoCell,
  fieldClass,
} from "@/components/ui_components/portal/primitives";
import AddStockInDialog from "@/components/modals/add-stock-in";
import AddStockOutDialog from "@/components/modals/add-stock-out";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import { listMovements, deleteMovement } from "@/services/stock-movements";
import { showSuccessToast } from "@/services/toast";
import { useService } from "@/services/use-service";
import type {
  MovementDirection,
  MovementRow,
} from "@/types/stock-movements";

const FILTERS = [
  { key: "all", label: "All movements" },
  { key: "in", label: "Stock in" },
  { key: "out", label: "Stock out" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function MaintenancePage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [deleting, setDeleting] = useState<MovementRow | null>(null);

  const { data, loading, refetch } = useService(
    () => listMovements({ kind: "maintenance" }),
    [],
  );

  const movements = data?.data ?? [];

  const rows = useMemo(
    () =>
      filter === "all"
        ? movements
        : movements.filter((m) => m.direction === filter),
    [movements, filter],
  );

  const inCount  = movements.filter((m) => m.direction === "in").length;
  const outCount = movements.length - inCount;

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await deleteMovement(deleting.id);
      showSuccessToast("Record deleted", `${deleting.refNo} was removed.`);
      setDeleting(null);
      refetch();
    } catch {
      // toast already shown
    }
  }, [deleting, refetch]);

  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Operations · Spares & consumables"
        title="Maintenance"
        subtitle="Unified ledger of every maintenance part moving in and out — by site, technician, and application."
        actions={
          <>
            <AddStockInDialog onCreated={refetch} />
            <AddStockOutDialog onCreated={refetch} />
          </>
        }
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-full border border-white/10 bg-white/3 p-1">
          {FILTERS.map((f) => {
            const count =
              f.key === "all" ? movements.length : f.key === "in" ? inCount : outCount;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-medium transition",
                  filter === f.key
                    ? "bg-white text-zinc-900"
                    : "text-white/95 hover:text-white",
                )}
              >
                {f.label}
                <span
                  className={clsx(
                    "rounded-full px-1.5 py-0.5 font-mono text-[10px]",
                    filter === f.key
                      ? "bg-zinc-900/10 text-zinc-900/70"
                      : "bg-white/8 text-white/90",
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
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white">
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Receipt no</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Item / part</th>
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
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-10 text-center text-xs text-white/85">
                    Loading maintenance ledger…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-10 text-center text-xs text-white/85">
                    No movements match the current filter.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const line = r.lines[0];
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-white/5 transition hover:bg-white/3"
                    >
                      <td className="px-6 py-3.5">
                        <MovementPill direction={r.direction} />
                      </td>
                      <td className="px-6 py-3.5"><MonoCell>{r.refNo}</MonoCell></td>
                      <td className="px-6 py-3.5"><MonoCell>{r.movementDate.slice(0, 10)}</MonoCell></td>
                      <td className="px-6 py-3.5 font-medium text-white">{line?.itemName ?? "—"}</td>
                      <td className="px-6 py-3.5 text-white/65">{r.manufacturer?.name ?? "—"}</td>
                      <td className="px-6 py-3.5 text-white/65">{r.supplier?.name ?? "—"}</td>
                      <td className="px-6 py-3.5 text-right">
                        <span
                          className={clsx(
                            "font-mono text-[12.5px] tracking-tight",
                            r.direction === "in" ? "text-emerald-300" : "text-amber-300",
                          )}
                        >
                          {r.direction === "in" ? "+" : "−"}
                          {line?.qty.toLocaleString() ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-white/65">{line?.unit ?? "—"}</td>
                      <td className="px-6 py-3.5 text-white/65">{r.storageLocation?.label ?? "—"}</td>
                      <td className="px-6 py-3.5 text-white/65">{r.application ?? "—"}</td>
                      <td className="px-6 py-3.5 text-white/65">{r.site?.label ?? "—"}</td>
                      <td className="px-6 py-3.5 text-white/65">{r.technician?.fullName ?? "—"}</td>
                      <td className="px-6 py-3.5"><MonoCell>{r.rfq ?? "—"}</MonoCell></td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setDeleting(r)}
                            aria-label={`Delete ${r.refNo}`}
                            className="rounded-md p-1.5 text-white/90 transition hover:bg-white/5 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4 text-xs text-white/90">
          <p>
            Showing {rows.length}{" "}
            {filter === "all" ? "movements" : filter === "in" ? "inbound" : "outbound"}{" "}
            of {movements.length}
          </p>
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
            <span className="font-mono text-white">{deleting?.refNo}</span>. The
            stock-cache trigger will reverse its effect on{" "}
            <span className="text-white">items.current_stock</span>.{" "}
            <span className="text-rose-300/90">This action cannot be undone.</span>
          </>
        }
        details={
          deleting
            ? [
                {
                  label: "Type",
                  value: deleting.direction === "in" ? "Stock in" : "Stock out",
                },
                { label: "Date", value: deleting.movementDate.slice(0, 10) },
                {
                  label: "Quantity",
                  value: deleting.lines[0]
                    ? `${deleting.lines[0].qty} ${deleting.lines[0].unit}`
                    : "—",
                },
                { label: "Site",        value: deleting.site?.label ?? "—" },
                { label: "Technician",  value: deleting.technician?.fullName ?? "—" },
                { label: "Application", value: deleting.application ?? "—" },
              ]
            : undefined
        }
        confirmLabel="Delete record"
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function MovementPill({ direction }: { direction: MovementDirection }) {
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
