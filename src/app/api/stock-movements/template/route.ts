import { prisma } from "@/lib/prisma";
import { jsonError, requireUser, withApi } from "@/lib/api";
import {
  buildTemplateWorkbook,
  xlsxResponse,
  type ReferenceTab,
  type TemplateColumn,
} from "@/lib/excel";

// GET /api/stock-movements/template?direction=in|out
// Description: Download the .xlsx template for bulk stock-in (GRN) or
// stock-out (MRN) imports. The shape differs between the two — Stock In
// needs a supplier, Stock Out needs a project — so the columns and notes
// adapt accordingly.
export const GET = withApi(async (req) => {
  await requireUser();
  const url = new URL(req.url);
  const direction = url.searchParams.get("direction");
  if (direction !== "in" && direction !== "out") {
    return jsonError("direction must be 'in' or 'out'", 400);
  }

  const [items, suppliers, projects, storage, users] = await Promise.all([
    prisma.item.findMany({
      where: { deletedAt: null },
      select: { rfq: true, name: true },
      orderBy: { name: "asc" },
      take: 500, // sheet doesn't need to be exhaustive — just useful
    }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { wbs: true, name: true },
      orderBy: { wbs: "asc" },
    }),
    prisma.storageLocation.findMany({ orderBy: { label: "asc" } }),
    prisma.user.findMany({
      where: { status: "active", deletedAt: null },
      select: { email: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  // Stock-in needs Items + Suppliers + StorageLocations.
  // Stock-out needs Items + Projects + Users (for authorisedByEmail).
  const refs: ReferenceTab[] =
    direction === "in"
      ? [
          { name: "Items",            headers: ["serial", "name"], rows: items.map((i) => [i.rfq, i.name]) },
          { name: "Suppliers",        headers: ["name"],           rows: suppliers.map((s) => [s.name]) },
          { name: "StorageLocations", headers: ["code", "label"],  rows: storage.map((s) => [s.code, s.label]) },
        ]
      : [
          { name: "Items",    headers: ["serial", "name"],  rows: items.map((i) => [i.rfq, i.name]) },
          { name: "Projects", headers: ["wbs", "name"],     rows: projects.map((p) => [p.wbs, p.name]) },
          { name: "Users",    headers: ["email", "fullName"], rows: users.map((u) => [u.email, u.fullName]) },
        ];

  const sampleItem = items[0]?.rfq ?? "JC-00001";
  const today      = new Date().toISOString().slice(0, 10);

  // Each row in the data sheet = one movement. The reference number
  // (GRN-YYYY-NNNN / MRN-YYYY-NNNN) and the line's unit are auto-resolved
  // server-side, so users only fill what they uniquely know.
  const inCols: TemplateColumn[] = [
    { key: "movementDate",        width: 14, sample: today },
    { key: "itemRfq",             width: 14, sample: sampleItem },
    { key: "qty",                 width: 10, sample: 25 },
    { key: "supplierName",        width: 28, sample: suppliers[0]?.name ?? "" },
    { key: "storageLocationCode", width: 20, sample: storage[0]?.code ?? "" },
    { key: "condition",           width: 12, sample: "good" },
    { key: "notes",               width: 30, sample: "" },
  ];

  const outCols: TemplateColumn[] = [
    { key: "movementDate",      width: 14, sample: today },
    { key: "itemRfq",           width: 14, sample: sampleItem },
    { key: "qty",               width: 10, sample: 25 },
    { key: "projectWbs",        width: 14, sample: projects[0]?.wbs ?? "" },
    { key: "activity",          width: 24, sample: "" },
    { key: "authorisedByEmail", width: 28, sample: users[0]?.email ?? "" },
    { key: "notes",             width: 30, sample: "" },
  ];

  const inNotes = [
    "How to use this template (Stock In / GRN):",
    "1. Each row becomes one Goods Received Note. The GRN number (GRN-YYYY-NNNN) is generated automatically — no column needed.",
    "2. Required columns: movementDate, itemRfq, qty, supplierName.",
    "3. movementDate format: YYYY-MM-DD.",
    "4. itemRfq is the item's serial (e.g. JC-00042). It must already exist in the Item Registry — import items first if needed.",
    "5. The unit is taken from the item itself, so there's no unit column to fill.",
    "6. condition is one of: good, damaged, partial, rejected (default 'good').",
    "7. Lookup tabs (Items, Suppliers, StorageLocations) list valid values.",
    "8. Save as .xlsx and upload it on the Stock In page.",
  ];

  const outNotes = [
    "How to use this template (Stock Out / MRN):",
    "1. Each row becomes one Material Requisition Note. The MRN number (MRN-YYYY-NNNN) is generated automatically — no column needed.",
    "2. Required columns: movementDate, itemRfq, qty, projectWbs.",
    "3. movementDate format: YYYY-MM-DD.",
    "4. itemRfq is the item's serial (e.g. JC-00042). It must already exist in the Item Registry.",
    "5. The unit is taken from the item itself, so there's no unit column to fill.",
    "6. authorisedByEmail must match a user in the Users tab when supplied.",
    "7. Lookup tabs (Items, Projects, Users) list valid values.",
    "8. Save as .xlsx and upload it on the Stock Out page.",
  ];

  const wb = buildTemplateWorkbook({
    sheetName: direction === "in" ? "StockIn" : "StockOut",
    notes: direction === "in" ? inNotes : outNotes,
    columns: direction === "in" ? inCols : outCols,
    references: refs,
  });

  return xlsxResponse(
    wb,
    direction === "in" ? "stock-in-template.xlsx" : "stock-out-template.xlsx",
  );
});
