import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  jsonOk,
  parseJson,
  readPagination,
  requireUser,
  withApi,
} from "@/lib/api";



// Get all items
// Endpoint: GET /api/items
// Description: Get all items
export const GET = withApi(async (req) => {
  await requireUser();
  const url = new URL(req.url);
  const { limit, offset } = readPagination(url);
  const search   = url.searchParams.get("q")?.trim() ?? null;
  const category = url.searchParams.get("category");
  const status   = url.searchParams.get("status");

  const where: Prisma.ItemWhereInput = {
    deletedAt: null,
    ...(category ? { category: { code: category } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { rfq:  { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { category: true, unit: true, defaultSupplier: true },
      orderBy: { name: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.item.count({ where }),
  ]);

  // Compute UI status from current_stock vs thresholds (matches v_items_with_status).
  const items = rows.map((it) => {
    const current = it.currentStock.toNumber();
    const min     = it.minStock.toNumber();
    const reorder = it.reorderLevel.toNumber();
    const tone =
      current <= 0           ? "out"
      : current <= min       ? "critical"
      : current <= reorder   ? "low"
      :                        "in_stock";

    return {
      id: it.id,
      rfq: it.rfq,
      name: it.name,
      category: it.category,
      unit: it.unit,
      supplier: it.defaultSupplier,
      currentStock: current,
      reorderLevel: reorder,
      minStock: min,
      maxStock: it.maxStock.toNumber(),
      status: tone,
      isMaintenancePart: it.isMaintenancePart,
      description: it.description,
    };
  });

  const filtered = status ? items.filter((i) => i.status === status) : items;

  return jsonOk({ data: filtered, total, limit, offset });
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  categoryCode: z.string().min(1),
  unitCode: z.string().min(1),
  defaultSupplierName: z.string().nullable().optional(),
  manufacturerName: z.string().nullable().optional(),
  isMaintenancePart: z.boolean().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  minStock: z.number().nonnegative().optional(),
  maxStock: z.number().nonnegative().optional(),
  description: z.string().max(2000).nullable().optional(),
});

// Auto-generated serials use the JC-NNNNN format (Joshob Construction).
// We seed from `count()` rather than MAX(rfq) because legacy/imported items
// may have non-conforming codes — and counting includes soft-deleted rows
// so a deleted item's serial is never reused.
const SERIAL_PREFIX = "JC-";
const SERIAL_PAD    = 5;

function formatSerial(n: number): string {
  return `${SERIAL_PREFIX}${String(n).padStart(SERIAL_PAD, "0")}`;
}


// Create a new item
// Endpoint: POST /api/items
// Description: Create a new item. The item's serial (`rfq` column in the DB,
// surfaced as "Serial" in the UI) is generated server-side — clients no
// longer supply it.
export const POST = withApi(async (req) => {
  await requireUser();
  const body = await parseJson(req, createSchema);

  const [category, unit] = await Promise.all([
    prisma.category.findUnique({ where: { code: body.categoryCode } }),
    prisma.unit.findUnique({ where: { code: body.unitCode } }),
  ]);
  if (!category) return jsonOk({ error: "Unknown category" }, { status: 400 });
  if (!unit)     return jsonOk({ error: "Unknown unit" },     { status: 400 });

  const supplier = body.defaultSupplierName
    ? await prisma.supplier.findUnique({ where: { name: body.defaultSupplierName } })
    : null;
  const manufacturer = body.manufacturerName
    ? await prisma.manufacturer.findUnique({ where: { name: body.manufacturerName } })
    : null;

  // Retry on unique-violation to absorb the (rare) race where two creates
  // pick the same next-serial concurrently. Walking forward from `count` +1
  // self-heals up to MAX_TRIES collisions before giving up.
  const baseCount = await prisma.item.count();
  const MAX_TRIES = 8;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    try {
      const item = await prisma.item.create({
        data: {
          rfq: formatSerial(baseCount + 1 + attempt),
          name: body.name,
          categoryId: category.id,
          unitId: unit.id,
          defaultSupplierId: supplier?.id ?? null,
          manufacturerId: manufacturer?.id ?? null,
          isMaintenancePart: body.isMaintenancePart ?? false,
          reorderLevel: body.reorderLevel ?? 0,
          minStock: body.minStock ?? 0,
          maxStock: body.maxStock ?? 0,
          description: body.description ?? null,
        },
      });
      return jsonOk(item, { status: 201 });
    } catch (err) {
      const isUniqueViolation =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!isUniqueViolation || attempt === MAX_TRIES - 1) throw err;
    }
  }

  return jsonOk({ error: "Could not generate a unique serial" }, { status: 500 });
});
