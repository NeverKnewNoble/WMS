"use client";

import { useState } from "react";
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
import { projectsList } from "@/utils/sampleData";
import type { Project } from "@/types/projects";

export default function ProjectsPage() {
  const [selected, setSelected] = useState<Project | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Operations"
        title="Projects"
        subtitle="Track material consumption across every active project on the books."
        actions={<AddProjectDialog />}
      />

      <Surface className="mt-8 p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            className={`${fieldClass} pl-9`}
            placeholder="Search by WBS code or project name..."
          />
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                <th className="px-6 py-3 font-medium">WBS</th>
                <th className="px-6 py-3 font-medium">Project name</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium text-right">Items issued</th>
                <th className="px-6 py-3 font-medium text-right">Qty consumed</th>
                <th className="px-6 py-3 font-medium">Last activity</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {projectsList.map((p) => (
                <tr
                  key={p.name}
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
                    <MonoCell>{p.itemsIssued}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <MonoCell>{p.qtyConsumed}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5">
                    <MonoCell>{p.lastActivity}</MonoCell>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelected(p)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 transition hover:border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-200"
                      >
                        <Eye className="h-3.5 w-3.5" /> View details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <ProjectDetailsDialog
        project={selected}
        onClose={() => setSelected(null)}
        onEdit={(p) => {
          setSelected(null);
          setEditing(p);
        }}
        onDelete={(p) => {
          setSelected(null);
          setDeleting(p);
        }}
      />

      <EditProjectDialog
        project={editing}
        onClose={() => setEditing(null)}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        title="Delete this project?"
        message={
          <>
            You&apos;re about to remove{" "}
            <span className="font-medium text-white">
              {deleting?.name}
            </span>{" "}
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
                { label: "Items issued", value: deleting.itemsIssued },
                { label: "Qty consumed", value: deleting.qtyConsumed },
              ]
            : undefined
        }
        confirmLabel="Delete project"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          // TODO: wire up to backend.
          setDeleting(null);
        }}
      />
    </div>
  );
}
