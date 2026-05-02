"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { clsx } from "clsx";
import { FieldLabel, fieldClass } from "../ui_components/portal/primitives";

const TABS = ["Standard form", "Bulk upload via Excel"] as const;
type Tab = (typeof TABS)[number];

export default function AddStockOutDialog() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("Standard form");

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
        className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-sky-400 to-cyan-400 px-5 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-sky-500/20 transition hover:brightness-110"
      >
        <Plus className="h-4 w-4" /> Issue Stock Out
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
                    <h2 className="text-lg font-semibold tracking-tight text-white">
                      Issue stock out
                    </h2>
                    <p className="mt-1 text-xs text-white/50">
                      Create a Material Requisition Note for a project.
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
                  <div className="mb-6">
                    <div className="inline-flex gap-1 rounded-full border border-white/10 bg-zinc-950/80 p-1 text-xs">
                      {TABS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTab(t)}
                          className={clsx(
                            "rounded-full px-4 py-1.5 font-medium transition",
                            tab === t
                              ? "bg-white text-zinc-900"
                              : "text-white/60 hover:text-white",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {tab === "Standard form" ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        close();
                      }}
                      className="grid grid-cols-1 gap-5 sm:grid-cols-3"
                    >
                      <div>
                        <FieldLabel>MRN number</FieldLabel>
                        <input
                          className={fieldClass}
                          defaultValue="MRN-2026-003"
                        />
                      </div>
                      <div>
                        <FieldLabel>Date of issue *</FieldLabel>
                        <input className={fieldClass} type="date" required />
                      </div>
                      <div>
                        <FieldLabel>Item name *</FieldLabel>
                        <input
                          className={fieldClass}
                          placeholder="Search item..."
                          required
                        />
                      </div>

                      <div>
                        <FieldLabel>Category</FieldLabel>
                        <input
                          className={fieldClass}
                          placeholder="Auto-filled"
                          disabled
                        />
                      </div>
                      <div>
                        <FieldLabel>Current stock</FieldLabel>
                        <input
                          className={fieldClass}
                          placeholder="Auto-filled"
                          disabled
                        />
                      </div>
                      <div>
                        <FieldLabel>Quantity to issue *</FieldLabel>
                        <input
                          className={fieldClass}
                          type="number"
                          required
                          defaultValue={0}
                        />
                      </div>

                      <div>
                        <FieldLabel>Unit of measure</FieldLabel>
                        <input
                          className={fieldClass}
                          placeholder="Auto-filled"
                          disabled
                        />
                      </div>
                      <div>
                        <FieldLabel>Project *</FieldLabel>
                        <select
                          className={fieldClass}
                          required
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select project
                          </option>
                          <option>Asylum Down</option>
                          <option>Asokwa</option>
                          <option>Bantama Phase 3</option>
                          <option>Manso</option>
                        </select>
                      </div>
                      <div>
                        <FieldLabel>Work activity *</FieldLabel>
                        <input
                          className={fieldClass}
                          placeholder="e.g. Foundation works"
                          required
                        />
                      </div>

                      <div>
                        <FieldLabel>WBS code *</FieldLabel>
                        <select className={fieldClass} required>
                          <option>K</option>
                          <option>A</option>
                          <option>1</option>
                          <option>2</option>
                        </select>
                      </div>
                      <div>
                        <FieldLabel>RFQ number *</FieldLabel>
                        <input className={fieldClass} required />
                      </div>
                      <div>
                        <FieldLabel>Department *</FieldLabel>
                        <select className={fieldClass} required>
                          <option>Administration</option>
                          <option>Engineering</option>
                          <option>Civil</option>
                          <option>Production</option>
                        </select>
                      </div>

                      <div>
                        <FieldLabel>Requested by *</FieldLabel>
                        <input className={fieldClass} required />
                      </div>
                      <div>
                        <FieldLabel>Authorised by *</FieldLabel>
                        <input className={fieldClass} required />
                      </div>
                      <div>
                        <FieldLabel>Site / delivery location</FieldLabel>
                        <input className={fieldClass} />
                      </div>

                      <div className="sm:col-span-3">
                        <FieldLabel>Notes / remarks</FieldLabel>
                        <textarea
                          rows={3}
                          className={`${fieldClass} resize-none`}
                        />
                      </div>

                      <div className="-mx-6 mt-2 flex items-center justify-end gap-3 border-t border-white/8 px-6 pt-5 sm:col-span-3">
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
                          Submit MRN
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/40 px-6 py-12 text-center">
                        <p className="text-sm font-medium text-white">
                          Drop your Excel file here
                        </p>
                        <p className="mt-1 text-xs text-white/50">
                          .xlsx · max 10 MB · matches the standard column
                          template
                        </p>
                        <button
                          type="button"
                          className="mt-5 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                        >
                          Choose file
                        </button>
                      </div>
                      <div className="-mx-6 mt-6 flex items-center justify-end gap-3 border-t border-white/8 px-6 pt-5">
                        <button
                          type="button"
                          onClick={close}
                          className="rounded-full px-5 py-2 text-sm font-medium text-white/70 transition hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100"
                        >
                          Upload MRN sheet
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
