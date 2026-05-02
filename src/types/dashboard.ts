import type { ElementType } from "react";

export type Kpi = {
  label: string;
  value: string;
  sub: string;
  accent: string;
  icon: ElementType;
  iconClass: string;
};

export type DashboardProject = {
  wbs: string;
  name: string;
  totalIssued: number;
  totalQty: string;
  topItem: string;
  lastIssue: string;
  status: "Active" | "On Hold" | "Completed";
};

export type TopMaterial = {
  name: string;
  value: number;
  max: number;
};

export type DayBar = {
  day: string;
  in: number;
  out: number;
};

// ─── API shape ──────────────────────────────────────────────────────

export type DashboardKpis = {
  totalInStock:      number;
  itemsBelowReorder: number;
  todayStockIn:      number;
  todayStockOut:     number;
};

export type WeekDayBar = {
  day: string;     // "Mon", "Tue", ...
  in:  number;
  out: number;
};

export type DashboardResponse = {
  kpis:     DashboardKpis;
  weekDays: WeekDayBar[];   // always length 7, oldest → today
};
