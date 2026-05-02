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
  const search = url.searchParams.get("q")?.trim() ?? null;
  const status = url.searchParams.get("status");

  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { wbs:  { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status && ["active", "on_hold", "completed"].includes(status)
      ? { status: status as "active" | "on_hold" | "completed" }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { region: true, manager: true },
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  // Aggregate consumption per project from movement items.
  const ids = rows.map((p) => p.id);
  const consumption = ids.length
    ? await prisma.stockMovementItem.groupBy({
        by: ["movementId"],
        where: {
          movement: {
            projectId: { in: ids },
            direction: "out",
            deletedAt: null,
          },
        },
        _sum: { qty: true },
      })
    : [];

  // Map back via movement.projectId. Need movement->project lookup.
  const movementIds = consumption.map((c) => c.movementId);
  const movements = movementIds.length
    ? await prisma.stockMovement.findMany({
        where: { id: { in: movementIds } },
        select: { id: true, projectId: true, movementDate: true },
      })
    : [];
  const movementToProject = new Map(movements.map((m) => [m.id, m.projectId]));

  const consumedByProject = new Map<string, number>();
  const lastActivityByProject = new Map<string, Date>();
  for (const c of consumption) {
    const pid = movementToProject.get(c.movementId);
    if (!pid) continue;
    const key = pid.toString();
    consumedByProject.set(
      key,
      (consumedByProject.get(key) ?? 0) + (c._sum.qty?.toNumber() ?? 0),
    );
  }
  for (const m of movements) {
    if (!m.projectId) continue;
    const key = m.projectId.toString();
    const prev = lastActivityByProject.get(key);
    if (!prev || m.movementDate > prev) lastActivityByProject.set(key, m.movementDate);
  }

  const data = rows.map((p) => ({
    id: p.id,
    wbs: p.wbs,
    name: p.name,
    location: p.location,
    region: p.region,
    manager: p.manager
      ? { id: p.manager.id, fullName: p.manager.fullName, email: p.manager.email }
      : null,
    status: p.status,
    startDate: p.startDate,
    estimatedEndDate: p.estimatedEndDate,
    budget: p.budget?.toNumber() ?? null,
    qtyConsumed: consumedByProject.get(p.id.toString()) ?? 0,
    lastActivity: lastActivityByProject.get(p.id.toString()) ?? null,
  }));

  return jsonOk({ data, total, limit, offset });
});

const createSchema = z.object({
  wbs:      z.string().min(1).max(32),
  name:     z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  regionCode: z.string().nullable().optional(),
  managerEmail: z.string().email().nullable().optional(),
  status:   z.enum(["active", "on_hold", "completed"]).optional(),
  startDate: z.string().nullable().optional(),
  estimatedEndDate: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
});


export const POST = withApi(async (req) => {
  await requireUser();
  const body = await parseJson(req, createSchema);

  const region = body.regionCode
    ? await prisma.region.findUnique({ where: { code: body.regionCode } })
    : null;
  if (body.regionCode && !region) return jsonError("Unknown region", 400);

  const manager = body.managerEmail
    ? await prisma.user.findUnique({ where: { email: body.managerEmail } })
    : null;
  if (body.managerEmail && !manager) return jsonError("Manager email not found", 400);

  const project = await prisma.project.create({
    data: {
      wbs: body.wbs,
      name: body.name,
      location: body.location,
      regionId: region?.id ?? null,
      managerUserId: manager?.id ?? null,
      status: body.status ?? "active",
      startDate: body.startDate ? new Date(body.startDate) : null,
      estimatedEndDate: body.estimatedEndDate ? new Date(body.estimatedEndDate) : null,
      budget: body.budget ?? null,
      description: body.description ?? null,
    },
  });

  return jsonOk(project, { status: 201 });
});
