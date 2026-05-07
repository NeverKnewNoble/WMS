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

// Reference numbers (refNo) and the line's unit are no longer collected
// from the sheet — refNo is auto-generated as GRN/MRN-YYYY-NNNN, and the
// unit is read from the item itself.
const SHARED_REQUIRED = ["movementDate", "itemRfq", "qty"];
const IN_REQUIRED  = [...SHARED_REQUIRED, "supplierName"];
const OUT_REQUIRED = [...SHARED_REQUIRED, "projectWbs"];

const num = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}, z.number().positive());

const isoDate = z
  .string()
  .min(1)
  .refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "Invalid date — use YYYY-MM-DD",
  });

// Excel users routinely leave optional cells as empty strings; normalize so
// the underlying schema (`.email()`, enum, etc.) doesn't fail on "".
const optStr = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().optional(),
);

const optEmail = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().email().optional(),
);

const optCondition = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.enum(["good", "damaged", "partial", "rejected"]).optional(),
);

const baseRow = z.object({
  movementDate: isoDate,
  itemRfq:      z.string().min(1),
  qty:          num,
  notes:        optStr,
});

const inRow = baseRow.extend({
  supplierName:        z.string().min(1),
  storageLocationCode: optStr,
  condition:           optCondition,
});

const outRow = baseRow.extend({
  projectWbs:        z.string().min(1),
  activity:          optStr,
  authorisedByEmail: optEmail,
});

// POST /api/stock-movements/import?direction=in|out
// Description: Bulk-create stock movements from .xlsx. Rows that share a
// refNo are grouped into a single StockMovement with multiple line items.
export const POST = withApi(async (req) => {
  const me = await requireUser();
  const url = new URL(req.url);
  const direction = url.searchParams.get("direction");
  if (direction !== "in" && direction !== "out") {
    return jsonError("direction must be 'in' or 'out'", 400);
  }

  let file: File;
  try {
    file = await readUpload(req);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Invalid upload", 400);
  }

  const sheetName = direction === "in" ? "StockIn" : "StockOut";
  const rows = await parseSheetRows(file, sheetName);
  const required = direction === "in" ? IN_REQUIRED : OUT_REQUIRED;
  const missing = missingHeaders(rows, required);
  if (missing.length) {
    return jsonError(
      `Missing required column(s): ${missing.join(", ")}. Download the template to see the expected structure.`,
      400,
    );
  }
  if (rows.length === 0) {
    return jsonError("No data rows found.", 400);
  }

  // Pre-load lookups once so per-row resolution is in-memory. Items now
  // carry the unit (`unitId`) so we can default the line's unit without a
  // separate Excel column. We also seed the refNo cursor from the count of
  // existing year-prefixed movements so each new row gets the next slot.
  const year       = new Date().getFullYear();
  const prefix     = direction === "in" ? "GRN" : "MRN";
  const refPrefix  = `${prefix}-${year}-`;

  const [items, suppliers, projects, storage, users, baseRefCount] = await Promise.all([
    prisma.item.findMany({
      where: { deletedAt: null },
      select: { id: true, rfq: true, unitId: true },
    }),
    prisma.supplier.findMany({ select: { id: true, name: true } }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, wbs: true },
    }),
    prisma.storageLocation.findMany({ select: { id: true, code: true } }),
    prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true },
    }),
    prisma.stockMovement.count({
      where: { direction, refNo: { startsWith: refPrefix } },
    }),
  ]);

  const itemByRfq    = new Map(items.map((i) => [i.rfq.toLowerCase(), i]));
  const supByName    = new Map(suppliers.map((s) => [s.name.toLowerCase(), s.id]));
  const projByWbs    = new Map(projects.map((p) => [p.wbs.toLowerCase(), p.id]));
  const storeByCode  = new Map(storage.map((s) => [s.code.toLowerCase(), s.id]));
  const userByEmail  = new Map(users.map((u) => [u.email.toLowerCase(), u.id]));

  // ─── Validate every row ────────────────────────────────────────────

  type Valid = {
    rowNum: number;
    movementDate: Date;
    notes: string | null;
    itemId: bigint;
    unitId: bigint;
    qty: number;
    condition: "good" | "damaged" | "partial" | "rejected";
    supplierId?: bigint;
    storageLocationId?: bigint | null;
    projectId?: bigint;
    activity?: string | null;
    authorisedByUserId?: bigint | null;
  };

  const errors: RowError[] = [];
  const valid:  Valid[]    = [];

  rows.forEach((raw, idx) => {
    const rowNum = idx + 2;
    const schema = direction === "in" ? inRow : outRow;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      errors.push({
        row: rowNum,
        message: `${first.path.join(".") || "row"}: ${first.message}`,
      });
      return;
    }
    const r = parsed.data;

    const item = itemByRfq.get(r.itemRfq.toLowerCase());
    if (!item) {
      errors.push({ row: rowNum, message: `Unknown itemRfq "${r.itemRfq}"` });
      return;
    }

    const v: Valid = {
      rowNum,
      movementDate: new Date(r.movementDate),
      notes: r.notes ?? null,
      itemId: item.id,
      unitId: item.unitId,
      qty: r.qty,
      condition: "good",
    };

    if (direction === "in") {
      const ri = r as z.infer<typeof inRow>;
      const sid = supByName.get(ri.supplierName.toLowerCase());
      if (!sid) {
        errors.push({ row: rowNum, message: `Unknown supplier "${ri.supplierName}"` });
        return;
      }
      v.supplierId = sid;

      if (ri.storageLocationCode) {
        const slid = storeByCode.get(ri.storageLocationCode.toLowerCase());
        if (!slid) {
          errors.push({ row: rowNum, message: `Unknown storageLocationCode "${ri.storageLocationCode}"` });
          return;
        }
        v.storageLocationId = slid;
      } else {
        v.storageLocationId = null;
      }

      if (ri.condition) v.condition = ri.condition;
    } else {
      const ro = r as z.infer<typeof outRow>;
      const pid = projByWbs.get(ro.projectWbs.toLowerCase());
      if (!pid) {
        errors.push({ row: rowNum, message: `Unknown projectWbs "${ro.projectWbs}"` });
        return;
      }
      v.projectId = pid;
      v.activity  = ro.activity ?? null;

      if (ro.authorisedByEmail) {
        const uid = userByEmail.get(ro.authorisedByEmail.toLowerCase());
        if (!uid) {
          errors.push({ row: rowNum, message: `Unknown authorisedByEmail "${ro.authorisedByEmail}"` });
          return;
        }
        v.authorisedByUserId = uid;
      } else {
        v.authorisedByUserId = null;
      }
    }

    valid.push(v);
  });

  // ─── Insert each row as its own movement ───────────────────────────
  // refNo is auto-generated (GRN/MRN-YYYY-NNNN) and walked forward as we
  // create. Concurrent imports could collide on the same slot — when that
  // happens (P2002) we bump the cursor and retry the row.

  let created = 0;
  let cursor  = baseRefCount;
  const MAX_RETRIES = 8;

  for (const v of valid) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      cursor += 1;
      const refNo = `${refPrefix}${String(cursor).padStart(4, "0")}`;
      try {
        await prisma.stockMovement.create({
          data: {
            refNo,
            direction,
            kind: "operations", // bulk imports cover ops; maintenance has its own UI flow
            movementDate: v.movementDate,
            notes: v.notes,
            supplierId: v.supplierId ?? null,
            storageLocationId: v.storageLocationId ?? null,
            projectId: v.projectId ?? null,
            activity: v.activity ?? null,
            authorisedByUserId: v.authorisedByUserId ?? null,
            createdByUserId: me.id,
            items: {
              create: [
                {
                  itemId: v.itemId,
                  unitId: v.unitId,
                  qty: v.qty,
                  condition: v.condition,
                  note: null,
                },
              ],
            },
          },
        });
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
        // P2002: walk the cursor forward and retry.
      }
    }
  }

  const summary: ImportSummary = {
    created,
    skipped: valid.length - created,
    errors,
  };
  return jsonOk(summary);
});
