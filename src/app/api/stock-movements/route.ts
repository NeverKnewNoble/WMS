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
  refNo: z.string().min(1).max(64),
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

export const POST = withApi(async (req) => {
  const me = await requireUser();
  const body = await parseJson(req, createSchema);

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

  const created = await prisma.stockMovement.create({
    data: {
      refNo: body.refNo,
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
});
