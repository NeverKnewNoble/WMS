import { prisma } from "@/lib/prisma";
import { jsonOk, requireUser, withApi } from "@/lib/api";

export const GET = withApi(async () => {
  await requireUser();

  const [
    categories,
    units,
    suppliers,
    manufacturers,
    departments,
    regions,
    sites,
    storageLocations,
    roles,
  ] = await Promise.all([
    prisma.category.findMany({ orderBy: { label: "asc" } }),
    prisma.unit.findMany({ orderBy: { label: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.manufacturer.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { label: "asc" } }),
    prisma.region.findMany({ orderBy: { label: "asc" } }),
    prisma.site.findMany({ orderBy: { label: "asc" } }),
    prisma.storageLocation.findMany({ orderBy: { label: "asc" } }),
    prisma.role.findMany({ orderBy: { label: "asc" } }),
  ]);

  return jsonOk({
    categories,
    units,
    suppliers,
    manufacturers,
    departments,
    regions,
    sites,
    storageLocations,
    roles,
  });
});
