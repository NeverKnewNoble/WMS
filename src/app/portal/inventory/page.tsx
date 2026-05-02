"use client";

import { useState } from "react";
import { Search, Upload, Pencil, Trash2 } from "lucide-react";
import {
  PageHeader,
  Surface,
  StatusPill,
  MonoCell,
  fieldClass,
  ToolbarButton,
} from "@/components/ui_components/portal/primitives";
import AddItemDialog from "@/components/modals/add-item";
import EditItemDialog from "@/components/modals/edit-item";
import DeleteItemDialog from "@/components/modals/delete-item";
import { inventoryItems } from "@/utils/sampleData";
import type { Item } from "@/types/inventory";

export default function InventoryPage() {
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);

  const handleConfirmDelete = (_item: Item) => {
    // TODO: wire up to backend; for now just close the dialog.
    setDeleting(null);
  };

  return (
    <div className="px-8 py-10 animate-page-in ">
      <PageHeader
        eyebrow="Inventory"
        title="Item registry"
        subtitle="Manage every SKU in your warehouse — categories, thresholds, and stock levels."
        actions={
          <>
            <ToolbarButton variant="ghost">
              <Upload className="h-4 w-4" /> Upload Excel
            </ToolbarButton>
            <AddItemDialog />
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
              {inventoryItems.map((it) => (
                <tr
                  key={it.rfq}
                  className="border-b border-white/5 transition hover:bg-white/3"
                >
                  <td className="px-6 py-3.5">
                    <MonoCell>{it.rfq}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-white">{it.name}</td>
                  <td className="px-6 py-3.5 text-white/65">{it.category}</td>
                  <td className="px-6 py-3.5 text-white/65">{it.unit}</td>
                  <td className="px-6 py-3.5 text-right">
                    <MonoCell>{it.current.toLocaleString()}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 text-right text-white/55">
                    <MonoCell>{it.reorder}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 text-right text-white/55">
                    <MonoCell>{it.min}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 text-right text-white/55">
                    <MonoCell>{it.max}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusPill tone={it.status}>{it.statusLabel}</StatusPill>
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4 text-xs text-white/50">
          <p>Showing 5 of 5 items</p>
          <div className="flex items-center gap-1">
            <button className="rounded-md px-3 py-1 text-white/60 transition hover:bg-white/5 hover:text-white">
              Previous
            </button>
            <button className="rounded-md bg-white/10 px-3 py-1 font-mono text-white">
              1
            </button>
            <button className="rounded-md px-3 py-1 text-white/60 transition hover:bg-white/5 hover:text-white">
              2
            </button>
            <button className="rounded-md px-3 py-1 text-white/60 transition hover:bg-white/5 hover:text-white">
              Next
            </button>
          </div>
        </div>
      </Surface>

      <EditItemDialog item={editing} onClose={() => setEditing(null)} />
      <DeleteItemDialog
        item={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
