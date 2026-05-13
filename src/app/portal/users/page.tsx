"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Search, ShieldCheck, Trash2 } from "lucide-react";
import {
  PageHeader,
  Surface,
  StatusPill,
  fieldClass,
  type StatusTone,
} from "@/components/ui_components/portal/primitives";
import AddUserDialog from "@/components/modals/add-user";
import EditUserDialog from "@/components/modals/edit-user";
import ConfirmDeleteDialog from "@/components/modals/confirm-delete";
import { deleteUser, listUsers } from "@/services/users";
import { showSuccessToast } from "@/services/toast";
import { useService } from "@/services/use-service";
import { useRole } from "@/components/providers/role-provider";
import { useTableFilters, distinctOptions } from "@/lib/table-filters";
import type { AdminUserRow } from "@/types/users";

const STATUS_TONE: Record<AdminUserRow["status"], StatusTone> = {
  active:    "active",
  invited:   "watch",
  suspended: "critical",
};

const STATUS_LABEL: Record<AdminUserRow["status"], string> = {
  active:    "Active",
  invited:   "Invited",
  suspended: "Suspended",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

export default function UsersPage() {
  const { isAdmin } = useRole();
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState<AdminUserRow | null>(null);

  const { data, loading, refetch } = useService(() => listUsers(), []);
  const users = useMemo(() => data?.data ?? [], [data]);

  const roleOptions = useMemo(
    () => distinctOptions(users, (u) => u.role.label),
    [users],
  );

  const { query, setQuery, filters, setFilter, filtered } = useTableFilters<
    AdminUserRow,
    "role" | "status"
  >(users, {
    searchFields: [
      (u) => u.fullName,
      (u) => u.email,
      (u) => u.phone,
      (u) => u.department?.label ?? null,
    ],
    filters: {
      role:   { predicate: (u, v) => u.role.label === v },
      status: { predicate: (u, v) => u.status === v },
    },
  });

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    try {
      await deleteUser(deleting.id);
      showSuccessToast("User deleted", `${deleting.fullName} was removed.`);
      setDeleting(null);
      refetch();
    } catch {
      // toast already shown
    }
  }, [deleting, refetch]);

  if (!isAdmin) {
    return (
      <div className="px-4 py-10 sm:px-8 animate-page-in">
        <PageHeader
          eyebrow="Administration"
          title="Users"
          subtitle="This page is restricted to administrators."
        />
        <Surface className="mt-8 flex items-center gap-3 p-6 text-sm text-white/85">
          <ShieldCheck className="h-5 w-5 text-brand-orange-bright" />
          You need an admin role to manage users. Ask an existing admin to grant access.
        </Surface>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 animate-page-in">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        subtitle="Create accounts, assign roles, and keep the portal access list tidy."
        actions={<AddUserDialog onCreated={refetch} />}
      />

      <Surface className="mt-6 p-4 sm:mt-8">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              className={`${fieldClass} pl-9`}
              placeholder="Search by name, email, or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className={fieldClass}
            value={filters.role}
            onChange={(e) => setFilter("role", e.target.value)}
          >
            <option value="all">All roles</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            className={fieldClass}
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </Surface>

      <Surface className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-white">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Last login</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-xs text-white/85">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-xs text-white/85">
                    No other users yet. Click <span className="text-white/85">Add user</span> to start.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-xs text-white/85">
                    No users match the current search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/5 transition hover:bg-white/3"
                  >
                    <td className="px-6 py-3.5 font-medium text-white">{u.fullName}</td>
                    <td className="px-6 py-3.5 text-white/65">{u.email}</td>
                    <td className="px-6 py-3.5 text-white/65">{u.phone ?? "—"}</td>
                    <td className="px-6 py-3.5 text-white/65">{u.role.label}</td>
                    <td className="px-6 py-3.5 text-white/65">{u.department?.label ?? "—"}</td>
                    <td className="px-6 py-3.5">
                      <StatusPill tone={STATUS_TONE[u.status]}>
                        {STATUS_LABEL[u.status]}
                      </StatusPill>
                    </td>
                    <td className="px-6 py-3.5 text-white/65">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(u)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90 transition hover:border-brand-orange/30 hover:bg-brand-orange/10 hover:text-brand-orange-bright"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(u)}
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

        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4 text-xs text-white/90">
          <p>
            {data
              ? `Showing ${filtered.length} of ${data.total} user${data.total === 1 ? "" : "s"}`
              : "—"}
          </p>
        </div>
      </Surface>

      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        title="Delete this user?"
        message={
          <>
            You&apos;re about to remove{" "}
            <span className="font-medium text-white">{deleting?.fullName}</span>{" "}
            from the portal. They will lose access immediately.{" "}
            <span className="text-rose-300/90">This action cannot be undone.</span>
          </>
        }
        details={
          deleting
            ? [
                { label: "Email",      value: deleting.email },
                { label: "Role",       value: deleting.role.label },
                { label: "Department", value: deleting.department?.label ?? "—" },
                { label: "Status",     value: STATUS_LABEL[deleting.status] },
              ]
            : undefined
        }
        confirmLabel="Delete user"
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
