import { z } from "zod";
import { hash as argonHash } from "@node-rs/argon2";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseBigIntId,
  parseJson,
  requireAdmin,
  withApi,
} from "@/lib/api";

const patchSchema = z.object({
  fullName:     z.string().min(2).max(200).optional(),
  email:        z.string().email().optional(),
  phone:        z.string().max(64).nullable().optional(),
  password:     z.string().min(8).max(200).optional(),
  roleCode:     z.enum(["admin", "storekeeper"]).optional(),
  departmentId: z.string().nullable().optional(),
  status:       z.enum(["active", "invited", "suspended"]).optional(),
});

export const PATCH = withApi(async (req, ctx) => {
  const me = await requireAdmin();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);
  const body = await parseJson(req, patchSchema);

  if (id === me.id) {
    return jsonError("Use Settings to edit your own profile.", 400);
  }

  if (body.email) {
    const clash = await prisma.user.findFirst({
      where: { email: body.email, id: { not: id } },
      select: { id: true },
    });
    if (clash) return jsonError("Another user already has that email.", 409);
  }

  let roleId: bigint | undefined;
  if (body.roleCode) {
    const role = await prisma.role.findUnique({ where: { code: body.roleCode } });
    if (!role) return jsonError("Selected role does not exist.", 400);
    roleId = role.id;
  }

  const passwordHash = body.password ? await argonHash(body.password) : undefined;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      fullName: body.fullName,
      email:    body.email,
      phone:    body.phone,
      passwordHash,
      roleId,
      departmentId:
        body.departmentId === undefined
          ? undefined
          : body.departmentId
            ? BigInt(body.departmentId)
            : null,
      status: body.status,
    },
    include: { role: true, department: true },
  });

  return jsonOk({
    id:        updated.id,
    email:     updated.email,
    fullName:  updated.fullName,
    phone:     updated.phone,
    status:    updated.status,
    role:       { id: updated.role.id, code: updated.role.code, label: updated.role.label },
    department: updated.department
      ? { id: updated.department.id, code: updated.department.code, label: updated.department.label }
      : null,
    lastLoginAt: updated.lastLoginAt,
    createdAt:   updated.createdAt,
  });
});

export const DELETE = withApi(async (_req, ctx) => {
  const me = await requireAdmin();
  const { id: idStr } = await ctx.params;
  const id = parseBigIntId(idStr);

  if (id === me.id) {
    return jsonError("You cannot delete your own account.", 400);
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), status: "suspended" },
  });

  return jsonOk({ id: idStr });
});
