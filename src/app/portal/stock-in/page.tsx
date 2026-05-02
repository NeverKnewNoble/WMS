"use client";

import { useState } from "react";
import { Search, Trash2, Upload } from "lucide-react";
import {
  PageHeader,
  Surface,
  StatusPill,
  MonoCell,
  fieldClass,
  ToolbarButton,
} from "@/components/ui_components/portal/primitives";
import AddStockInDialog from "@/components/modals/add-stock-in";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import { stockInReceipts } from "@/utils/sampleData";
import type { StockInReceipt } from "@/types/stock-in";

export default function StockInPage() {
  const [deleting, setDeleting] = useState<StockInReceipt | null>(null);

  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Inventory · Goods received"
        title="Stock in"
        subtitle="Track every incoming material delivery — supplier, quantity, condition, and chain of custody."
        actions={
          <>
            <ToolbarButton variant="ghost">
              <Upload className="h-4 w-4" /> Upload Excel
            </ToolbarButton>
            <AddStockInDialog />
          </>
        }
      />

      <Surface className="mt-8 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              className={`${fieldClass} pl-9`}
              placeholder="Search GRN, item, or supplier..."
            />
          </div>
          <input className={fieldClass} type="date" />
          <select className={fieldClass} defaultValue="All Suppliers">
            <option>All Suppliers</option>
            <option>GHACEM Ltd</option>
            <option>Steel Corp</option>
            <option>ColorPro Ghana</option>
          </select>
          <select className={fieldClass} defaultValue="All Categories">
            <option>All Categories</option>
            <option>Structural</option>
            <option>Finishing</option>
            <option>Electrical</option>
          </select>
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                <th className="px-6 py-3 font-medium">GRN</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium text-right">Qty</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium">Supplier</th>
                <th className="px-6 py-3 font-medium">RFQ</th>
                <th className="px-6 py-3 font-medium">Dept</th>
                <th className="px-6 py-3 font-medium">WBS</th>
                <th className="px-6 py-3 font-medium">Received by</th>
                <th className="px-6 py-3 font-medium">Condition</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockInReceipts.map((r) => (
                <tr
                  key={r.grn}
                  className="border-b border-white/5 transition hover:bg-white/3"
                >
                  <td className="px-6 py-3.5">
                    <MonoCell>{r.grn}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{r.date}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-white">{r.item}</td>
                  <td className="px-6 py-3.5 text-white/65">{r.category}</td>
                  <td className="px-6 py-3.5 text-right">
                    <MonoCell>{r.qty}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 text-white/65">{r.unit}</td>
                  <td className="px-6 py-3.5 text-white/65">{r.supplier}</td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{r.rfq}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 text-white/65">{r.dept}</td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/5 font-mono text-[11px] font-semibold text-white">
                      {r.wbs}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-white/65">{r.receivedBy}</td>
                  <td className="px-6 py-3.5">
                    <StatusPill tone="good">Good</StatusPill>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleting(r)}
                        aria-label={`Delete ${r.grn}`}
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
          <p>Showing {stockInReceipts.length} entries</p>
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
        title="Delete this GRN?"
        message={
          <>
            You&apos;re about to remove receipt{" "}
            <span className="font-mono text-white">{deleting?.grn}</span> for{" "}
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
                { label: "Date", value: deleting.date },
                { label: "Supplier", value: deleting.supplier },
                {
                  label: "Quantity",
                  value: `${deleting.qty} ${deleting.unit}`,
                },
                { label: "Received by", value: deleting.receivedBy },
              ]
            : undefined
        }
        confirmLabel="Delete receipt"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          // TODO: wire up to backend.
          setDeleting(null);
        }}
      />
    </div>
  );
}
