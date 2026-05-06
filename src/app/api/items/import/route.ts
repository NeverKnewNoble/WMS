import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireUser, withApi } from "@/lib/api";
import {
  missingHeaders,
  parseSheetRows,
  readUpload,
  type ImportSummary,
  type RowError,
} from "@/lib/excel";

const REQUIRED_HEADERS = ["rfq", "name", "categoryCode", "unitCode"];

// Excel cells come in as strings, so we coerce numbers/bools defensively.
const num = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}, z.number().nonnegative()).optional();

const bool = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "1" || s === "y";
}, z.boolean());

const rowSchema = z.object({
  rfq:                z.string().min(1).max(64),
  name:               z.string().min(1).max(200),
  categoryCode:       z.string().min(1),
  unitCode:           z.string().min(1),
  supplierName:       z.string().optional().transform((v) => v?.trim() || undefined),
  manufacturerName:   z.string().optional().transform((v) => v?.trim() || undefined),
  isMaintenancePart:  bool.default(false),
  reorderLevel:       num,
  minStock:           num,
  maxStock:           num,
  description:        z.string().max(2000).optional().transform((v) => v?.trim() || undefined),
});

// POST /api/items/import
// Description: Bulk-create items from an uploaded .xlsx file.
// Returns a summary so the UI can show "created N, skipped M, errors […]".
export const POST = withApi(async (req) => {
  await requireUser();

  let file: File;
  try {
    file = await readUpload(req);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Invalid upload", 400);
  }

  const rows = await parseSheetRows(file, "Items");
  const missing = missingHeaders(rows, REQUIRED_HEADERS);
  if (missing.length) {
    return jsonError(
      `Missing required column(s): ${missing.join(", ")}. Download the template to see the expected structure.`,
      400,
    );
  }
  if (rows.length === 0) {
    return jsonError("No data rows found. Did you upload an empty template?", 400);
  }

  // Pre-load lookups once to avoid N round-trips per row.
  const [cats, units, suppliers, manufacturers, existingRfqs] = await Promise.all([
    prisma.category.findMany({ select: { id: true, code: true } }),
    prisma.unit.findMany({ select: { id: true, code: true } }),
    prisma.supplier.findMany({ select: { id: true, name: true } }),
    prisma.manufacturer.findMany({ select: { id: true, name: true } }),
    prisma.item.findMany({ where: { deletedAt: null }, select: { rfq: true } }),
  ]);

  const catByCode    = new Map(cats.map((c) => [c.code.toLowerCase(), c.id]));
  const unitByCode   = new Map(units.map((u) => [u.code.toLowerCase(), u.id]));
  const supByName    = new Map(suppliers.map((s) => [s.name.toLowerCase(), s.id]));
  const mfgByName    = new Map(manufacturers.map((m) => [m.name.toLowerCase(), m.id]));
  const usedRfqs     = new Set(existingRfqs.map((r) => r.rfq.toLowerCase()));

  const errors: RowError[] = [];
  const valid: Array<{
    rowNum: number;
    data: {
      rfq: string;
      name: string;
      categoryId: bigint;
      unitId: bigint;
      defaultSupplierId: bigint | null;
      manufacturerId: bigint | null;
      isMaintenancePart: boolean;
      reorderLevel: number;
      minStock: number;
      maxStock: number;
      description: string | null;
    };
  }> = [];

  rows.forEach((raw, idx) => {
    // +2 because row 1 is the header in the sheet.
    const rowNum = idx + 2;
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      errors.push({
        row: rowNum,
        message: `${first.path.join(".") || "row"}: ${first.message}`,
      });
      return;
    }
    const r = parsed.data;

    const rfqKey = r.rfq.toLowerCase();
    if (usedRfqs.has(rfqKey)) {
      errors.push({ row: rowNum, message: `RFQ "${r.rfq}" already exists` });
      return;
    }

    const categoryId = catByCode.get(r.categoryCode.toLowerCase());
    if (!categoryId) {
      errors.push({ row: rowNum, message: `Unknown categoryCode "${r.categoryCode}"` });
      return;
    }
    const unitId = unitByCode.get(r.unitCode.toLowerCase());
    if (!unitId) {
      errors.push({ row: rowNum, message: `Unknown unitCode "${r.unitCode}"` });
      return;
    }

    let defaultSupplierId: bigint | null = null;
    if (r.supplierName) {
      const sid = supByName.get(r.supplierName.toLowerCase());
      if (!sid) {
        errors.push({ row: rowNum, message: `Unknown supplier "${r.supplierName}"` });
        return;
      }
      defaultSupplierId = sid;
    }

    let manufacturerId: bigint | null = null;
    if (r.manufacturerName) {
      const mid = mfgByName.get(r.manufacturerName.toLowerCase());
      if (!mid) {
        errors.push({ row: rowNum, message: `Unknown manufacturer "${r.manufacturerName}"` });
        return;
      }
      manufacturerId = mid;
    }

    valid.push({
      rowNum,
      data: {
        rfq: r.rfq,
        name: r.name,
        categoryId,
        unitId,
        defaultSupplierId,
        manufacturerId,
        isMaintenancePart: r.isMaintenancePart,
        reorderLevel: r.reorderLevel ?? 0,
        minStock: r.minStock ?? 0,
        maxStock: r.maxStock ?? 0,
        description: r.description ?? null,
      },
    });
    usedRfqs.add(rfqKey); // catch dupes within the same upload
  });

  // Insert each valid row in its own transaction so a single failure (e.g.
  // race with another import) does not roll back rows the user could keep.
  let created = 0;
  for (const v of valid) {
    try {
      await prisma.item.create({ data: v.data });
      created++;
    } catch (err) {
      errors.push({
        row: v.rowNum,
        message: err instanceof Error ? err.message : "Insert failed",
      });
    }
  }

  const summary: ImportSummary = {
    created,
    skipped: rows.length - created,
    errors,
  };
  return jsonOk(summary);
});
