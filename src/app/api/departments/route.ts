import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  jsonOk,
  parseJson,
  readPagination,
  requireAdmin,
  requireUser,
  withApi,
} from "@/lib/api";

export const GET = withApi(async (req) => {
  await requireUser();
  const url = new URL(req.url);
  const { limit, offset } = readPagination(url);
  const search = url.searchParams.get("q")?.trim() ?? null;

  const where: Prisma.DepartmentWhereInput = search
    ? {
        OR: [
          { code:  { contains: search, mode: "insensitive" } },
          { label: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.department.findMany({
      where,
      orderBy: { label: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.department.count({ where }),
  ]);

  return jsonOk({ data: rows, total, limit, offset });
});

const createSchema = z.object({
  code:  z.string().min(1).max(32),
  label: z.string().min(1).max(200),
});

export const POST = withApi(async (req) => {
  await requireAdmin();
  const body = await parseJson(req, createSchema);

  const dept = await prisma.department.create({
    data: { code: body.code, label: body.label },
  });

  return jsonOk(dept, { status: 201 });
});
