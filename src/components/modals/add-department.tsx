"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Hash, Building } from "lucide-react";
import { FieldLabel, fieldClass } from "../ui_components/portal/primitives";
import { createDepartment } from "@/services/departments";
import { showSuccessToast } from "@/services/toast";

export default function AddDepartmentDialog({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const close = () => setOpen(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const get = (k: string) => fd.get(k)?.toString().trim() ?? "";

    try {
      const dept = await createDepartment({
        code:  get("code"),
        label: get("label"),
      });
      showSuccessToast("Department created", `${dept.label} added.`);
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
        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100"
      >
        <Plus className="h-4 w-4" /> Add department
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
            <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
              <div className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-orange/40 to-transparent" />
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/8 px-6 pb-5 pt-6">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brand-orange/85">
                      Reference
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                      Add new department
                    </h2>
                    <p className="mt-1 text-xs text-white/50">
                      Departments are used for staff assignment and material issue tracking.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full p-1.5 text-white/60 transition hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <form
                    onSubmit={onSubmit}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2"
                  >
                    <div>
                      <FieldLabel>Code *</FieldLabel>
                      <div className="relative">
                        <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                        <input
                          name="code"
                          className={`${fieldClass} pl-9`}
                          placeholder="e.g. OPS, MNT, ENG"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Label *</FieldLabel>
                      <div className="relative">
                        <Building className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                        <input
                          name="label"
                          className={`${fieldClass} pl-9`}
                          placeholder="e.g. Operations"
                          required
                        />
                      </div>
                    </div>

                    <div className="-mx-6 mt-2 flex items-center justify-end gap-3 border-t border-white/8 px-6 pt-5 sm:col-span-2">
                      <button
                        type="button"
                        onClick={close}
                        className="rounded-full px-5 py-2 text-sm font-medium text-white/70 transition hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Saving…" : "Create department"}
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
