"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { ApiItem } from "@/types/items";

const STATUS_LABEL: Record<ApiItem["status"], string> = {
  in_stock: "In stock",
  low:      "Low",
  critical: "Critical",
  out:      "Out",
};

export default function DeleteItemDialog({
  item,
  onClose,
  onConfirm,
}: {
  item: ApiItem | null;
  onClose: () => void;
  onConfirm: (item: ApiItem) => void;
}) {
  const [mounted, setMounted] = useState(false);

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

  if (!item || !mounted) return null;

  return createPortal(
    <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
        <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-rose-400/50 to-transparent" />

          <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-inset ring-rose-500/25">
              <AlertTriangle className="h-5 w-5 text-rose-300" />
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pb-2">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Delete this item?
            </h2>
            <p className="mt-2 text-sm text-white/60">
              You&apos;re about to remove{" "}
              <span className="font-medium text-white">{item.name}</span> from
              the registry. This will hide it from issuances and reports.{" "}
              <span className="text-rose-300/90">This action cannot be undone.</span>
            </p>
          </div>

          <div className="mx-6 my-4 grid grid-cols-2 gap-3 rounded-xl border border-white/8 bg-white/3 p-4 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Serial</p>
              <p className="mt-1 font-mono text-white/85">{item.rfq}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Category</p>
              <p className="mt-1 text-white/85">{item.category.label}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">On hand</p>
              <p className="mt-1 font-mono text-white/85">
                {item.currentStock.toLocaleString()} {item.unit.label}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Status</p>
              <p className="mt-1 text-white/85">{STATUS_LABEL[item.status]}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-white/8 bg-zinc-950/40 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2 text-sm font-medium text-white/75 transition hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(item)}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/40 transition hover:bg-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete item
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
