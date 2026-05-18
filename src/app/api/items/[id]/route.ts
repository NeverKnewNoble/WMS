import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseBigIntId,
  parseJson,
  requireAdmin,
  requireUser,
  withApi,
} from "@/lib/api";


// Get a single item
// Endpoint: GET /api/items/[id]
// Description: Get a single item

export const GET = withApi(async (_req, ctx) => {
  await requireUser();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);

  const item = await prisma.item.findFirst({
    where: { id, deletedAt: null },
    include: { category: true, unit: true, defaultSupplier: true, manufacturer: true },
  });
  if (!item) return jsonError("Item not found", 404);

  return jsonOk(item);
});

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  categoryCode: z.string().optional(),
  unitCode: z.string().optional(),
  defaultSupplierName: z.string().nullable().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  minStock: z.number().nonnegative().optional(),
  maxStock: z.number().nonnegative().optional(),
  description: z.string().max(2000).nullable().optional(),
});


// Update an item
// Endpoint: PATCH /api/items/[id]
// Description: Update an item. The serial (`rfq`) is immutable — generated
// once at creation and never edited.

export const PATCH = withApi(async (req, ctx) => {
  await requireUser();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);
  const body = await parseJson(req, patchSchema);

  const data: Record<string, unknown> = {
    name: body.name,
    reorderLevel: body.reorderLevel,
    minStock: body.minStock,
    maxStock: body.maxStock,
    description: body.description,
  };

  if (body.categoryCode) {
    const c = await prisma.category.findUnique({ where: { code: body.categoryCode } });
    if (!c) return jsonError("Unknown category", 400);
    data.categoryId = c.id;
  }
  if (body.unitCode) {
    const u = await prisma.unit.findUnique({ where: { code: body.unitCode } });
    if (!u) return jsonError("Unknown unit", 400);
    data.unitId = u.id;
  }
  if (body.defaultSupplierName !== undefined) {
    if (body.defaultSupplierName === null) {
      data.defaultSupplierId = null;
    } else {
      const s = await prisma.supplier.findUnique({ where: { name: body.defaultSupplierName } });
      if (!s) return jsonError("Unknown supplier", 400);
      data.defaultSupplierId = s.id;
    }
  }

  const updated = await prisma.item.update({ where: { id }, data });
  return jsonOk(updated);
});


// Delete an item
// Endpoint: DELETE /api/items/[id]
// Description: Delete an item

export const DELETE = withApi(async (_req, ctx) => {
  await requireAdmin();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);

  await prisma.item.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return jsonOk({ id });
});
