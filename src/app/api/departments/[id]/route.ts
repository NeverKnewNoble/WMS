import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  jsonOk,
  parseBigIntId,
  parseJson,
  requireAdmin,
  withApi,
} from "@/lib/api";

const patchSchema = z.object({
  code:  z.string().min(1).max(32).optional(),
  label: z.string().min(1).max(200).optional(),
});

export const PATCH = withApi(async (req, ctx) => {
  await requireAdmin();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);
  const body = await parseJson(req, patchSchema);

  const updated = await prisma.department.update({
    where: { id },
    data: body,
  });

  return jsonOk(updated);
});

export const DELETE = withApi(async (_req, ctx) => {
  await requireAdmin();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);

  await prisma.department.delete({ where: { id } });

  return jsonOk({ id: idStr });
});
