"use client";

import { useCallback, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import {
  PageHeader,
  Surface,
  StatusPill,
  fieldClass,
} from "@/components/ui_components/portal/primitives";
import AddSupplierDialog from "@/components/modals/add-supplier";
import EditSupplierDialog from "@/components/modals/edit-supplier";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import { deleteSupplier, listSuppliers } from "@/services/suppliers";
import { showSuccessToast } from "@/services/toast";
import { useService } from "@/services/use-service";
import type { SupplierRow } from "@/types/lookups";

export default function SuppliersPage() {
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [deleting, setDeleting] = useState<SupplierRow | null>(null);

  const { data, loading, refetch } = useService(() => listSuppliers(), []);
  const suppliers = data?.data ?? [];

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await deleteSupplier(deleting.id);
      showSuccessToast("Supplier deleted", `${deleting.name} was removed.`);
      setDeleting(null);
      refetch();
    } catch {
      // toast already shown
    }
  }, [deleting, refetch]);

  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Reference"
        title="Suppliers"
        subtitle="Vendors that show up in stock-in receipts and item defaults."
        actions={<AddSupplierDialog onCreated={refetch} />}
      />

      <Surface className="mt-8 p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            className={`${fieldClass} pl-9`}
            placeholder="Search by name, contact, or phone..."
          />
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Address</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-xs text-white/40">
                    Loading suppliers…
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-xs text-white/40">
                    No suppliers yet. Click <span className="text-white/70">Add supplier</span> to start.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-white/5 transition hover:bg-white/3"
                  >
                    <td className="px-6 py-3.5 font-medium text-white">{s.name}</td>
                    <td className="px-6 py-3.5 text-white/65">{s.contactName ?? "—"}</td>
                    <td className="px-6 py-3.5 text-white/65">{s.email ?? "—"}</td>
                    <td className="px-6 py-3.5 text-white/65">{s.phone ?? "—"}</td>
                    <td className="px-6 py-3.5 text-white/65">{s.address ?? "—"}</td>
                    <td className="px-6 py-3.5">
                      <StatusPill tone={s.isActive ? "active" : "out"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </StatusPill>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(s)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 transition hover:border-brand-orange/30 hover:bg-brand-orange/10 hover:text-brand-orange-bright"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(s)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      <EditSupplierDialog
        supplier={editing}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        title="Delete this supplier?"
        message={
          <>
            You&apos;re about to remove{" "}
            <span className="font-medium text-white">{deleting?.name}</span> from
            the supplier registry.{" "}
            <span className="text-rose-300/90">This action cannot be undone.</span>
          </>
        }
        details={
          deleting
            ? [
                { label: "Contact", value: deleting.contactName ?? "—" },
                { label: "Email", value: deleting.email ?? "—" },
                { label: "Phone", value: deleting.phone ?? "—" },
                { label: "Status", value: deleting.isActive ? "Active" : "Inactive" },
              ]
            : undefined
        }
        confirmLabel="Delete supplier"
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
