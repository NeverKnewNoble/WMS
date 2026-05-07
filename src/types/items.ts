// API-shaped Item types. The legacy Item in `@/types/inventory` is the
// demo/sample-data shape and only gets used by `sampleData.tsx` and the
// inventory UI page until those are migrated.

import type {
  CategoryLookup,
  SupplierLookup,
  UnitLookup,
} from "./lookups";

export type ItemStatus = "in_stock" | "low" | "critical" | "out";

export type ApiItem = {
  id:                string;
  rfq:               string;
  name:              string;
  category:          CategoryLookup;
  unit:              UnitLookup;
  supplier:          SupplierLookup | null;
  currentStock:      number;
  reorderLevel:      number;
  minStock:          number;
  maxStock:          number;
  status:            ItemStatus;
  isMaintenancePart: boolean;
  description:       string | null;
};

export type ListItemsQuery = {
  q?:        string;
  category?: string;       // category code, e.g. "structural"
  status?:   ItemStatus;
  limit?:    number;
  offset?:   number;
};

export type ItemsListResponse = {
  data:   ApiItem[];
  total:  number;
  limit:  number;
  offset: number;
};

// Note: `rfq` (the item's serial) is auto-generated server-side and never
// supplied by the client — it's immutable once an item is created.
export type CreateItemPayload = {
  name:                 string;
  categoryCode:         string;
  unitCode:             string;
  defaultSupplierName?: string | null;
  manufacturerName?:    string | null;
  isMaintenancePart?:   boolean;
  reorderLevel?:        number;
  minStock?:            number;
  maxStock?:            number;
  description?:         string | null;
};

export type UpdateItemPayload = Partial<
  Omit<CreateItemPayload, "isMaintenancePart" | "manufacturerName">
>;
