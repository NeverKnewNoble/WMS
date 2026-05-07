// Shared Excel helpers for template downloads + spreadsheet imports.
//
// We use SheetJS (xlsx) for both directions:
//   - `buildTemplateWorkbook` → assembles a multi-sheet .xlsx (data + reference)
//   - `xlsxResponse`          → wraps a workbook into a downloadable Response
//   - `parseSheetRows`        → turns an uploaded file into typed row objects
//
// Imports are validated row-by-row by callers using Zod; this file only
// concerns itself with workbook plumbing.

import * as XLSX from "xlsx";

// ─── Template generation ─────────────────────────────────────────────

export type TemplateColumn = {
  /** Header text in row 1 — also the key the parser will use. */
  key: string;
  /** Width in characters (sheet column width). */
  width?: number;
  /** Sample value placed in row 2 so users can see the expected shape. */
  sample?: string | number | boolean;
};

export type ReferenceTab = {
  /** Sheet name shown in the bottom tab bar. */
  name: string;
  /** First-row headers. */
  headers: string[];
  /** Body rows, one array per row, aligned with headers. */
  rows: (string | number | null)[][];
};

export function buildTemplateWorkbook(opts: {
  sheetName: string;
  columns: TemplateColumn[];
  /** Background notes — appear on a secondary "READ ME" tab. */
  notes?: string[];
  /** Lookup tabs (Categories, Units, etc.) appended after READ ME. */
  references?: ReferenceTab[];
}): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ── Data sheet FIRST so Excel opens straight to the column headers. ──
  const headerRow = opts.columns.map((c) => c.key);
  const sampleRow = opts.columns.map((c) => c.sample ?? "");
  const dataSheet = XLSX.utils.aoa_to_sheet([headerRow, sampleRow]);
  dataSheet["!cols"] = opts.columns.map((c) => ({ wch: c.width ?? 18 }));
  XLSX.utils.book_append_sheet(wb, dataSheet, opts.sheetName);

  if (opts.notes?.length) {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Instructions"],
      [],
      ...opts.notes.map((line) => [line]),
    ]);
    ws["!cols"] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(wb, ws, "READ ME");
  }

  for (const ref of opts.references ?? []) {
    const ws = XLSX.utils.aoa_to_sheet([ref.headers, ...ref.rows]);
    ws["!cols"] = ref.headers.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(wb, ws, ref.name);
  }

  // Pin the data tab as the active one. xlsx's TypeScript surface doesn't
  // expose `activeTab` on WBView, but the underlying writer honors it on
  // the workbook view, so we attach it via a cast.
  wb.Workbook = wb.Workbook ?? {};
  wb.Workbook.Views = [{ RTL: false } as XLSX.WBView & { activeTab: number }];
  (wb.Workbook.Views[0] as { activeTab: number }).activeTab = 0;

  return wb;
}

export function xlsxResponse(wb: XLSX.WorkBook, filename: string): Response {
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

// ─── Import parsing ──────────────────────────────────────────────────

/**
 * Parse the first non-empty data sheet of an uploaded .xlsx.
 *
 * The workbook may legitimately contain reference tabs (READ ME, Categories,
 * Units, etc.) — `dataSheetName` lets the caller pick the right one. If
 * omitted we fall back to the first sheet.
 *
 * Returns each row as `Record<header, string>` since users frequently type
 * dates, codes, and numbers as text in Excel; downstream Zod schemas coerce.
 */
export async function parseSheetRows(
  file: File,
  dataSheetName?: string,
): Promise<Record<string, string>[]> {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });

  const sheetName =
    (dataSheetName && wb.SheetNames.includes(dataSheetName))
      ? dataSheetName
      : wb.SheetNames[0];
  if (!sheetName) return [];

  const sheet = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,        // gives us strings, so dates/numbers don't surprise Zod
    blankrows: false,
  });

  if (aoa.length < 2) return [];

  const headers = aoa[0].map((h) => String(h ?? "").trim());
  const out: Record<string, string>[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i];
    const rec: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((h, idx) => {
      const v = String(row[idx] ?? "").trim();
      rec[h] = v;
      if (v !== "") hasValue = true;
    });
    if (hasValue) out.push(rec);
  }

  return out;
}

/** Returns the missing required headers (empty array when all are present). */
export function missingHeaders(
  rows: Record<string, string>[],
  required: string[],
): string[] {
  if (rows.length === 0) return required;
  const present = new Set(Object.keys(rows[0]));
  return required.filter((h) => !present.has(h));
}

// ─── Row-error reporting ─────────────────────────────────────────────

export type RowError = { row: number; message: string };

export type ImportSummary = {
  created: number;
  skipped: number;
  errors:  RowError[];
};

/**
 * Read a `multipart/form-data` upload and return the first File found under
 * field name `file`. Throws when the field is missing or empty so callers can
 * just do `const file = await readUpload(req)`.
 */
export async function readUpload(req: Request): Promise<File> {
  const fd = await req.formData();
  const f = fd.get("file");
  if (!(f instanceof File) || f.size === 0) {
    throw new Error("Missing upload file");
  }
  return f;
}
