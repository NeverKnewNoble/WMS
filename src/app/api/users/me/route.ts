import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonOk, parseJson, requireUser, withApi } from "@/lib/api";

export const GET = withApi(async () => {
  const me = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    include: { role: true, department: true, defaultSite: true },
  });
  if (!user) return jsonOk(null, { status: 404 });

  return jsonOk({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    status: user.status,
    role: { code: user.role.code, label: user.role.label },
    department: user.department
      ? { id: user.department.id, code: user.department.code, label: user.department.label }
      : null,
    defaultSite: user.defaultSite
      ? { id: user.defaultSite.id, code: user.defaultSite.code, label: user.defaultSite.label }
      : null,
    isVerified: user.emailVerifiedAt !== null,
  });
});

const patchSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone:    z.string().max(40).nullable().optional(),
  bio:      z.string().max(1000).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  defaultSiteId: z.string().nullable().optional(),
});

export const PATCH = withApi(async (req) => {
  const me = await requireUser();
  const body = await parseJson(req, patchSchema);

  const updated = await prisma.user.update({
    where: { id: me.id },
    data: {
      fullName:      body.fullName,
      phone:         body.phone,
      bio:           body.bio,
      avatarUrl:     body.avatarUrl,
      departmentId:  body.departmentId  === undefined ? undefined : body.departmentId  ? BigInt(body.departmentId)  : null,
      defaultSiteId: body.defaultSiteId === undefined ? undefined : body.defaultSiteId ? BigInt(body.defaultSiteId) : null,
    },
    include: { role: true, department: true, defaultSite: true },
  });

  return jsonOk({
    id: updated.id,
    email: updated.email,
    fullName: updated.fullName,
    phone: updated.phone,
    bio: updated.bio,
    avatarUrl: updated.avatarUrl,
    role: { code: updated.role.code, label: updated.role.label },
    department: updated.department,
    defaultSite: updated.defaultSite,
  });
});
