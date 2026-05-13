"use client";

import { useCallback, useMemo, useState } from "react";
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
import { useRole } from "@/components/providers/role-provider";
import { useTableFilters, distinctOptions } from "@/lib/table-filters";
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
  const { canDelete } = useRole();
  const [editing, setEditing]   = useState<ApiItem | null>(null);
  const [deleting, setDeleting] = useState<ApiItem | null>(null);

  const { data, loading, refetch } = useService(() => listItems(), []);
  const items = useMemo(() => data?.data ?? [], [data]);

  const categoryOptions = useMemo(
    () => distinctOptions(items, (it) => it.category.label),
    [items],
  );

  const { query, setQuery, filters, setFilter, filtered } = useTableFilters<
    ApiItem,
    "category" | "status"
  >(items, {
    searchFields: [(it) => it.name, (it) => it.rfq],
    filters: {
      category: {
        predicate: (it, v) => it.category.label === v,
      },
      status: {
        predicate: (it, v) => it.status === v,
      },
    },
  });

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
        subtitle="Every SKU on every site — categories, reorder thresholds, and live stock levels."
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
              placeholder="Search by name or serial..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className={fieldClass}
            value={filters.category}
            onChange={(e) => setFilter("category", e.target.value)}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className={fieldClass}
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="in_stock">In stock</option>
            <option value="low">Low</option>
            <option value="critical">Critical</option>
            <option value="out">Out</option>
          </select>
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white">
                <th className="px-6 py-3 font-medium">Serial</th>
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
                  <td colSpan={10} className="px-6 py-10 text-center text-xs text-white/85">
                    Loading inventory…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-xs text-white/85">
                    No items yet. Click <span className="text-white/85">Add item</span> to register your first SKU.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-xs text-white/85">
                    No items match the current search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
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
                    <td className="px-6 py-3.5 text-right text-white/90">
                      <MonoCell>{it.reorderLevel}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5 text-right text-white/90">
                      <MonoCell>{it.minStock}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5 text-right text-white/90">
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
                          className="rounded-md p-1.5 text-white/90 transition hover:bg-white/5 hover:text-brand-orange-bright"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleting(it)}
                            aria-label={`Delete ${it.name}`}
                            className="rounded-md p-1.5 text-white/90 transition hover:bg-white/5 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4 text-xs text-white/90">
          <p>
            {data
              ? `Showing ${filtered.length} of ${data.total} item${data.total === 1 ? "" : "s"}`
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
