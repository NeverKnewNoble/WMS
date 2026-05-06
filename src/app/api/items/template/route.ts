import { prisma } from "@/lib/prisma";
import { requireUser, withApi } from "@/lib/api";
import {
  buildTemplateWorkbook,
  xlsxResponse,
  type ReferenceTab,
} from "@/lib/excel";

// GET /api/items/template
// Description: Download the .xlsx template used to bulk-import items.
// The "READ ME" sheet documents required columns; reference sheets list
// the codes that the import endpoint will accept.
export const GET = withApi(async () => {
  await requireUser();

  const [categories, units, suppliers, manufacturers] = await Promise.all([
    prisma.category.findMany({ orderBy: { label: "asc" } }),
    prisma.unit.findMany({ orderBy: { label: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.manufacturer.findMany({ orderBy: { name: "asc" } }),
  ]);

  const refs: ReferenceTab[] = [
    {
      name: "Categories",
      headers: ["code", "label"],
      rows: categories.map((c) => [c.code, c.label]),
    },
    {
      name: "Units",
      headers: ["code", "label", "symbol"],
      rows: units.map((u) => [u.code, u.label, u.symbol ?? ""]),
    },
    {
      name: "Suppliers",
      headers: ["name"],
      rows: suppliers.map((s) => [s.name]),
    },
    {
      name: "Manufacturers",
      headers: ["name"],
      rows: manufacturers.map((m) => [m.name]),
    },
  ];

  const wb = buildTemplateWorkbook({
    sheetName: "Items",
    notes: [
      "How to use this template:",
      "1. Fill in one row per item on the 'Items' sheet. The first row is a sample — replace or delete it.",
      "2. Required columns: rfq, name, categoryCode, unitCode.",
      "3. categoryCode / unitCode must match a value from the 'Categories' / 'Units' tabs.",
      "4. supplierName / manufacturerName are optional. If used, they must match the reference tabs exactly.",
      "5. reorderLevel, minStock, maxStock are numbers (default 0).",
      "6. isMaintenancePart accepts true/false (default false).",
      "7. Save the file as .xlsx and upload it on the Item Registry page.",
    ],
    columns: [
      { key: "rfq",                width: 14, sample: "RFQ-006" },
      { key: "name",               width: 32, sample: "Cement 50kg" },
      { key: "categoryCode",       width: 18, sample: categories[0]?.code ?? "structural" },
      { key: "unitCode",           width: 14, sample: units[0]?.code ?? "bag" },
      { key: "supplierName",       width: 28, sample: suppliers[0]?.name ?? "" },
      { key: "manufacturerName",   width: 28, sample: manufacturers[0]?.name ?? "" },
      { key: "isMaintenancePart",  width: 18, sample: "false" },
      { key: "reorderLevel",       width: 14, sample: 50 },
      { key: "minStock",           width: 12, sample: 20 },
      { key: "maxStock",           width: 12, sample: 500 },
      { key: "description",        width: 40, sample: "" },
    ],
    references: refs,
  });

  return xlsxResponse(wb, "items-template.xlsx");
});
