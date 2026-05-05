"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { FieldLabel, fieldClass } from "../ui_components/portal/primitives";
import { createMovement } from "@/services/stock-movements";
import { showSuccessToast } from "@/services/toast";
import { getLookups } from "@/services/lookups";
import { listItems } from "@/services/items";
import { listProjects } from "@/services/projects";
import type { MovementCondition } from "@/types/stock-movements";
import type { Lookups } from "@/types/lookups";
import type { ApiItem } from "@/types/items";
import type { ProjectListRow } from "@/types/projects";

export default function AddStockInDialog({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [items, setItems] = useState<ApiItem[]>([]);
  const [projects, setProjects] = useState<ProjectListRow[]>([]);

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

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [l, i, p] = await Promise.all([
          getLookups(),
          listItems({ limit: 500 }),
          listProjects({ limit: 500 }),
        ]);
        if (cancelled) return;
        setLookups(l);
        setItems(i.data);
        setProjects(p.data);
      } catch {
        // toast already shown by services
      }
    })();
    return () => {
      cancelled = true;
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
      const m = await createMovement({
        refNo:           get("refNo"),
        direction:       "in",
        kind:            "operations",
        movementDate:    get("movementDate"),
        rfq:             get("rfq") || null,
        notes:           get("notes") || null,
        supplierName:    get("supplierName"),
        receivedByEmail: get("receivedByEmail") || null,
        projectWbs:      get("projectWbs") || null,
        departmentCode:  get("departmentCode") || null,
        storageLocationCode: get("storageLocationCode") || null,
        lines: [
          {
            itemRfq:   get("itemRfq"),
            qty:       Number(fd.get("qty") ?? 0),
            unitCode:  get("unitCode"),
            condition: (get("condition") || "good") as MovementCondition,
          },
        ],
      });
      showSuccessToast("Stock in recorded", `${m.refNo} saved.`);
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
        className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-emerald-400 to-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
      >
        <Plus className="h-4 w-4" /> Record Stock In
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
                      Record stock in
                    </h2>
                    <p className="mt-1 text-xs text-white/50">
                      Log incoming materials with a Goods Received Note. Stock
                      on hand updates automatically.
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
                  <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div>
                      <FieldLabel>GRN number *</FieldLabel>
                      <input
                        name="refNo"
                        className={fieldClass}
                        placeholder="e.g. GRN-26-004"
                        required
                      />
                    </div>
                    <div>
                      <FieldLabel>Date of receipt *</FieldLabel>
                      <input
                        name="movementDate"
                        className={fieldClass}
                        type="date"
                        required
                        defaultValue={new Date().toISOString().slice(0, 10)}
                      />
                    </div>
                    <div>
                      <FieldLabel>RFQ number</FieldLabel>
                      <input
                        name="rfq"
                        className={fieldClass}
                        placeholder="e.g. RFQ-2026-019"
                      />
                    </div>

                    <div>
                      <FieldLabel>Item *</FieldLabel>
                      <select
                        name="itemRfq"
                        className={fieldClass}
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {items.length ? "Select an item" : "Loading items…"}
                        </option>
                        {items.map((it) => (
                          <option key={it.id} value={it.rfq}>
                            {it.rfq} — {it.name} ({it.unit.label})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Quantity *</FieldLabel>
                      <input
                        name="qty"
                        className={fieldClass}
                        type="number"
                        step="any"
                        min={0.001}
                        required
                      />
                    </div>
                    <div>
                      <FieldLabel>Unit *</FieldLabel>
                      <select
                        name="unitCode"
                        className={fieldClass}
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {lookups ? "Select a unit" : "Loading units…"}
                        </option>
                        {lookups?.units.map((u) => (
                          <option key={u.id} value={u.code}>
                            {u.label}
                            {u.symbol ? ` (${u.symbol})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <FieldLabel>Supplier *</FieldLabel>
                      <select
                        name="supplierName"
                        className={fieldClass}
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {lookups ? "Select a supplier" : "Loading suppliers…"}
                        </option>
                        {lookups?.suppliers.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Department</FieldLabel>
                      <select name="departmentCode" className={fieldClass} defaultValue="">
                        <option value="">—</option>
                        {lookups?.departments.map((d) => (
                          <option key={d.id} value={d.code}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <FieldLabel>Project</FieldLabel>
                      <select name="projectWbs" className={fieldClass} defaultValue="">
                        <option value="">—</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.wbs}>
                            {p.wbs} — {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Storage location</FieldLabel>
                      <select
                        name="storageLocationCode"
                        className={fieldClass}
                        defaultValue=""
                      >
                        <option value="">—</option>
                        {lookups?.storageLocations.map((s) => (
                          <option key={s.id} value={s.code}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Condition</FieldLabel>
                      <select name="condition" className={fieldClass} defaultValue="good">
                        <option value="good">Good</option>
                        <option value="damaged">Damaged</option>
                        <option value="partial">Partial</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <FieldLabel>Received by (email)</FieldLabel>
                      <input
                        name="receivedByEmail"
                        type="email"
                        className={fieldClass}
                        placeholder="receiver@example.com"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <FieldLabel>Notes / remarks</FieldLabel>
                      <textarea
                        name="notes"
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
                        disabled={submitting}
                        className="rounded-full bg-linear-to-r from-emerald-400 to-emerald-500 px-6 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Saving…" : "Save GRN"}
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
