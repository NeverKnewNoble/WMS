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

  const [
    items,
    units,
    suppliers,
    projects,
    departments,
    storage,
    users,
  ] = await Promise.all([
    prisma.item.findMany({
      where: { deletedAt: null },
      select: { rfq: true, name: true },
      orderBy: { name: "asc" },
      take: 500, // sheet doesn't need to be exhaustive — just useful
    }),
    prisma.unit.findMany({ orderBy: { label: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { wbs: true, name: true },
      orderBy: { wbs: "asc" },
    }),
    prisma.department.findMany({ orderBy: { label: "asc" } }),
    prisma.storageLocation.findMany({ orderBy: { label: "asc" } }),
    prisma.user.findMany({
      where: { status: "active", deletedAt: null },
      select: { email: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const refs: ReferenceTab[] = [
    {
      name: "Items",
      headers: ["rfq", "name"],
      rows: items.map((i) => [i.rfq, i.name]),
    },
    {
      name: "Units",
      headers: ["code", "label"],
      rows: units.map((u) => [u.code, u.label]),
    },
    {
      name: direction === "in" ? "Suppliers" : "Projects",
      headers: direction === "in" ? ["name"] : ["wbs", "name"],
      rows:
        direction === "in"
          ? suppliers.map((s) => [s.name])
          : projects.map((p) => [p.wbs, p.name]),
    },
    {
      name: "Departments",
      headers: ["code", "label"],
      rows: departments.map((d) => [d.code, d.label]),
    },
    {
      name: direction === "in" ? "StorageLocations" : "Users",
      headers: direction === "in" ? ["code", "label"] : ["email", "fullName"],
      rows:
        direction === "in"
          ? storage.map((s) => [s.code, s.label])
          : users.map((u) => [u.email, u.fullName]),
    },
  ];

  const sampleItem = items[0]?.rfq ?? "RFQ-001";
  const sampleUnit = units[0]?.code ?? "bag";
  const today      = new Date().toISOString().slice(0, 10);

  // Column order mirrors the visible columns on the Stock In / Stock Out
  // pages so users see the same shape they're used to from the table.

  // Stock In page columns: GRN · Date · Item · Qty · Unit · Supplier · RFQ ·
  //                         Dept · Project (WBS) · Received by · Condition
  const inCols: TemplateColumn[] = [
    { key: "refNo",               width: 16, sample: "GRN-2026-001" },
    { key: "movementDate",        width: 14, sample: today },
    { key: "itemRfq",             width: 14, sample: sampleItem },
    { key: "qty",                 width: 10, sample: 25 },
    { key: "unitCode",            width: 12, sample: sampleUnit },
    { key: "supplierName",        width: 28, sample: suppliers[0]?.name ?? "" },
    { key: "rfq",                 width: 14, sample: "" },
    { key: "departmentCode",      width: 16, sample: departments[0]?.code ?? "" },
    { key: "storageLocationCode", width: 20, sample: storage[0]?.code ?? "" },
    { key: "receivedByEmail",     width: 28, sample: users[0]?.email ?? "" },
    { key: "condition",           width: 12, sample: "good" },
    { key: "notes",               width: 30, sample: "" },
  ];

  // Stock Out page columns: MRN · Date · Item · Qty · Unit · Project · WBS ·
  //                          RFQ · Dept · Activity · Issued to · Authorised by
  const outCols: TemplateColumn[] = [
    { key: "refNo",             width: 16, sample: "MRN-2026-001" },
    { key: "movementDate",      width: 14, sample: today },
    { key: "itemRfq",           width: 14, sample: sampleItem },
    { key: "qty",               width: 10, sample: 25 },
    { key: "unitCode",          width: 12, sample: sampleUnit },
    { key: "projectWbs",        width: 14, sample: projects[0]?.wbs ?? "" },
    { key: "rfq",               width: 14, sample: "" },
    { key: "departmentCode",    width: 16, sample: departments[0]?.code ?? "" },
    { key: "activity",          width: 24, sample: "" },
    { key: "issuedToEmail",     width: 28, sample: users[0]?.email ?? "" },
    { key: "authorisedByEmail", width: 28, sample: users[0]?.email ?? "" },
    { key: "notes",             width: 30, sample: "" },
  ];

  const inNotes = [
    "How to use this template (Stock In / GRN):",
    "1. Each row is one received line. Multiple lines for the same GRN should share the same refNo.",
    "2. Required: refNo, movementDate, itemRfq, qty, unitCode, supplierName.",
    "3. movementDate format: YYYY-MM-DD.",
    "4. condition is one of: good, damaged, partial, rejected (default 'good').",
    "5. itemRfq must already exist in Item Registry — import items first if needed.",
    "6. Lookup tabs (Items, Units, Suppliers, Departments, StorageLocations) list valid values.",
    "7. Save as .xlsx and upload it on the Stock In page.",
  ];

  const outNotes = [
    "How to use this template (Stock Out / MRN):",
    "1. Each row is one issued line. Multiple lines for the same MRN should share the same refNo.",
    "2. Required: refNo, movementDate, itemRfq, qty, unitCode, projectWbs.",
    "3. movementDate format: YYYY-MM-DD.",
    "4. issuedToEmail / authorisedByEmail must match users in the Users tab.",
    "5. itemRfq must already exist in Item Registry.",
    "6. Lookup tabs (Items, Units, Projects, Departments, Users) list valid values.",
    "7. Save as .xlsx and upload it on the Stock Out page.",
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
