"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import {
  PageHeader,
  Surface,
  MonoCell,
  fieldClass,
} from "@/components/ui_components/portal/primitives";
import AddStockOutDialog from "@/components/modals/add-stock-out";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import ExcelImportPanel from "@/components/excel/excel-import-panel";
import {
  listMovements,
  deleteMovement,
  downloadMovementsTemplate,
  importMovementsExcel,
} from "@/services/stock-movements";
import { showSuccessToast } from "@/services/toast";
import { useService } from "@/services/use-service";
import { useTableFilters, distinctOptions } from "@/lib/table-filters";
import type { MovementRow } from "@/types/stock-movements";

export default function StockOutPage() {
  const [deleting, setDeleting] = useState<MovementRow | null>(null);

  const { data, loading, refetch } = useService(
    () => listMovements({ kind: "operations", direction: "out" }),
    [],
  );
  const movements = useMemo(() => data?.data ?? [], [data]);

  const projectOptions = useMemo(
    () =>
      distinctOptions(movements, (m) =>
        m.project ? `${m.project.wbs} — ${m.project.name}` : null,
      ),
    [movements],
  );

  const { query, setQuery, filters, setFilter, filtered } = useTableFilters<
    MovementRow,
    "date" | "project"
  >(movements, {
    searchFields: [
      (m) => m.refNo,
      (m) => m.project?.name,
      (m) => m.project?.wbs,
      (m) => m.lines[0]?.itemName,
      (m) => m.lines[0]?.itemRfq,
    ],
    filters: {
      date:    { allValue: "", predicate: (m, v) => m.movementDate.slice(0, 10) === v },
      project: {
        predicate: (m, v) =>
          m.project ? `${m.project.wbs} — ${m.project.name}` === v : false,
      },
    },
  });

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await deleteMovement(deleting.id);
      showSuccessToast("MRN deleted", `${deleting.refNo} was removed.`);
      setDeleting(null);
      refetch();
    } catch {
      // toast already shown
    }
  }, [deleting, refetch]);

  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Inventory · Material requisition notes"
        title="Stock out — MRN"
        subtitle="Issue materials to projects and capture the full chain of authorisation."
        actions={
          <>
            <ExcelImportPanel
              entityLabel="MRNs"
              onDownload={() => downloadMovementsTemplate("out")}
              onImport={(file) => importMovementsExcel("out", file)}
              onImported={refetch}
            />
            <AddStockOutDialog onCreated={refetch} />
          </>
        }
      />

      <Surface className="mt-8 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              className={`${fieldClass} pl-9`}
              placeholder="Search MRN, item, or project..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <input
            className={fieldClass}
            type="date"
            value={filters.date}
            onChange={(e) => setFilter("date", e.target.value)}
          />
          <select
            className={fieldClass}
            value={filters.project}
            onChange={(e) => setFilter("project", e.target.value)}
          >
            <option value="all">All projects</option>
            {projectOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white">
                <th className="px-6 py-3 font-medium">MRN</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-6 py-3 font-medium text-right">Qty</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium">WBS</th>
                <th className="px-6 py-3 font-medium">Serial</th>
                <th className="px-6 py-3 font-medium">Activity</th>
                <th className="px-6 py-3 font-medium">Authorised by</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && movements.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-xs text-white/85">
                    Loading MRNs…
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-xs text-white/85">
                    No MRNs yet. Click <span className="text-white/85">Add stock out</span> to issue materials.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-xs text-white/85">
                    No MRNs match the current search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const line = m.lines[0];
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-white/5 transition hover:bg-white/3"
                    >
                      <td className="px-6 py-3.5"><MonoCell>{m.refNo}</MonoCell></td>
                      <td className="px-6 py-3.5"><MonoCell>{m.movementDate.slice(0, 10)}</MonoCell></td>
                      <td className="px-6 py-3.5 font-medium text-white">{line?.itemName ?? "—"}</td>
                      <td className="px-6 py-3.5 text-right">
                        <MonoCell>{line?.qty.toLocaleString() ?? "—"}</MonoCell>
                      </td>
                      <td className="px-6 py-3.5 text-white/65">{line?.unit ?? "—"}</td>
                      <td className="px-6 py-3.5 text-white/65">{m.project?.name ?? "—"}</td>
                      <td className="px-6 py-3.5">
                        {m.project ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/5 font-mono text-[11px] font-semibold text-white">
                            {m.project.wbs}
                          </span>
                        ) : (
                          <span className="text-white/85">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5"><MonoCell>{line?.itemRfq ?? "—"}</MonoCell></td>
                      <td className="px-6 py-3.5 text-white/65">{m.activity ?? "—"}</td>
                      <td className="px-6 py-3.5 text-white/65">{m.authorisedBy?.fullName ?? "—"}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setDeleting(m)}
                            aria-label={`Delete ${m.refNo}`}
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
          <p>{data ? `Showing ${filtered.length} of ${data.total} entries` : "—"}</p>
        </div>
      </Surface>

      <ConfirmDeleteDialog
        open={!!deleting}
        title="Delete this MRN?"
        message={
          <>
            You&apos;re about to remove requisition{" "}
            <span className="font-mono text-white">{deleting?.refNo}</span>.
            The stock-cache trigger will reverse its effect on{" "}
            <span className="text-white">items.current_stock</span>.{" "}
            <span className="text-rose-300/90">This action cannot be undone.</span>
          </>
        }
        details={
          deleting
            ? [
                { label: "Date",    value: deleting.movementDate.slice(0, 10) },
                { label: "Project", value: deleting.project?.name ?? "—" },
                {
                  label: "Quantity",
                  value: deleting.lines[0]
                    ? `${deleting.lines[0].qty} ${deleting.lines[0].unit}`
                    : "—",
                },
              ]
            : undefined
        }
        confirmLabel="Delete MRN"
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
