"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";
import { FieldLabel, fieldClass } from "../ui_components/portal/primitives";
import { updateItem } from "@/services/items";
import { getLookups } from "@/services/lookups";
import { showSuccessToast } from "@/services/toast";
import type { ApiItem } from "@/types/items";
import type { Lookups } from "@/types/lookups";

export default function EditItemDialog({
  item,
  onClose,
  onSaved,
}: {
  item: ApiItem | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lookups, setLookups] = useState<Lookups | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    (async () => {
      try {
        const l = await getLookups();
        if (!cancelled) setLookups(l);
      } catch {
        // toast already shown
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item]);

  if (!item || !mounted) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item || submitting) return;
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const get = (k: string) => fd.get(k)?.toString().trim() ?? "";
    const num = (k: string) => Number(fd.get(k) ?? 0);

    try {
      await updateItem(item.id, {
        rfq:                 get("rfq"),
        name:                get("name"),
        categoryCode:        get("categoryCode"),
        unitCode:            get("unitCode"),
        defaultSupplierName: get("supplier") || null,
        reorderLevel:        num("reorderLevel"),
        minStock:            num("minStock"),
        maxStock:            num("maxStock"),
        description:         get("description") || null,
      });
      showSuccessToast("Item updated", `${get("name") || item.name} saved.`);
      onSaved?.();
      onClose();
    } catch {
      // toast already shown
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
        <div className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/8 px-6 pb-5 pt-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400/10 ring-1 ring-inset ring-sky-400/25">
                <Pencil className="h-4 w-4 text-sky-300" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  Edit item
                </h2>
                <p className="mt-1 text-xs text-white/50">
                  Update the registry record for{" "}
                  <span className="font-medium text-white/80">{item.name}</span>{" "}
                  ({item.rfq}).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form
              key={`${item.id}-${lookups ? "ready" : "loading"}`}
              onSubmit={onSubmit}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2"
            >
              <div className="sm:col-span-1">
                <FieldLabel>Item name *</FieldLabel>
                <input
                  name="name"
                  className={fieldClass}
                  defaultValue={item.name}
                  required
                />
              </div>
              <div>
                <FieldLabel>RFQ number</FieldLabel>
                <input
                  name="rfq"
                  className={fieldClass}
                  defaultValue={item.rfq}
                />
              </div>

              <div>
                <FieldLabel>Category *</FieldLabel>
                <select
                  name="categoryCode"
                  className={fieldClass}
                  required
                  defaultValue={item.category.code}
                >
                  {lookups ? (
                    lookups.categories.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.label}
                      </option>
                    ))
                  ) : (
                    <option value={item.category.code}>{item.category.label}</option>
                  )}
                </select>
              </div>
              <div>
                <FieldLabel>Unit of measure *</FieldLabel>
                <select
                  name="unitCode"
                  className={fieldClass}
                  required
                  defaultValue={item.unit.code}
                >
                  {lookups ? (
                    lookups.units.map((u) => (
                      <option key={u.id} value={u.code}>
                        {u.label}
                        {u.symbol ? ` (${u.symbol})` : ""}
                      </option>
                    ))
                  ) : (
                    <option value={item.unit.code}>{item.unit.label}</option>
                  )}
                </select>
              </div>

              <div>
                <FieldLabel>Reorder level</FieldLabel>
                <input
                  name="reorderLevel"
                  className={fieldClass}
                  type="number"
                  min={0}
                  defaultValue={item.reorderLevel}
                />
              </div>
              <div>
                <FieldLabel>Minimum stock</FieldLabel>
                <input
                  name="minStock"
                  className={fieldClass}
                  type="number"
                  min={0}
                  defaultValue={item.minStock}
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Maximum stock</FieldLabel>
                <input
                  name="maxStock"
                  className={fieldClass}
                  type="number"
                  min={0}
                  defaultValue={item.maxStock}
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Supplier / vendor</FieldLabel>
                <select
                  name="supplier"
                  className={fieldClass}
                  defaultValue={item.supplier?.name ?? ""}
                >
                  <option value="">—</option>
                  {lookups
                    ? lookups.suppliers.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))
                    : item.supplier && (
                        <option value={item.supplier.name}>{item.supplier.name}</option>
                      )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  name="description"
                  rows={3}
                  className={`${fieldClass} resize-none`}
                  defaultValue={item.description ?? ""}
                  placeholder="Notes about this item, packaging, handling..."
                />
              </div>

              <div className="-mx-6 mt-2 flex items-center justify-end gap-3 border-t border-white/8 px-6 pt-5 sm:col-span-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-5 py-2 text-sm font-medium text-white/70 transition hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
