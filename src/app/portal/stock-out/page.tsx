"use client";

import { useState } from "react";
import { Search, Trash2, Upload } from "lucide-react";
import {
  PageHeader,
  Surface,
  MonoCell,
  fieldClass,
  ToolbarButton,
} from "@/components/ui_components/portal/primitives";
import AddStockOutDialog from "@/components/modals/add-stock-out";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import { stockOutMrns } from "@/utils/sampleData";
import type { MRN } from "@/types/stock-out";

export default function StockOutPage() {
  const [deleting, setDeleting] = useState<MRN | null>(null);

  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Inventory · Material requisition notes"
        title="Stock out — MRN"
        subtitle="Issue materials to projects and capture the full chain of authorisation."
        actions={
          <>
            <ToolbarButton variant="ghost">
              <Upload className="h-4 w-4" /> Upload Excel
            </ToolbarButton>
            <AddStockOutDialog />
          </>
        }
      />

      <Surface className="mt-8 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              className={`${fieldClass} pl-9`}
              placeholder="Search MRN, item, or project..."
            />
          </div>
          <input className={fieldClass} type="date" />
          <select className={fieldClass} defaultValue="All Projects">
            <option>All Projects</option>
            <option>Block A Construction</option>
            <option>Block B Roofing</option>
          </select>
          <select className={fieldClass} defaultValue="All Departments">
            <option>All Departments</option>
            <option>Civil</option>
            <option>Engineering</option>
          </select>
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                <th className="px-6 py-3 font-medium">MRN</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-6 py-3 font-medium text-right">Qty</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium">Project</th>
                <th className="px-6 py-3 font-medium">WBS</th>
                <th className="px-6 py-3 font-medium">RFQ</th>
                <th className="px-6 py-3 font-medium">Dept</th>
                <th className="px-6 py-3 font-medium">Activity</th>
                <th className="px-6 py-3 font-medium">Issued to</th>
                <th className="px-6 py-3 font-medium">Authorised by</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockOutMrns.map((m) => (
                <tr
                  key={m.mrn}
                  className="border-b border-white/5 transition hover:bg-white/3"
                >
                  <td className="px-6 py-3.5">
                    <MonoCell>{m.mrn}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{m.date}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-white">{m.item}</td>
                  <td className="px-6 py-3.5 text-right">
                    <MonoCell>{m.qty}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 text-white/65">{m.unit}</td>
                  <td className="px-6 py-3.5 text-white/65">{m.project}</td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/5 font-mono text-[11px] font-semibold text-white">
                      {m.wbs}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{m.rfq}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 text-white/65">{m.dept}</td>
                  <td className="px-6 py-3.5 text-white/65">{m.activity}</td>
                  <td className="px-6 py-3.5 text-white/65">{m.issuedTo}</td>
                  <td className="px-6 py-3.5 text-white/65">{m.authorisedBy}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleting(m)}
                        aria-label={`Delete ${m.mrn}`}
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
          <p>Showing {stockOutMrns.length} entries</p>
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
        title="Delete this MRN?"
        message={
          <>
            You&apos;re about to remove requisition{" "}
            <span className="font-mono text-white">{deleting?.mrn}</span> for{" "}
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
                { label: "Project", value: deleting.project },
                {
                  label: "Quantity",
                  value: `${deleting.qty} ${deleting.unit}`,
                },
                { label: "Issued to", value: deleting.issuedTo },
              ]
            : undefined
        }
        confirmLabel="Delete MRN"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          // TODO: wire up to backend.
          setDeleting(null);
        }}
      />
    </div>
  );
}
