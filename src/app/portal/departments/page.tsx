"use client";

import { useCallback, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import {
  PageHeader,
  Surface,
  MonoCell,
  fieldClass,
} from "@/components/ui_components/portal/primitives";
import AddDepartmentDialog from "@/components/modals/add-department";
import EditDepartmentDialog from "@/components/modals/edit-department";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import { deleteDepartment, listDepartments } from "@/services/departments";
import { showSuccessToast } from "@/services/toast";
import { useService } from "@/services/use-service";
import type { DepartmentRow } from "@/types/lookups";

export default function DepartmentsPage() {
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const [deleting, setDeleting] = useState<DepartmentRow | null>(null);

  const { data, loading, refetch } = useService(() => listDepartments(), []);
  const departments = data?.data ?? [];

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await deleteDepartment(deleting.id);
      showSuccessToast("Department deleted", `${deleting.label} was removed.`);
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
        title="Departments"
        subtitle="Organisational units used for staff assignment and material issue tracking."
        actions={<AddDepartmentDialog onCreated={refetch} />}
      />

      <Surface className="mt-8 p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            className={`${fieldClass} pl-9`}
            placeholder="Search by code or label..."
          />
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white">
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Label</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-white/85">
                    Loading departments…
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-xs text-white/85">
                    No departments yet. Click <span className="text-white/85">Add department</span> to start.
                  </td>
                </tr>
              ) : (
                departments.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-white/5 transition hover:bg-white/3"
                  >
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center justify-center rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                        {d.code}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-white">{d.label}</td>
                    <td className="px-6 py-3.5">
                      <MonoCell>{d.createdAt?.slice(0, 10) ?? "—"}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(d)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 transition hover:border-brand-orange/30 hover:bg-brand-orange/10 hover:text-brand-orange-bright"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(d)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
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

      <EditDepartmentDialog
        department={editing}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        title="Delete this department?"
        message={
          <>
            You&apos;re about to remove{" "}
            <span className="font-medium text-white">{deleting?.label}</span> from
            the department registry.{" "}
            <span className="text-rose-300/90">This action cannot be undone.</span>
          </>
        }
        details={
          deleting
            ? [
                { label: "Code", value: deleting.code },
                { label: "Label", value: deleting.label },
                { label: "Created", value: deleting.createdAt?.slice(0, 10) ?? "—" },
              ]
            : undefined
        }
        confirmLabel="Delete department"
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
