"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Download, Upload, X, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { ToolbarButton } from "@/components/ui_components/portal/primitives";
import { showSuccessToast } from "@/services/toast";
import type { ImportSummary } from "@/types/import";

// Pair of buttons used on every list page that supports Excel import:
//   - "Download template" → fetches the .xlsx via the supplied callback
//   - "Upload Excel"      → opens the file picker, posts to the import API,
//                            and shows a result modal listing per-row errors
//
// We keep this component dumb about *which* endpoint it talks to: the page
// passes in `onDownload` and `onImport` from its service layer, so the same
// panel works for items, stock-in, and stock-out.

export default function ExcelImportPanel({
  onDownload,
  onImport,
  onImported,
  entityLabel,
}: {
  onDownload: () => Promise<void>;
  onImport:   (file: File) => Promise<ImportSummary>;
  /** Called after a non-empty import so the parent can refetch. */
  onImported?: () => void;
  /** "items", "GRNs", "MRNs" — used in the result modal copy. */
  entityLabel: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [result,      setResult]      = useState<ImportSummary | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const summary = await onImport(file);
      setResult(summary);
      if (summary.created > 0) {
        showSuccessToast(
          `Imported ${summary.created} ${entityLabel}`,
          summary.errors.length
            ? `${summary.errors.length} row${summary.errors.length === 1 ? "" : "s"} skipped — review errors.`
            : undefined,
        );
        onImported?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <ToolbarButton
        variant="ghost"
        onClick={handleDownload}
        disabled={downloading}
        title="Download an Excel template with the expected column structure"
      >
        <Download className="h-4 w-4" />
        {downloading ? "Preparing…" : "Download template"}
      </ToolbarButton>

      <ToolbarButton
        variant="ghost"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Upload a filled-in Excel template to bulk-import rows"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Importing…" : "Upload Excel"}
      </ToolbarButton>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFile}
      />

      <ImportResultModal
        result={result}
        error={error}
        entityLabel={entityLabel}
        onClose={() => {
          setResult(null);
          setError(null);
        }}
      />
    </>
  );
}

function ImportResultModal({
  result,
  error,
  entityLabel,
  onClose,
}: {
  result: ImportSummary | null;
  error:  string | null;
  entityLabel: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const open = result !== null || error !== null;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const tone =
    error                    ? "error"
    : result && result.errors.length === 0 ? "success"
    : "partial";

  const accent =
    tone === "success" ? "via-emerald-400/50"
    : tone === "error" ? "via-rose-400/50"
    :                    "via-amber-400/50";

  const Icon =
    tone === "success" ? CheckCircle2
    : tone === "error" ? AlertTriangle
    :                    FileSpreadsheet;

  const iconWrap =
    tone === "success" ? "bg-emerald-500/10 ring-emerald-500/25 text-emerald-300"
    : tone === "error" ? "bg-rose-500/10 ring-rose-500/25 text-rose-300"
    :                    "bg-amber-500/10 ring-amber-500/25 text-amber-300";

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
        <div className="relative flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5">
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent ${accent} to-transparent`} />

          <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-6">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${iconWrap}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  {error
                    ? "Import failed"
                    : tone === "success"
                      ? "Import complete"
                      : "Import finished with issues"}
                </h2>
                <p className="mt-0.5 text-xs text-white/90">
                  {error
                    ? "The file could not be processed."
                    : `Bulk import of ${entityLabel} from Excel.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white/95 transition hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {error ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : result ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Created"  value={result.created} tone="ok" />
                  <Stat label="Skipped"  value={result.skipped} tone={result.skipped > 0 ? "warn" : "muted"} />
                </div>

                {result.errors.length > 0 && (
                  <div className="mt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                      Row errors ({result.errors.length})
                    </p>
                    <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/8 bg-white/2">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur">
                          <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.18em] text-white/85">
                            <th className="px-3 py-2 font-medium w-16">Row</th>
                            <th className="px-3 py-2 font-medium">Problem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.errors.map((e, i) => (
                            <tr key={i} className="border-b border-white/5">
                              <td className="px-3 py-2 font-mono text-white/85">{e.row}</td>
                              <td className="px-3 py-2 text-rose-200/90">{e.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-white/8 bg-zinc-950/40 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "muted";
}) {
  const cls =
    tone === "ok"   ? "text-emerald-300"
    : tone === "warn" ? "text-amber-300"
    :                  "text-white/65";
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/85">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${cls}`}>{value}</p>
    </div>
  );
}
