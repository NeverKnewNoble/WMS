"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Mail, Phone, User, Lock, Eye, EyeOff } from "lucide-react";
import { FieldLabel, fieldClass } from "../ui_components/portal/primitives";
import { createUser } from "@/services/users";
import { getLookups } from "@/services/lookups";
import { useService } from "@/services/use-service";
import { showSuccessToast } from "@/services/toast";

export default function AddUserDialog({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { data: lookups } = useService(getLookups, [open]);
  const departments = useMemo(() => lookups?.departments ?? [], [lookups]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setShowPassword(false);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const get = (k: string) => fd.get(k)?.toString().trim() ?? "";

    try {
      const user = await createUser({
        fullName:     get("fullName"),
        email:        get("email"),
        password:     fd.get("password")?.toString() ?? "",
        roleCode:     get("roleCode") as "admin" | "storekeeper",
        phone:        get("phone") || null,
        departmentId: get("departmentId") || null,
        status:       (get("status") as "active" | "invited" | "suspended") || "active",
      });
      showSuccessToast("User created", `${user.fullName} can now sign in.`);
      onCreated?.();
      close();
    } catch {
      // toast already shown
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100 sm:px-5"
      >
        <Plus className="h-4 w-4" /> Add user
      </button>

      {open &&
        mounted &&
        createPortal(
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close dialog"
              onClick={close}
              className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm"
            />
            <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-8">
              <div className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-orange/40 to-transparent" />
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/8 px-5 pb-5 pt-6 sm:px-6">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brand-orange/85">
                      Administration
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                      Add new user
                    </h2>
                    <p className="mt-1 text-xs text-white/90">
                      Create an account so this person can sign in to the portal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full p-1.5 text-white/95 transition hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                  <form
                    onSubmit={onSubmit}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2"
                  >
                    <div className="sm:col-span-2">
                      <FieldLabel>Full name *</FieldLabel>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/85" />
                        <input
                          name="fullName"
                          className={`${fieldClass} pl-9`}
                          placeholder="e.g. Kwame Asante"
                          required
                          minLength={2}
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Email *</FieldLabel>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/85" />
                        <input
                          name="email"
                          type="email"
                          className={`${fieldClass} pl-9`}
                          placeholder="name@joshob.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Phone</FieldLabel>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/85" />
                        <input
                          name="phone"
                          className={`${fieldClass} pl-9`}
                          placeholder="+233 ..."
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <FieldLabel>Temporary password *</FieldLabel>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/85" />
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          className={`${fieldClass} pl-9 pr-10`}
                          placeholder="At least 8 characters"
                          minLength={8}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/80 transition hover:bg-white/5 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="mt-1.5 text-[11px] text-white/70">
                        Share this with the user — they can change it from Settings after first sign-in.
                      </p>
                    </div>

                    <div>
                      <FieldLabel>Role *</FieldLabel>
                      <select
                        name="roleCode"
                        className={fieldClass}
                        defaultValue="storekeeper"
                        required
                      >
                        <option value="storekeeper">Storekeeper</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Status</FieldLabel>
                      <select
                        name="status"
                        className={fieldClass}
                        defaultValue="active"
                      >
                        <option value="active">Active</option>
                        <option value="invited">Invited</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <FieldLabel>Department</FieldLabel>
                      <select name="departmentId" className={fieldClass} defaultValue="">
                        <option value="">— No department —</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="-mx-5 mt-2 flex flex-col-reverse items-stretch justify-end gap-3 border-t border-white/8 px-5 pt-5 sm:-mx-6 sm:flex-row sm:items-center sm:px-6 sm:col-span-2">
                      <button
                        type="button"
                        onClick={close}
                        className="rounded-full px-5 py-2 text-sm font-medium text-white/85 transition hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Creating…" : "Create user"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
