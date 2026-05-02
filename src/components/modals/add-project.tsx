"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, MapPin, CalendarRange, Hash } from "lucide-react";
import { FieldLabel, fieldClass } from "../ui_components/portal/primitives";

export default function AddProjectDialog() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100"
      >
        <Plus className="h-4 w-4" /> Add project
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
              <div className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-400/40 to-transparent" />
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/8 px-6 pb-5 pt-6">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-sky-300/80">
                      Operations
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                      Add new project
                    </h2>
                    <p className="mt-1 text-xs text-white/50">
                      Register a project so material issues can be tracked against it.
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
                    onSubmit={(e) => {
                      e.preventDefault();
                      close();
                    }}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2"
                  >
                    <div>
                      <FieldLabel>WBS code *</FieldLabel>
                      <div className="relative">
                        <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                        <input
                          className={`${fieldClass} pl-9`}
                          placeholder="e.g. K, 12, A-3"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Project name *</FieldLabel>
                      <input
                        className={fieldClass}
                        placeholder="e.g. Bantama Phase 4"
                        required
                      />
                    </div>

                    <div>
                      <FieldLabel>Location *</FieldLabel>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                        <input
                          className={`${fieldClass} pl-9`}
                          placeholder="e.g. Kumasi"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Region</FieldLabel>
                      <select className={fieldClass} defaultValue="Ashanti">
                        <option>Greater Accra</option>
                        <option>Ashanti</option>
                        <option>Volta</option>
                        <option>Bono</option>
                        <option>Eastern</option>
                        <option>Western</option>
                        <option>Central</option>
                        <option>Northern</option>
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Project manager</FieldLabel>
                      <input
                        className={fieldClass}
                        placeholder="e.g. Eng. Boateng"
                      />
                    </div>

                    <div>
                      <FieldLabel>Status</FieldLabel>
                      <select className={fieldClass} defaultValue="Active">
                        <option>Active</option>
                        <option>On Hold</option>
                        <option>Completed</option>
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Start date</FieldLabel>
                      <div className="relative">
                        <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                        <input
                          type="date"
                          className={`${fieldClass} pl-9`}
                          defaultValue="2026-04-30"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Estimated end date</FieldLabel>
                      <div className="relative">
                        <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                        <input
                          type="date"
                          className={`${fieldClass} pl-9`}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <FieldLabel>Budget (GHS)</FieldLabel>
                      <input
                        type="number"
                        className={fieldClass}
                        placeholder="0.00"
                        min={0}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <FieldLabel>Description</FieldLabel>
                      <textarea
                        rows={3}
                        className={`${fieldClass} resize-none`}
                        placeholder="Scope of works, key milestones, special handling..."
                      />
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
                        className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100"
                      >
                        Create project
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
