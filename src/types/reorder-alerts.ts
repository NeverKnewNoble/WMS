import type { ElementType } from "react";

export type Severity = "all" | "critical" | "low" | "watch";

export type AlertSummary = {
  key: Severity;
  label: string;
  sub: string;
  count: number;
  icon: ElementType;
  ring: string;
  iconClass: string;
};

export type Alert = {
  name: string;
  category: string;
  current: number;
  reorder: number;
  shortfall: number;
  suggested: number;
  supplier: string;
  severity: "critical" | "low" | "watch";
};

export type SeverityStyle = {
  ring: string;
  icon: string;
  iconBg: string;
  Icon: ElementType;
};

// ─── API shape ──────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "low" | "watch";

export type ReorderAlert = {
  itemId:    string;
  name:      string;
  category:  string;
  current:   number;
  reorder:   number;
  shortfall: number;
  suggested: number;
  supplier:  string | null;
  severity:  AlertSeverity | null;
};

export type ReorderAlertsResponse = {
  alerts:  ReorderAlert[];
  summary: Array<{ severity: AlertSeverity; count: number }>;
};
