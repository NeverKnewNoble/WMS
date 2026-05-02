import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseBigIntId,
  parseJson,
  requireUser,
  withApi,
} from "@/lib/api";

export const GET = withApi(async (_req, ctx) => {
  await requireUser();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);

  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: { region: true, manager: true },
  });
  if (!project) return jsonError("Project not found", 404);

  // Top materials issued (via outbound movements against this project).
  const topMaterialsRaw = await prisma.stockMovementItem.groupBy({
    by: ["itemId"],
    where: {
      movement: { projectId: id, direction: "out", deletedAt: null },
    },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 5,
  });

  const itemIds = topMaterialsRaw.map((m) => m.itemId);
  const items = itemIds.length
    ? await prisma.item.findMany({
        where: { id: { in: itemIds } },
        include: { unit: true },
      })
    : [];
  const itemMap = new Map(items.map((i) => [i.id.toString(), i]));

  const topMaterials = topMaterialsRaw.map((m) => {
    const item = itemMap.get(m.itemId.toString());
    return {
      itemId: m.itemId,
      name: item?.name ?? null,
      unit: item?.unit.label ?? null,
      qty: m._sum.qty?.toNumber() ?? 0,
    };
  });

  // Recent MRNs against this project.
  const recentMrns = await prisma.stockMovement.findMany({
    where: { projectId: id, direction: "out", deletedAt: null },
    include: {
      items: { include: { item: true, unit: true } },
      issuedTo: true,
    },
    orderBy: [{ movementDate: "desc" }, { id: "desc" }],
    take: 10,
  });

  return jsonOk({
    project: {
      ...project,
      budget: project.budget?.toNumber() ?? null,
    },
    topMaterials,
    recentMrns: recentMrns.map((m) => ({
      id: m.id,
      refNo: m.refNo,
      date: m.movementDate,
      issuedTo: m.issuedTo
        ? { id: m.issuedTo.id, fullName: m.issuedTo.fullName }
        : null,
      lines: m.items.map((li) => ({
        item: li.item.name,
        qty: li.qty.toNumber(),
        unit: li.unit.label,
      })),
    })),
  });
});

const patchSchema = z.object({
  wbs:      z.string().min(1).max(32).optional(),
  name:     z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(200).optional(),
  regionCode: z.string().nullable().optional(),
  managerEmail: z.string().email().nullable().optional(),
  status:   z.enum(["active", "on_hold", "completed"]).optional(),
  startDate: z.string().nullable().optional(),
  estimatedEndDate: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
});

export const PATCH = withApi(async (req, ctx) => {
  await requireUser();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);
  const body = await parseJson(req, patchSchema);

  const data: Record<string, unknown> = {
    wbs: body.wbs,
    name: body.name,
    location: body.location,
    status: body.status,
    description: body.description,
    budget: body.budget ?? undefined,
    startDate: body.startDate ? new Date(body.startDate) : body.startDate === null ? null : undefined,
    estimatedEndDate: body.estimatedEndDate ? new Date(body.estimatedEndDate) : body.estimatedEndDate === null ? null : undefined,
  };

  if (body.regionCode !== undefined) {
    if (body.regionCode === null) data.regionId = null;
    else {
      const r = await prisma.region.findUnique({ where: { code: body.regionCode } });
      if (!r) return jsonError("Unknown region", 400);
      data.regionId = r.id;
    }
  }
  if (body.managerEmail !== undefined) {
    if (body.managerEmail === null) data.managerUserId = null;
    else {
      const u = await prisma.user.findUnique({ where: { email: body.managerEmail } });
      if (!u) return jsonError("Manager email not found", 400);
      data.managerUserId = u.id;
    }
  }

  const updated = await prisma.project.update({ where: { id }, data });
  return jsonOk(updated);
});

export const DELETE = withApi(async (_req, ctx) => {
  await requireUser();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);

  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return jsonOk({ id });
});
