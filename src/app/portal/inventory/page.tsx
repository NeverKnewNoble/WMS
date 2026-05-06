"use client";

import { useCallback, useState } from "react";
import { Search, Pencil, Trash2 } from "lucide-react";
import {
  PageHeader,
  Surface,
  StatusPill,
  MonoCell,
  fieldClass,
  type StatusTone,
} from "@/components/ui_components/portal/primitives";
import AddItemDialog from "@/components/modals/add-item";
import EditItemDialog from "@/components/modals/edit-item";
import DeleteItemDialog from "@/components/modals/delete-item";
import ExcelImportPanel from "@/components/excel/excel-import-panel";
import {
  listItems,
  deleteItem,
  downloadItemsTemplate,
  importItemsExcel,
} from "@/services/items";
import { showSuccessToast } from "@/services/toast";
import { useService } from "@/services/use-service";
import type { ApiItem } from "@/types/items";

const STATUS_TONE: Record<ApiItem["status"], StatusTone> = {
  in_stock: "in-stock",
  low:      "low",
  critical: "critical",
  out:      "out",
};

const STATUS_LABEL: Record<ApiItem["status"], string> = {
  in_stock: "In stock",
  low:      "Low",
  critical: "Critical",
  out:      "Out",
};

export default function InventoryPage() {
  const [editing, setEditing]   = useState<ApiItem | null>(null);
  const [deleting, setDeleting] = useState<ApiItem | null>(null);

  const { data, loading, refetch } = useService(() => listItems(), []);
  const items = data?.data ?? [];

  const handleConfirmDelete = useCallback(
    async (it: ApiItem) => {
      try {
        await deleteItem(it.id);
        showSuccessToast("Item deleted", `${it.name} was removed from the registry.`);
        setDeleting(null);
        refetch();
      } catch {
        // service already toasted; keep dialog open
      }
    },
    [refetch],
  );

  return (
    <div className="px-8 py-10 animate-page-in ">
      <PageHeader
        eyebrow="Inventory"
        title="Item registry"
        subtitle="Manage every SKU in your warehouse — categories, thresholds, and stock levels."
        actions={
          <>
            <ExcelImportPanel
              entityLabel="items"
              onDownload={downloadItemsTemplate}
              onImport={importItemsExcel}
              onImported={refetch}
            />
            <AddItemDialog onCreated={refetch} />
          </>
        }
      />

      <Surface className="mt-8 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              className={`${fieldClass} pl-9`}
              placeholder="Search by name or RFQ number..."
            />
          </div>
          <select className={fieldClass} defaultValue="All">
            <option>All</option>
            <option>Structural</option>
            <option>Finishing</option>
            <option>Electrical</option>
          </select>
          <select className={fieldClass} defaultValue="All">
            <option>All</option>
            <option>In stock</option>
            <option>Low</option>
            <option>Critical</option>
          </select>
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                <th className="px-6 py-3 font-medium">RFQ</th>
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium text-right">Current</th>
                <th className="px-6 py-3 font-medium text-right">Reorder</th>
                <th className="px-6 py-3 font-medium text-right">Min</th>
                <th className="px-6 py-3 font-medium text-right">Max</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-xs text-white/40">
                    Loading inventory…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-xs text-white/40">
                    No items yet. Click <span className="text-white/70">Add item</span> to register your first SKU.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr
                    key={it.id}
                    className="border-b border-white/5 transition hover:bg-white/3"
                  >
                    <td className="px-6 py-3.5">
                      <MonoCell>{it.rfq}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-white">{it.name}</td>
                    <td className="px-6 py-3.5 text-white/65">{it.category.label}</td>
                    <td className="px-6 py-3.5 text-white/65">{it.unit.label}</td>
                    <td className="px-6 py-3.5 text-right">
                      <MonoCell>{it.currentStock.toLocaleString()}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5 text-right text-white/55">
                      <MonoCell>{it.reorderLevel}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5 text-right text-white/55">
                      <MonoCell>{it.minStock}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5 text-right text-white/55">
                      <MonoCell>{it.maxStock}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusPill tone={STATUS_TONE[it.status]}>
                        {STATUS_LABEL[it.status]}
                      </StatusPill>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(it)}
                          aria-label={`Edit ${it.name}`}
                          className="rounded-md p-1.5 text-white/50 transition hover:bg-white/5 hover:text-sky-300"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(it)}
                          aria-label={`Delete ${it.name}`}
                          className="rounded-md p-1.5 text-white/50 transition hover:bg-white/5 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4 text-xs text-white/50">
          <p>
            {data
              ? `Showing ${items.length} of ${data.total} item${data.total === 1 ? "" : "s"}`
              : "—"}
          </p>
        </div>
      </Surface>

      <EditItemDialog
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />
      <DeleteItemDialog
        item={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
