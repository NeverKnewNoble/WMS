"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, Mail, MapPin, Pencil, Phone, User, X } from "lucide-react";
import { FieldLabel, fieldClass } from "../ui_components/portal/primitives";
import { updateSupplier } from "@/services/suppliers";
import { showSuccessToast } from "@/services/toast";
import type { SupplierRow } from "@/types/lookups";

export default function EditSupplierDialog({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: SupplierRow | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!supplier) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [supplier, onClose]);

  if (!supplier || !mounted) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supplier || submitting) return;
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const get = (k: string) => fd.get(k)?.toString().trim() ?? "";

    try {
      await updateSupplier(supplier.id, {
        name:        get("name"),
        contactName: get("contactName") || null,
        email:       get("email") || null,
        phone:       get("phone") || null,
        address:     get("address") || null,
        isActive:    get("isActive") === "on",
      });
      showSuccessToast("Supplier updated", `${get("name") || supplier.name} saved.`);
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
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-orange/40 to-transparent" />
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/8 px-6 pb-5 pt-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange/10 ring-1 ring-inset ring-brand-orange/30">
                <Pencil className="h-4 w-4 text-brand-orange-bright" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brand-orange/85">
                  Reference · Supplier
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
                  Edit supplier
                </h2>
                <p className="mt-1 text-xs text-white/50">
                  Update details for{" "}
                  <span className="font-medium text-white/80">{supplier.name}</span>.
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
              key={supplier.id}
              onSubmit={onSubmit}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <FieldLabel>Supplier name *</FieldLabel>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <input
                    name="name"
                    className={`${fieldClass} pl-9`}
                    defaultValue={supplier.name}
                    required
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Contact name</FieldLabel>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <input
                    name="contactName"
                    className={`${fieldClass} pl-9`}
                    defaultValue={supplier.contactName ?? ""}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Email</FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <input
                    name="email"
                    type="email"
                    className={`${fieldClass} pl-9`}
                    defaultValue={supplier.email ?? ""}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Phone</FieldLabel>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <input
                    name="phone"
                    className={`${fieldClass} pl-9`}
                    defaultValue={supplier.phone ?? ""}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-white/80">
                  <input
                    name="isActive"
                    type="checkbox"
                    defaultChecked={supplier.isActive}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 accent-brand-orange"
                  />
                  Active
                </label>
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Address</FieldLabel>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-white/40" />
                  <textarea
                    name="address"
                    rows={2}
                    className={`${fieldClass} resize-none pl-9`}
                    defaultValue={supplier.address ?? ""}
                  />
                </div>
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
