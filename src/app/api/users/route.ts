import { z } from "zod";
import { hash as argonHash } from "@node-rs/argon2";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  jsonError,
  jsonOk,
  parseJson,
  readPagination,
  requireAdmin,
  withApi,
} from "@/lib/api";

export const GET = withApi(async (req) => {
  const me = await requireAdmin();
  const url = new URL(req.url);
  const { limit, offset } = readPagination(url);
  const search = url.searchParams.get("q")?.trim() ?? null;

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    id: { not: me.id },
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email:    { contains: search, mode: "insensitive" } },
            { phone:    { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true, department: true },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return jsonOk({
    data: rows.map((u) => ({
      id:        u.id,
      email:     u.email,
      fullName:  u.fullName,
      phone:     u.phone,
      status:    u.status,
      role:       { id: u.role.id, code: u.role.code, label: u.role.label },
      department: u.department
        ? { id: u.department.id, code: u.department.code, label: u.department.label }
        : null,
      lastLoginAt: u.lastLoginAt,
      createdAt:   u.createdAt,
    })),
    total,
    limit,
    offset,
  });
});

const createSchema = z.object({
  fullName:     z.string().min(2).max(200),
  email:        z.string().email(),
  password:     z.string().min(8).max(200),
  roleCode:     z.enum(["admin", "storekeeper"]),
  phone:        z.string().max(64).nullable().optional(),
  departmentId: z.string().nullable().optional(),
  status:       z.enum(["active", "invited", "suspended"]).optional(),
});

export const POST = withApi(async (req) => {
  await requireAdmin();
  const body = await parseJson(req, createSchema);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return jsonError("An account with that email already exists.", 409);
  }

  const role = await prisma.role.findUnique({ where: { code: body.roleCode } });
  if (!role) {
    return jsonError("Selected role does not exist.", 400);
  }

  const passwordHash = await argonHash(body.password);

  const user = await prisma.user.create({
    data: {
      email:        body.email,
      fullName:     body.fullName,
      phone:        body.phone ?? null,
      passwordHash,
      roleId:       role.id,
      departmentId: body.departmentId ? BigInt(body.departmentId) : null,
      status:       body.status ?? "active",
    },
    include: { role: true, department: true },
  });

  return jsonOk(
    {
      id:        user.id,
      email:     user.email,
      fullName:  user.fullName,
      phone:     user.phone,
      status:    user.status,
      role:       { id: user.role.id, code: user.role.code, label: user.role.label },
      department: user.department
        ? { id: user.department.id, code: user.department.code, label: user.department.label }
        : null,
      lastLoginAt: user.lastLoginAt,
      createdAt:   user.createdAt,
    },
    { status: 201 },
  );
});
