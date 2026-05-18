import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseJson,
  readPagination,
  requireUser,
  withApi,
} from "@/lib/api";

export const GET = withApi(async (req) => {
  await requireUser();
  const url = new URL(req.url);
  const { limit, offset } = readPagination(url);
  const kind      = url.searchParams.get("kind");      // operations | maintenance
  const direction = url.searchParams.get("direction"); // in | out
  const projectId = url.searchParams.get("projectId");
  const search    = url.searchParams.get("q")?.trim() ?? null;

  const where: Prisma.StockMovementWhereInput = {
    deletedAt: null,
    ...(kind === "operations" || kind === "maintenance" ? { kind } : {}),
    ...(direction === "in" || direction === "out" ? { direction } : {}),
    ...(projectId ? { projectId: BigInt(projectId) } : {}),
    ...(search ? { refNo: { contains: search, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        items:        { include: { item: true, unit: true } },
        supplier:     true,
        project:      true,
        department:   true,
        site:         true,
        technician:   true,
        receivedBy:   true,
        issuedTo:     true,
        authorisedBy: true,
        manufacturer: true,
        storageLocation: true,
      },
      orderBy: [{ movementDate: "desc" }, { id: "desc" }],
      skip: offset,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  const data = rows.map((m) => ({
    id: m.id,
    refNo: m.refNo,
    direction: m.direction,
    kind: m.kind,
    movementDate: m.movementDate,
    rfq: m.rfq,
    notes: m.notes,
    supplier: m.supplier,
    project: m.project,
    department: m.department,
    activity: m.activity,
    site: m.site,
    technician: m.technician
      ? { id: m.technician.id, fullName: m.technician.fullName }
      : null,
    application: m.application,
    manufacturer: m.manufacturer,
    storageLocation: m.storageLocation,
    receivedBy: m.receivedBy
      ? { id: m.receivedBy.id, fullName: m.receivedBy.fullName }
      : null,
    issuedTo: m.issuedTo
      ? { id: m.issuedTo.id, fullName: m.issuedTo.fullName }
      : null,
    authorisedBy: m.authorisedBy
      ? { id: m.authorisedBy.id, fullName: m.authorisedBy.fullName }
      : null,
    lines: m.items.map((li) => ({
      id: li.id,
      itemId: li.itemId,
      itemName: li.item.name,
      itemRfq: li.item.rfq,
      qty: li.qty.toNumber(),
      unit: li.unit.label,
      unitCode: li.unit.code,
      condition: li.condition,
      note: li.note,
    })),
  }));

  return jsonOk({ data, total, limit, offset });
});

const lineSchema = z.object({
  itemRfq: z.string().min(1),
  qty: z.number().positive(),
  unitCode: z.string().min(1),
  condition: z.enum(["good", "damaged", "partial", "rejected"]).optional(),
  note: z.string().max(500).nullable().optional(),
});

const createSchema = z.object({
  // refNo is optional: clients can supply their own (e.g. legacy or imported
  // movements), and the server will auto-generate one (GRN-YYYY-NNNN /
  // MRN-YYYY-NNNN) when it's omitted or blank.
  refNo: z.string().min(1).max(64).optional(),
  direction: z.enum(["in", "out"]),
  kind: z.enum(["operations", "maintenance"]),
  movementDate: z.string(),
  rfq: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),

  supplierName: z.string().nullable().optional(),
  receivedByEmail: z.string().email().nullable().optional(),

  projectWbs: z.string().nullable().optional(),
  departmentCode: z.string().nullable().optional(),
  activity: z.string().nullable().optional(),
  issuedToEmail: z.string().email().nullable().optional(),
  authorisedByEmail: z.string().email().nullable().optional(),

  siteCode: z.string().nullable().optional(),
  technicianEmail: z.string().email().nullable().optional(),
  application: z.string().nullable().optional(),
  manufacturerName: z.string().nullable().optional(),
  storageLocationCode: z.string().nullable().optional(),

  lines: z.array(lineSchema).min(1),
});

async function emailToUserId(email: string | null | undefined) {
  if (!email) return null;
  const u = await prisma.user.findUnique({ where: { email } });
  return u?.id ?? null;
}

// Auto-generated movement reference numbers follow the convention
// GRN-YYYY-NNNN (stock-in) and MRN-YYYY-NNNN (stock-out). The sequence
// resets each calendar year by virtue of being scoped via `startsWith`.
async function generateRefNo(direction: "in" | "out"): Promise<string> {
  const year   = new Date().getFullYear();
  const prefix = direction === "in" ? "GRN" : "MRN";
  const count  = await prisma.stockMovement.count({
    where: { direction, refNo: { startsWith: `${prefix}-${year}-` } },
  });
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

export const POST = withApi(async (req) => {
  const me = await requireUser();
  const body = await parseJson(req, createSchema);

  // Maintenance movements are admin-only; storekeepers can only create
  // operations-kind stock-in/out entries.
  if (body.kind === "maintenance" && me.role !== "admin") {
    return jsonError("Admins only", 403);
  }

  // Resolve all FK lookups up-front.
  const [supplier, project, department, site, manufacturer, storage] = await Promise.all([
    body.supplierName        ? prisma.supplier.findUnique({ where: { name: body.supplierName } })           : null,
    body.projectWbs          ? prisma.project.findUnique({ where: { wbs: body.projectWbs } })               : null,
    body.departmentCode      ? prisma.department.findUnique({ where: { code: body.departmentCode } })       : null,
    body.siteCode            ? prisma.site.findUnique({ where: { code: body.siteCode } })                   : null,
    body.manufacturerName    ? prisma.manufacturer.findUnique({ where: { name: body.manufacturerName } })   : null,
    body.storageLocationCode ? prisma.storageLocation.findUnique({ where: { code: body.storageLocationCode } }) : null,
  ]);

  // Soft validations matching the §7 CHECK constraint.
  if (body.kind === "operations" && body.direction === "in"  && !supplier)
    return jsonError("Operations stock-in requires supplierName", 400);
  if (body.kind === "operations" && body.direction === "out" && !project)
    return jsonError("Operations stock-out requires projectWbs", 400);
  if (body.kind === "maintenance" && !site)
    return jsonError("Maintenance movements require siteCode", 400);

  const [receivedById, issuedToId, authorisedById, technicianId] = await Promise.all([
    emailToUserId(body.receivedByEmail),
    emailToUserId(body.issuedToEmail),
    emailToUserId(body.authorisedByEmail),
    emailToUserId(body.technicianEmail),
  ]);

  // Resolve item + unit per line.
  const lineData = await Promise.all(
    body.lines.map(async (l) => {
      const item = await prisma.item.findUnique({ where: { rfq: l.itemRfq } });
      if (!item) throw new Error(`Item ${l.itemRfq} not found`);
      const unit = await prisma.unit.findUnique({ where: { code: l.unitCode } });
      if (!unit) throw new Error(`Unit ${l.unitCode} not found`);
      return {
        itemId: item.id,
        unitId: unit.id,
        qty: l.qty,
        condition: l.condition ?? "good",
        note: l.note ?? null,
      };
    }),
  );

  // When the client supplies a refNo we use it as-is; otherwise we walk the
  // generator forward, retrying on unique-violation in case of a concurrent
  // create. With a year-scoped count this only collides under simultaneous
  // inserts, so a small retry budget is plenty.
  const userSuppliedRef = (body.refNo ?? "").trim();
  const MAX_TRIES = 8;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const refNo = userSuppliedRef || (await generateRefNo(body.direction));
    try {
      const created = await prisma.stockMovement.create({
        data: {
          refNo,
          direction: body.direction,
          kind: body.kind,
          movementDate: new Date(body.movementDate),
          rfq: body.rfq ?? null,
          notes: body.notes ?? null,

          supplierId: supplier?.id ?? null,
          receivedByUserId: receivedById,

          projectId: project?.id ?? null,
          departmentId: department?.id ?? null,
          activity: body.activity ?? null,
          issuedToUserId: issuedToId,
          authorisedByUserId: authorisedById,

          siteId: site?.id ?? null,
          technicianUserId: technicianId,
          application: body.application ?? null,
          manufacturerId: manufacturer?.id ?? null,
          storageLocationId: storage?.id ?? null,

          createdByUserId: me.id,

          items: { create: lineData },
        },
        include: { items: true },
      });
      return jsonOk(created, { status: 201 });
    } catch (err) {
      const isUniqueViolation =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      // User-supplied duplicates are a real error, not something to silently retry.
      if (!isUniqueViolation || userSuppliedRef || attempt === MAX_TRIES - 1) throw err;
    }
  }

  return jsonError("Could not generate a unique reference number", 500);
});
