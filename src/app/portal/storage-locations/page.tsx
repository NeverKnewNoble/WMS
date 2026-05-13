"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import {
  PageHeader,
  Surface,
  MonoCell,
  fieldClass,
} from "@/components/ui_components/portal/primitives";
import AddStorageLocationDialog from "@/components/modals/add-storage-location";
import EditStorageLocationDialog from "@/components/modals/edit-storage-location";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import {
  deleteStorageLocation,
  listStorageLocations,
} from "@/services/storage-locations";
import { showSuccessToast } from "@/services/toast";
import { useService } from "@/services/use-service";
import { useRole } from "@/components/providers/role-provider";
import { useTableFilters } from "@/lib/table-filters";
import type { StorageLocationRow } from "@/types/lookups";

export default function StorageLocationsPage() {
  const { canDelete } = useRole();
  const [editing, setEditing] = useState<StorageLocationRow | null>(null);
  const [deleting, setDeleting] = useState<StorageLocationRow | null>(null);

  const { data, loading, refetch } = useService(() => listStorageLocations(), []);
  const locations = useMemo(() => data?.data ?? [], [data]);

  const { query, setQuery, filtered } = useTableFilters<StorageLocationRow>(locations, {
    searchFields: [(l) => l.code, (l) => l.label, (l) => l.address],
  });

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await deleteStorageLocation(deleting.id);
      showSuccessToast("Location deleted", `${deleting.label} was removed.`);
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
        title="Storage locations"
        subtitle="Site stores, yards, and sub-stores where stock is physically held."
        actions={<AddStorageLocationDialog onCreated={refetch} />}
      />

      <Surface className="mt-8 p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            className={`${fieldClass} pl-9`}
            placeholder="Search by code, label, or address..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
                <th className="px-6 py-3 font-medium">Address</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && locations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs text-white/85">
                    Loading storage locations…
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs text-white/85">
                    No locations yet. Click <span className="text-white/85">Add location</span> to start.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs text-white/85">
                    No locations match the current search.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-white/5 transition hover:bg-white/3"
                  >
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center justify-center rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                        {l.code}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-white">{l.label}</td>
                    <td className="px-6 py-3.5 text-white/65">{l.address ?? "—"}</td>
                    <td className="px-6 py-3.5">
                      <MonoCell>{l.createdAt?.slice(0, 10) ?? "—"}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(l)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 transition hover:border-brand-orange/30 hover:bg-brand-orange/10 hover:text-brand-orange-bright"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleting(l)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
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
      </Surface>

      <EditStorageLocationDialog
        location={editing}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        title="Delete this storage location?"
        message={
          <>
            You&apos;re about to remove{" "}
            <span className="font-medium text-white">{deleting?.label}</span> from
            the location registry.{" "}
            <span className="text-rose-300/90">This action cannot be undone.</span>
          </>
        }
        details={
          deleting
            ? [
                { label: "Code", value: deleting.code },
                { label: "Label", value: deleting.label },
                { label: "Address", value: deleting.address ?? "—" },
                { label: "Created", value: deleting.createdAt?.slice(0, 10) ?? "—" },
              ]
            : undefined
        }
        confirmLabel="Delete location"
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
