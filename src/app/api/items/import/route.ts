import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, requireUser, withApi } from "@/lib/api";
import {
  missingHeaders,
  parseSheetRows,
  readUpload,
  type ImportSummary,
  type RowError,
} from "@/lib/excel";

const REQUIRED_HEADERS = ["name", "categoryCode", "unitCode"];

// Mirrors the auto-serial format used by /api/items POST. Imports walk the
// counter forward across rows so each new item gets a fresh JC-NNNNN.
const SERIAL_PREFIX = "JC-";
const SERIAL_PAD    = 5;
const formatSerial = (n: number) =>
  `${SERIAL_PREFIX}${String(n).padStart(SERIAL_PAD, "0")}`;

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

  // Pre-load lookups once to avoid N round-trips per row. We also seed the
  // serial counter from the current item count so each new row gets the next
  // JC-NNNNN — including soft-deleted rows so a deleted item's serial is
  // never reused.
  const [cats, units, suppliers, manufacturers, baseCount] = await Promise.all([
    prisma.category.findMany({ select: { id: true, code: true } }),
    prisma.unit.findMany({ select: { id: true, code: true } }),
    prisma.supplier.findMany({ select: { id: true, name: true } }),
    prisma.manufacturer.findMany({ select: { id: true, name: true } }),
    prisma.item.count(),
  ]);

  const catByCode  = new Map(cats.map((c) => [c.code.toLowerCase(), c.id]));
  const unitByCode = new Map(units.map((u) => [u.code.toLowerCase(), u.id]));
  const supByName  = new Map(suppliers.map((s) => [s.name.toLowerCase(), s.id]));
  const mfgByName  = new Map(manufacturers.map((m) => [m.name.toLowerCase(), m.id]));

  const errors: RowError[] = [];
  const valid: Array<{
    rowNum: number;
    data: {
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
  });

  // Insert each valid row, walking the auto-generated serial forward as we
  // go. Concurrent imports could collide on the same JC-NNNNN — when that
  // happens (Prisma P2002), we advance the counter and retry per row.
  let created = 0;
  let cursor  = baseCount;
  const MAX_RETRIES = 8;
  for (const v of valid) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      cursor += 1;
      try {
        await prisma.item.create({ data: { ...v.data, rfq: formatSerial(cursor) } });
        created++;
        break;
      } catch (err) {
        const isUniqueViolation =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!isUniqueViolation || attempt === MAX_RETRIES - 1) {
          errors.push({
            row: v.rowNum,
            message: err instanceof Error ? err.message : "Insert failed",
          });
          break;
        }
        // P2002: bump cursor and try again with the next serial.
      }
    }
  }

  const summary: ImportSummary = {
    created,
    skipped: rows.length - created,
    errors,
  };
  return jsonOk(summary);
});
