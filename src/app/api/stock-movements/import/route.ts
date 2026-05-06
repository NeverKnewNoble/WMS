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

const SHARED_REQUIRED = ["refNo", "movementDate", "itemRfq", "qty", "unitCode"];
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
  refNo:          z.string().min(1).max(64),
  movementDate:   isoDate,
  itemRfq:        z.string().min(1),
  qty:            num,
  unitCode:       z.string().min(1),
  rfq:            optStr,
  departmentCode: optStr,
  notes:          optStr,
});

const inRow = baseRow.extend({
  supplierName:        z.string().min(1),
  storageLocationCode: optStr,
  receivedByEmail:     optEmail,
  condition:           optCondition,
});

const outRow = baseRow.extend({
  projectWbs:        z.string().min(1),
  activity:          optStr,
  issuedToEmail:     optEmail,
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

  // Pre-load lookups once so per-row resolution is in-memory.
  const [items, units, suppliers, projects, departments, storage, users, existingRefs] =
    await Promise.all([
      prisma.item.findMany({ where: { deletedAt: null }, select: { id: true, rfq: true } }),
      prisma.unit.findMany({ select: { id: true, code: true } }),
      prisma.supplier.findMany({ select: { id: true, name: true } }),
      prisma.project.findMany({
        where: { deletedAt: null },
        select: { id: true, wbs: true },
      }),
      prisma.department.findMany({ select: { id: true, code: true } }),
      prisma.storageLocation.findMany({ select: { id: true, code: true } }),
      prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, email: true },
      }),
      prisma.stockMovement.findMany({
        where: { deletedAt: null },
        select: { refNo: true },
      }),
    ]);

  const itemByRfq    = new Map(items.map((i) => [i.rfq.toLowerCase(), i.id]));
  const unitByCode   = new Map(units.map((u) => [u.code.toLowerCase(), u.id]));
  const supByName    = new Map(suppliers.map((s) => [s.name.toLowerCase(), s.id]));
  const projByWbs    = new Map(projects.map((p) => [p.wbs.toLowerCase(), p.id]));
  const deptByCode   = new Map(departments.map((d) => [d.code.toLowerCase(), d.id]));
  const storeByCode  = new Map(storage.map((s) => [s.code.toLowerCase(), s.id]));
  const userByEmail  = new Map(users.map((u) => [u.email.toLowerCase(), u.id]));
  const usedRefs     = new Set(existingRefs.map((r) => r.refNo.toLowerCase()));

  // ─── Validate every row, then group by refNo ──────────────────────

  type ValidLine = {
    rowNum: number;
    itemId: bigint;
    unitId: bigint;
    qty: number;
    condition: "good" | "damaged" | "partial" | "rejected";
    note: string | null;
  };

  type ValidGroup = {
    rowNum: number; // first row that opened the group, for error attribution
    refNo: string;
    movementDate: Date;
    rfq: string | null;
    notes: string | null;
    departmentId: bigint | null;
    // direction-specific
    supplierId?: bigint;
    storageLocationId?: bigint | null;
    receivedByUserId?: bigint | null;
    projectId?: bigint;
    activity?: string | null;
    issuedToUserId?: bigint | null;
    authorisedByUserId?: bigint | null;
    lines: ValidLine[];
  };

  const errors: RowError[] = [];
  const groups = new Map<string, ValidGroup>();

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

    const refKey = r.refNo.toLowerCase();
    if (usedRefs.has(refKey)) {
      errors.push({ row: rowNum, message: `refNo "${r.refNo}" already exists` });
      return;
    }

    const itemId = itemByRfq.get(r.itemRfq.toLowerCase());
    if (!itemId) {
      errors.push({ row: rowNum, message: `Unknown itemRfq "${r.itemRfq}"` });
      return;
    }
    const unitId = unitByCode.get(r.unitCode.toLowerCase());
    if (!unitId) {
      errors.push({ row: rowNum, message: `Unknown unitCode "${r.unitCode}"` });
      return;
    }

    let departmentId: bigint | null = null;
    if (r.departmentCode) {
      const did = deptByCode.get(r.departmentCode.toLowerCase());
      if (!did) {
        errors.push({ row: rowNum, message: `Unknown departmentCode "${r.departmentCode}"` });
        return;
      }
      departmentId = did;
    }

    // Direction-specific resolution.
    let supplierId: bigint | undefined;
    let storageLocationId: bigint | null | undefined;
    let receivedByUserId: bigint | null | undefined;
    let projectId: bigint | undefined;
    let issuedToUserId: bigint | null | undefined;
    let authorisedByUserId: bigint | null | undefined;
    let activity: string | null | undefined;
    let condition: ValidLine["condition"] = "good";

    if (direction === "in") {
      const ri = r as z.infer<typeof inRow>;
      const sid = supByName.get(ri.supplierName.toLowerCase());
      if (!sid) {
        errors.push({ row: rowNum, message: `Unknown supplier "${ri.supplierName}"` });
        return;
      }
      supplierId = sid;

      if (ri.storageLocationCode) {
        const slid = storeByCode.get(ri.storageLocationCode.toLowerCase());
        if (!slid) {
          errors.push({ row: rowNum, message: `Unknown storageLocationCode "${ri.storageLocationCode}"` });
          return;
        }
        storageLocationId = slid;
      } else storageLocationId = null;

      if (ri.receivedByEmail) {
        const uid = userByEmail.get(ri.receivedByEmail.toLowerCase());
        if (!uid) {
          errors.push({ row: rowNum, message: `Unknown receivedByEmail "${ri.receivedByEmail}"` });
          return;
        }
        receivedByUserId = uid;
      } else receivedByUserId = null;

      if (ri.condition) condition = ri.condition;
    } else {
      const ro = r as z.infer<typeof outRow>;
      const pid = projByWbs.get(ro.projectWbs.toLowerCase());
      if (!pid) {
        errors.push({ row: rowNum, message: `Unknown projectWbs "${ro.projectWbs}"` });
        return;
      }
      projectId = pid;
      activity = ro.activity ?? null;

      if (ro.issuedToEmail) {
        const uid = userByEmail.get(ro.issuedToEmail.toLowerCase());
        if (!uid) {
          errors.push({ row: rowNum, message: `Unknown issuedToEmail "${ro.issuedToEmail}"` });
          return;
        }
        issuedToUserId = uid;
      } else issuedToUserId = null;

      if (ro.authorisedByEmail) {
        const uid = userByEmail.get(ro.authorisedByEmail.toLowerCase());
        if (!uid) {
          errors.push({ row: rowNum, message: `Unknown authorisedByEmail "${ro.authorisedByEmail}"` });
          return;
        }
        authorisedByUserId = uid;
      } else authorisedByUserId = null;
    }

    const line: ValidLine = {
      rowNum,
      itemId,
      unitId,
      qty: r.qty,
      condition,
      note: null,
    };

    const existing = groups.get(refKey);
    if (existing) {
      existing.lines.push(line);
      return;
    }

    groups.set(refKey, {
      rowNum,
      refNo: r.refNo,
      movementDate: new Date(r.movementDate),
      rfq: r.rfq ?? null,
      notes: r.notes ?? null,
      departmentId,
      supplierId,
      storageLocationId,
      receivedByUserId,
      projectId,
      activity,
      issuedToUserId,
      authorisedByUserId,
      lines: [line],
    });
  });

  // ─── Insert each grouped movement in a transaction ────────────────

  let created = 0;
  for (const g of groups.values()) {
    try {
      await prisma.stockMovement.create({
        data: {
          refNo: g.refNo,
          direction,
          kind: "operations", // bulk imports cover ops; maintenance has its own UI flow
          movementDate: g.movementDate,
          rfq: g.rfq,
          notes: g.notes,
          departmentId: g.departmentId,
          supplierId: g.supplierId ?? null,
          storageLocationId: g.storageLocationId ?? null,
          receivedByUserId: g.receivedByUserId ?? null,
          projectId: g.projectId ?? null,
          activity: g.activity ?? null,
          issuedToUserId: g.issuedToUserId ?? null,
          authorisedByUserId: g.authorisedByUserId ?? null,
          createdByUserId: me.id,
          items: {
            create: g.lines.map((l) => ({
              itemId: l.itemId,
              unitId: l.unitId,
              qty: l.qty,
              condition: l.condition,
              note: l.note,
            })),
          },
        },
      });
      created++;
    } catch (err) {
      errors.push({
        row: g.rowNum,
        message: err instanceof Error ? err.message : "Insert failed",
      });
    }
  }

  const summary: ImportSummary = {
    created,
    skipped: groups.size - created,
    errors,
  };
  return jsonOk(summary);
});
