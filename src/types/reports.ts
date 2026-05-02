import type { ElementType } from "react";
import type { StatusTone } from "@/components/ui_components/portal/primitives";
import type { ItemStatus } from "./items";

// ─── Legacy / sample-data shape ─────────────────────────────────────

export type ReportCard = {
  title: string;
  description: string;
  icon: ElementType;
  accent: string;
  iconClass: string;
  active?: boolean;
};

export type ReportPreviewRow = {
  rfq: string;
  name: string;
  category: string;
  current: string;
  unit: string;
  status: StatusTone;
  statusLabel: string;
};

// ─── API shape ──────────────────────────────────────────────────────

export const REPORT_SLUGS = [
  "stock-on-hand",
  "stock-movement-history",
  "project-consumption",
  "slow-moving",
  "maintenance-usage",
] as const;

export type ReportSlug = (typeof REPORT_SLUGS)[number];

export type StockOnHandRow = {
  rfq:      string;
  name:     string;
  category: string;
  current:  number;
  unit:     string;
  status:   ItemStatus;
};

export type StockMovementHistoryRow = {
  date:         string;
  direction:    "in" | "out";
  refNo:        string;
  item:         string;
  qty:          number;
  unit:         string;
  counterparty: string | null;
};

export type ProjectConsumptionRow = {
  wbs:          string;
  name:         string;
  location:     string;
  itemsIssued:  number;
  qtyConsumed:  number;
  lastActivity: string | null;
};

export type SlowMovingRow = {
  rfq:        string;
  name:       string;
  category:   string;
  current:    number;
  lastIssued: string | null;
  daysIdle:   number;
};

export type MaintenanceUsageRow = {
  refNo:      string;
  date:       string;
  direction:  "in" | "out";
  item:       string;
  qty:        number;
  unit:       string;
  site:       string | null;
  technician: string | null;
};

export type ReportEnvelope<R> = { title: string; rows: R[] };

export type StockOnHandFilters          = { category?: string };
export type StockMovementHistoryFilters = { from?: string; to?: string; kind?: "operations" | "maintenance" };
export type SlowMovingFilters           = { days?: number };
export type MaintenanceUsageFilters     = { site?: string; direction?: "in" | "out" };

export type ReportRow<S extends ReportSlug> =
  S extends "stock-on-hand"            ? StockOnHandRow          :
  S extends "stock-movement-history"   ? StockMovementHistoryRow :
  S extends "project-consumption"      ? ProjectConsumptionRow   :
  S extends "slow-moving"              ? SlowMovingRow           :
  S extends "maintenance-usage"        ? MaintenanceUsageRow     :
  never;

export type ReportFilters<S extends ReportSlug> =
  S extends "stock-on-hand"            ? StockOnHandFilters          :
  S extends "stock-movement-history"   ? StockMovementHistoryFilters :
  S extends "project-consumption"      ? Record<string, never>       :
  S extends "slow-moving"              ? SlowMovingFilters           :
  S extends "maintenance-usage"        ? MaintenanceUsageFilters     :
  never;
