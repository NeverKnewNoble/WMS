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
