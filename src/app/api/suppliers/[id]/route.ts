import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  jsonOk,
  parseBigIntId,
  parseJson,
  requireUser,
  withApi,
} from "@/lib/api";

const patchSchema = z.object({
  name:        z.string().min(1).max(200).optional(),
  contactName: z.string().max(200).nullable().optional(),
  email:       z.string().email().nullable().optional(),
  phone:       z.string().max(64).nullable().optional(),
  address:     z.string().max(500).nullable().optional(),
  isActive:    z.boolean().optional(),
});

export const PATCH = withApi(async (req, ctx) => {
  await requireUser();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);
  const body = await parseJson(req, patchSchema);

  const updated = await prisma.supplier.update({
    where: { id },
    data: body,
  });

  return jsonOk(updated);
});

export const DELETE = withApi(async (_req, ctx) => {
  await requireUser();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);

  await prisma.supplier.delete({ where: { id } });

  return jsonOk({ id: idStr });
});
