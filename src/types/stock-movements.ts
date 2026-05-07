// API-shaped stock-movement types (the unified ledger). The legacy
// per-flow types in `@/types/stock-in`, `stock-out`, and `maintenance`
// are the demo/sample-data shapes; they coexist with these until the
// UI pages are migrated.

export type MovementDirection = "in" | "out";
export type MovementKind      = "operations" | "maintenance";
export type MovementCondition = "good" | "damaged" | "partial" | "rejected";

export type MovementLine = {
  id:        string;
  itemId:    string;
  itemName:  string;
  itemRfq:   string;
  qty:       number;
  unit:      string;
  unitCode:  string;
  condition: MovementCondition;
  note:      string | null;
};

export type MovementRow = {
  id:           string;
  refNo:        string;
  direction:    MovementDirection;
  kind:         MovementKind;
  movementDate: string;
  rfq:          string | null;
  notes:        string | null;
  supplier:     { id: string; name: string } | null;
  project:      { id: string; wbs: string; name: string } | null;
  department:   { id: string; code: string; label: string } | null;
  activity:     string | null;
  site:         { id: string; code: string; label: string } | null;
  technician:   { id: string; fullName: string } | null;
  application:  string | null;
  manufacturer: { id: string; name: string } | null;
  storageLocation: { id: string; code: string; label: string } | null;
  receivedBy:   { id: string; fullName: string } | null;
  issuedTo:     { id: string; fullName: string } | null;
  authorisedBy: { id: string; fullName: string } | null;
  lines:        MovementLine[];
};

export type ListMovementsQuery = {
  kind?:      MovementKind;
  direction?: MovementDirection;
  projectId?: string;
  q?:         string;
  limit?:     number;
  offset?:    number;
};

export type MovementsListResponse = {
  data:   MovementRow[];
  total:  number;
  limit:  number;
  offset: number;
};

/**
 * Required FKs depend on `kind` + `direction` (mirrors the §7 CHECK):
 *
 *   operations + in   → supplierName
 *   operations + out  → projectWbs
 *   maintenance + *   → siteCode
 */
export type CreateMovementPayload = {
  /** Optional — server auto-generates `GRN-YYYY-NNNN` / `MRN-YYYY-NNNN` when omitted. */
  refNo?:       string;
  direction:    MovementDirection;
  kind:         MovementKind;
  movementDate: string;                  // ISO date (e.g. "2026-05-02")
  rfq?:         string | null;
  notes?:       string | null;

  // Operations stock-in
  supplierName?:        string | null;
  receivedByEmail?:     string | null;

  // Operations stock-out
  projectWbs?:          string | null;
  departmentCode?:      string | null;
  activity?:            string | null;
  issuedToEmail?:       string | null;
  authorisedByEmail?:   string | null;

  // Maintenance
  siteCode?:            string | null;
  technicianEmail?:     string | null;
  application?:         string | null;
  manufacturerName?:    string | null;
  storageLocationCode?: string | null;

  lines: Array<{
    itemRfq:    string;
    qty:        number;
    unitCode:   string;
    condition?: MovementCondition;
    note?:      string | null;
  }>;
};
