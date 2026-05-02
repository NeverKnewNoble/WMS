import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseBigIntId,
  requireUser,
  withApi,
} from "@/lib/api";

export const GET = withApi(async (_req, ctx) => {
  await requireUser();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);

  const m = await prisma.stockMovement.findFirst({
    where: { id, deletedAt: null },
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
  });
  if (!m) return jsonError("Movement not found", 404);

  return jsonOk(m);
});

export const DELETE = withApi(async (_req, ctx) => {
  await requireUser();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);

  // Soft delete; the trg_movement_soft_delete trigger reverses stock.
  const m = await prisma.stockMovement.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return jsonOk({ id: m.id, refNo: m.refNo });
});
