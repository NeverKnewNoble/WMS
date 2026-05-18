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

  const where: Prisma.SupplierWhereInput = search
    ? {
        OR: [
          { name:        { contains: search, mode: "insensitive" } },
          { contactName: { contains: search, mode: "insensitive" } },
          { phone:       { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.supplier.count({ where }),
  ]);

  return jsonOk({ data: rows, total, limit, offset });
});

const createSchema = z.object({
  name:        z.string().min(1).max(200),
  contactName: z.string().max(200).nullable().optional(),
  email:       z.string().email().nullable().optional(),
  phone:       z.string().max(64).nullable().optional(),
  address:     z.string().max(500).nullable().optional(),
  isActive:    z.boolean().optional(),
});

export const POST = withApi(async (req) => {
  await requireAdmin();
  const body = await parseJson(req, createSchema);

  const supplier = await prisma.supplier.create({
    data: {
      name:        body.name,
      contactName: body.contactName ?? null,
      email:       body.email ?? null,
      phone:       body.phone ?? null,
      address:     body.address ?? null,
      isActive:    body.isActive ?? true,
    },
  });

  return jsonOk(supplier, { status: 201 });
});
