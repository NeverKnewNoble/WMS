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

  const where: Prisma.StorageLocationWhereInput = search
    ? {
        OR: [
          { code:    { contains: search, mode: "insensitive" } },
          { label:   { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.storageLocation.findMany({
      where,
      orderBy: { label: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.storageLocation.count({ where }),
  ]);

  return jsonOk({ data: rows, total, limit, offset });
});

const createSchema = z.object({
  code:    z.string().min(1).max(32),
  label:   z.string().min(1).max(200),
  address: z.string().max(500).nullable().optional(),
});

export const POST = withApi(async (req) => {
  await requireAdmin();
  const body = await parseJson(req, createSchema);

  const location = await prisma.storageLocation.create({
    data: {
      code:    body.code,
      label:   body.label,
      address: body.address ?? null,
    },
  });

  return jsonOk(location, { status: 201 });
});
