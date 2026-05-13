"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, Eye } from "lucide-react";
import {
  PageHeader,
  Surface,
  MonoCell,
  fieldClass,
} from "@/components/ui_components/portal/primitives";
import AddProjectDialog from "@/components/modals/add-project";
import EditProjectDialog from "@/components/modals/edit-project";
import ProjectDetailsDialog from "@/components/modals/project-details";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import { listProjects, deleteProject } from "@/services/projects";
import { showSuccessToast } from "@/services/toast";
import { useService } from "@/services/use-service";
import { useRole } from "@/components/providers/role-provider";
import { useTableFilters } from "@/lib/table-filters";
import type { ProjectListRow, Project as LegacyProject } from "@/types/projects";

/** Adapts the API row to the legacy shape that ProjectDetailsDialog still uses. */
function toLegacy(p: ProjectListRow): LegacyProject {
  return {
    wbs: p.wbs,
    name: p.name,
    location: p.location,
    itemsIssued: 0,
    qtyConsumed: p.qtyConsumed.toLocaleString(),
    lastActivity: p.lastActivity?.slice(0, 10) ?? "—",
  };
}

export default function ProjectsPage() {
  const { canDelete } = useRole();
  const [selected, setSelected] = useState<ProjectListRow | null>(null);
  const [editing, setEditing] = useState<ProjectListRow | null>(null);
  const [deleting, setDeleting] = useState<ProjectListRow | null>(null);

  const { data, loading, refetch } = useService(() => listProjects(), []);
  const projects = useMemo(() => data?.data ?? [], [data]);

  const { query, setQuery, filtered } = useTableFilters<ProjectListRow>(projects, {
    searchFields: [
      (p) => p.wbs,
      (p) => p.name,
      (p) => p.location,
    ],
  });

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await deleteProject(deleting.id);
      showSuccessToast("Project deleted", `${deleting.name} was removed.`);
      setDeleting(null);
      refetch();
    } catch {
      // toast already shown
    }
  }, [deleting, refetch]);

  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Operations"
        title="Projects"
        subtitle="Track material consumption across every active project on the books."
        actions={<AddProjectDialog onCreated={refetch} />}
      />

      <Surface className="mt-8 p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            className={`${fieldClass} pl-9`}
            placeholder="Search by WBS code or project name..."
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
                <th className="px-6 py-3 font-medium">WBS</th>
                <th className="px-6 py-3 font-medium">Project name</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium text-right">Qty consumed</th>
                <th className="px-6 py-3 font-medium">Last activity</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs text-white/85">
                    Loading projects…
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs text-white/85">
                    No projects yet. Click <span className="text-white/85">Add project</span> to start.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs text-white/85">
                    No projects match the current search.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 transition hover:bg-white/3"
                  >
                    <td className="px-6 py-3.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/5 font-mono text-xs font-semibold text-white">
                        {p.wbs}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-white">{p.name}</td>
                    <td className="px-6 py-3.5 text-white/65">{p.location}</td>
                    <td className="px-6 py-3.5 text-right">
                      <MonoCell>{p.qtyConsumed.toLocaleString()}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5">
                      <MonoCell>{p.lastActivity?.slice(0, 10) ?? "—"}</MonoCell>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelected(p)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 transition hover:border-brand-orange/30 hover:bg-brand-orange/10 hover:text-brand-orange-bright"
                        >
                          <Eye className="h-3.5 w-3.5" /> View details
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

      <ProjectDetailsDialog
        project={selected ? toLegacy(selected) : null}
        onClose={() => setSelected(null)}
        onEdit={() => {
          setEditing(selected);
          setSelected(null);
        }}
        onDelete={
          canDelete
            ? () => {
                setDeleting(selected);
                setSelected(null);
              }
            : undefined
        }
      />

      <EditProjectDialog
        project={editing}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        title="Delete this project?"
        message={
          <>
            You&apos;re about to remove{" "}
            <span className="font-medium text-white">{deleting?.name}</span>{" "}
            from the registry. Future MRNs and reports will no longer reference
            it.{" "}
            <span className="text-rose-300/90">
              This action cannot be undone.
            </span>
          </>
        }
        details={
          deleting
            ? [
                { label: "WBS", value: deleting.wbs },
                { label: "Location", value: deleting.location },
                { label: "Qty consumed", value: deleting.qtyConsumed.toLocaleString() },
                { label: "Last activity", value: deleting.lastActivity?.slice(0, 10) ?? "—" },
              ]
            : undefined
        }
        confirmLabel="Delete project"
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
