import {
  Boxes,
  AlertTriangle,
  AlertOctagon,
  Bell,
  PackagePlus,
  PackageMinus,
  List,
  Layers,
  TrendingUp,
  Building2,
  Activity,
  Wrench,
  User,
  Shield,
  Database,
} from "lucide-react";

import type {
  Kpi,
  DashboardProject,
  TopMaterial,
  DayBar,
} from "@/types/dashboard";
import type { Item } from "@/types/inventory";
import type { StockInReceipt } from "@/types/stock-in";
import type { MRN } from "@/types/stock-out";
import type { Project } from "@/types/projects";
import type { MaintenanceReceipt } from "@/types/maintenance";
import type {
  AlertSummary,
  Alert,
  SeverityStyle,
} from "@/types/reorder-alerts";
import type { ReportCard, ReportPreviewRow } from "@/types/reports";
import type { SettingsSection, NotificationToggle } from "@/types/settings";

// ── Dashboard ──────────────────────────────────────────────────────────

export const dashboardKpis: Kpi[] = [
  {
    label: "Total items in stock",
    value: "2,456",
    sub: "across 4 storage locations",
    accent: "from-sky-400/30 to-sky-400/0",
    icon: Boxes,
    iconClass: "text-sky-300",
  },
  {
    label: "Items below reorder",
    value: "23",
    sub: "needs review today",
    accent: "from-rose-400/30 to-rose-400/0",
    icon: AlertTriangle,
    iconClass: "text-rose-300",
  },
  {
    label: "Today's stock in",
    value: "145",
    sub: "+18% vs yesterday",
    accent: "from-emerald-400/30 to-emerald-400/0",
    icon: PackagePlus,
    iconClass: "text-emerald-300",
  },
  {
    label: "Today's stock out",
    value: "98",
    sub: "across 6 projects",
    accent: "from-amber-400/30 to-amber-400/0",
    icon: PackageMinus,
    iconClass: "text-amber-300",
  },
];

export const dashboardProjects: DashboardProject[] = [
  { wbs: "A", name: "Asylum Down", totalIssued: 45, totalQty: "12,500", topItem: "Cement 50kg", lastIssue: "2026-04-20", status: "Active" },
  { wbs: "K", name: "Asokwa", totalIssued: 38, totalQty: "9,800", topItem: "Steel Rods", lastIssue: "2026-04-19", status: "Active" },
  { wbs: "1", name: "Bantama Phase 3", totalIssued: 52, totalQty: "15,200", topItem: "Blocks", lastIssue: "2026-04-20", status: "Active" },
  { wbs: "2", name: "Manso", totalIssued: 28, totalQty: "6,700", topItem: "Cement 50kg", lastIssue: "2026-04-18", status: "On Hold" },
  { wbs: "3", name: "Kumawu Lot 1", totalIssued: 41, totalQty: "11,300", topItem: "Sand", lastIssue: "2026-04-20", status: "Active" },
  { wbs: "4", name: "Kumawu Lot 2-6", totalIssued: 35, totalQty: "8,900", topItem: "Gravel", lastIssue: "2026-04-17", status: "Active" },
  { wbs: "5", name: "Juapong", totalIssued: 22, totalQty: "5,100", topItem: "Paint", lastIssue: "2026-04-15", status: "Completed" },
];

export const topMaterials: TopMaterial[] = [
  { name: "Cement 50kg", value: 1280, max: 1280 },
  { name: "Steel Rods 12mm", value: 920, max: 1280 },
  { name: "Blocks", value: 760, max: 1280 },
  { name: "Sand", value: 540, max: 1280 },
  { name: "Gravel", value: 430, max: 1280 },
];

export const weekDays: DayBar[] = [
  { day: "Mon", in: 110, out: 80 },
  { day: "Tue", in: 145, out: 95 },
  { day: "Wed", in: 90, out: 130 },
  { day: "Thu", in: 175, out: 100 },
  { day: "Fri", in: 120, out: 145 },
  { day: "Sat", in: 60, out: 40 },
  { day: "Sun", in: 145, out: 98 },
];

export const weekDayMax = 180;

export const dashboardStatusToTone = {
  Active: "active",
  "On Hold": "on-hold",
  Completed: "completed",
} as const;

// ── Inventory ──────────────────────────────────────────────────────────

export const inventoryItems: Item[] = [
  { rfq: "RFQ-001", name: "Cement 50kg", category: "Structural", unit: "Bags", current: 450, reorder: 200, min: 150, max: 1000, status: "in-stock", statusLabel: "In stock" },
  { rfq: "RFQ-002", name: "Steel Rods 12mm", category: "Structural", unit: "Pieces", current: 180, reorder: 100, min: 80, max: 500, status: "in-stock", statusLabel: "In stock" },
  { rfq: "RFQ-003", name: "Paint White 20L", category: "Finishing", unit: "Litres", current: 45, reorder: 50, min: 30, max: 200, status: "low", statusLabel: "Low" },
  { rfq: "RFQ-004", name: "Concrete Blocks", category: "Structural", unit: "Pieces", current: 2500, reorder: 1000, min: 800, max: 5000, status: "in-stock", statusLabel: "In stock" },
  { rfq: "RFQ-005", name: "Electrical Cable 2.5mm", category: "Electrical", unit: "Metres", current: 25, reorder: 100, min: 50, max: 500, status: "critical", statusLabel: "Critical" },
];

// ── Stock In ───────────────────────────────────────────────────────────

export const stockInReceipts: StockInReceipt[] = [
  { grn: "GRN-26-001", date: "2026-04-15", item: "Cement 50kg", category: "Structural", qty: "200", unit: "Bags", supplier: "GHACEM Ltd", rfq: "RFQ-2026-012", dept: "Engineering", wbs: "K", receivedBy: "John Mensah" },
  { grn: "GRN-26-002", date: "2026-04-16", item: "Steel Rods 12mm", category: "Structural", qty: "100", unit: "Pieces", supplier: "Steel Corp", rfq: "RFQ-2026-013", dept: "Production", wbs: "A", receivedBy: "Mary Osei" },
  { grn: "GRN-26-003", date: "2026-04-17", item: "Paint White 20L", category: "Finishing", qty: "50", unit: "Litres", supplier: "ColorPro Ghana", rfq: "RFQ-2026-014", dept: "Production", wbs: "1", receivedBy: "Samuel Adu" },
];

// ── Stock Out (MRN) ────────────────────────────────────────────────────

export const stockOutMrns: MRN[] = [
  { mrn: "MRN-2026-001", date: "2026-04-18", item: "Cement 50kg", qty: "100", unit: "Bags", project: "Block A Construction", wbs: "K", rfq: "RFQ-2026-015", dept: "Civil", activity: "Foundation works", issuedTo: "Kwame Asante", authorisedBy: "Eng. Boateng" },
  { mrn: "MRN-2026-002", date: "2026-04-19", item: "Steel Rods 12mm", qty: "50", unit: "Pieces", project: "Block B Roofing", wbs: "A", rfq: "RFQ-2026-016", dept: "Civil", activity: "Roof structure", issuedTo: "Yaw Mensah", authorisedBy: "Eng. Boateng" },
];

// ── Projects ───────────────────────────────────────────────────────────

export const projectsList: Project[] = [
  { wbs: "A", name: "Asylum Down", location: "Accra", itemsIssued: 45, qtyConsumed: "12,500", lastActivity: "2026-04-20" },
  { wbs: "K", name: "Asokwa", location: "Kumasi", itemsIssued: 38, qtyConsumed: "9,800", lastActivity: "2026-04-19" },
  { wbs: "1", name: "Bantama Phase 3", location: "Kumasi", itemsIssued: 52, qtyConsumed: "15,200", lastActivity: "2026-04-20" },
  { wbs: "2", name: "Manso", location: "Ashanti", itemsIssued: 28, qtyConsumed: "6,700", lastActivity: "2026-04-18" },
  { wbs: "3", name: "Kumawu Lot 1", location: "Kumawu", itemsIssued: 41, qtyConsumed: "11,300", lastActivity: "2026-04-20" },
  { wbs: "4", name: "Kumawu Lot 2-6", location: "Kumawu", itemsIssued: 35, qtyConsumed: "8,900", lastActivity: "2026-04-17" },
  { wbs: "5", name: "Juapong", location: "Volta", itemsIssued: 22, qtyConsumed: "5,100", lastActivity: "2026-04-15" },
  { wbs: "6", name: "Obuasi", location: "Obuasi", itemsIssued: 48, qtyConsumed: "13,800", lastActivity: "2026-04-20" },
  { wbs: "7", name: "Bekwai", location: "Bekwai", itemsIssued: 31, qtyConsumed: "7,600", lastActivity: "2026-04-19" },
  { wbs: "8", name: "Datano", location: "Ashanti", itemsIssued: 26, qtyConsumed: "6,200", lastActivity: "2026-04-16" },
  { wbs: "9", name: "Mankranso", location: "Mankranso", itemsIssued: 39, qtyConsumed: "10,500", lastActivity: "2026-04-20" },
  { wbs: "10", name: "Juaben", location: "Juaben", itemsIssued: 44, qtyConsumed: "12,100", lastActivity: "2026-04-19" },
  { wbs: "11", name: "Dormaa", location: "Dormaa", itemsIssued: 33, qtyConsumed: "8,400", lastActivity: "2026-04-18" },
];

// ── Maintenance ────────────────────────────────────────────────────────

export const maintenanceStockIn: MaintenanceReceipt[] = [
  { no: "MAINT-IN-001", date: "2026-04-15", item: "Generator Belt", category: "Mechanical Parts", manufacturer: "Cummins", vendor: "PowerParts Ltd", qty: "2", unit: "Pieces", storage: "Main Warehouse", application: "Generator Repair", site: "Site A", technician: "Francis Owusu", rfq: "RFQ-001" },
  { no: "MAINT-IN-002", date: "2026-04-16", item: "HVAC Filters", category: "HVAC Parts", manufacturer: "Carrier", vendor: "CoolAir Ghana", qty: "10", unit: "Pieces", storage: "Main Warehouse", application: "AC Servicing", site: "Main Office", technician: "Daniel Ansah", rfq: "RFQ-002" },
];

export const maintenanceStockOut: MaintenanceReceipt[] = [
  { no: "MAINT-OUT-001", date: "2026-04-19", item: "Generator Belt", category: "Mechanical Parts", manufacturer: "Cummins", vendor: "PowerParts Ltd", qty: "1", unit: "Pieces", storage: "Main Warehouse", application: "Generator Repair", site: "Site A", technician: "Francis Owusu", rfq: "RFQ-001" },
];

// ── Reorder Alerts ─────────────────────────────────────────────────────

export const reorderSummary: AlertSummary[] = [
  { key: "all", label: "All items", sub: "tracked alerts", count: 4, icon: List, ring: "ring-white/10 bg-white/3", iconClass: "text-white/85" },
  { key: "critical", label: "Critical", sub: "out of stock", count: 1, icon: AlertOctagon, ring: "ring-rose-500/30 bg-rose-500/5", iconClass: "text-rose-300" },
  { key: "low", label: "Low", sub: "at reorder level", count: 2, icon: AlertTriangle, ring: "ring-amber-400/30 bg-amber-400/5", iconClass: "text-amber-300" },
  { key: "watch", label: "Watch", sub: "approaching reorder", count: 1, icon: Bell, ring: "ring-cyan-400/30 bg-cyan-400/5", iconClass: "text-cyan-300" },
];

export const reorderAlerts: Alert[] = [
  { name: "Electrical Cable 2.5mm", category: "Electrical", current: 25, reorder: 100, shortfall: 75, suggested: 200, supplier: "Volta Supplies", severity: "critical" },
  { name: "Paint White 20L", category: "Finishing", current: 45, reorder: 50, shortfall: 5, suggested: 100, supplier: "ColorPro Ghana", severity: "low" },
  { name: "Concrete Mix", category: "Structural", current: 80, reorder: 100, shortfall: 20, suggested: 150, supplier: "BuildMix Ltd", severity: "low" },
  { name: "Safety Helmets", category: "Safety / PPE", current: 120, reorder: 150, shortfall: 30, suggested: 200, supplier: "SafetyPro", severity: "watch" },
];

export const severityStyle: Record<Alert["severity"], SeverityStyle> = {
  critical: { ring: "ring-rose-500/30 bg-rose-500/5", icon: "text-rose-300", iconBg: "bg-rose-500/15", Icon: AlertOctagon },
  low: { ring: "ring-amber-400/25 bg-amber-400/5", icon: "text-amber-300", iconBg: "bg-amber-400/15", Icon: AlertTriangle },
  watch: { ring: "ring-cyan-400/25 bg-cyan-400/5", icon: "text-cyan-300", iconBg: "bg-cyan-400/15", Icon: Bell },
};

// ── Reports ────────────────────────────────────────────────────────────

export const reportCards: ReportCard[] = [
  {
    title: "Stock on hand",
    description: "Current inventory levels for all items.",
    icon: Layers,
    accent: "from-sky-400/30 to-sky-400/0",
    iconClass: "text-sky-300",
    active: true,
  },
  {
    title: "Stock movement history",
    description: "All stock-in and stock-out transactions.",
    icon: TrendingUp,
    accent: "from-emerald-400/30 to-emerald-400/0",
    iconClass: "text-emerald-300",
  },
  {
    title: "Material consumption per project",
    description: "Materials used across active projects.",
    icon: Building2,
    accent: "from-violet-400/30 to-violet-400/0",
    iconClass: "text-violet-300",
  },
  {
    title: "Slow-moving stock",
    description: "Identify items with low turnover rates.",
    icon: Activity,
    accent: "from-amber-400/30 to-amber-400/0",
    iconClass: "text-amber-300",
  },
  {
    title: "Maintenance parts usage",
    description: "Track maintenance consumables and parts.",
    icon: Wrench,
    accent: "from-rose-400/30 to-rose-400/0",
    iconClass: "text-rose-300",
  },
];

export const reportPreview: ReportPreviewRow[] = [
  { rfq: "RFQ-001", name: "Cement 50kg", category: "Structural", current: "450", unit: "Bags", status: "in-stock", statusLabel: "In stock" },
  { rfq: "RFQ-002", name: "Steel Rods 12mm", category: "Structural", current: "180", unit: "Pieces", status: "in-stock", statusLabel: "In stock" },
  { rfq: "RFQ-003", name: "Paint White 20L", category: "Finishing", current: "45", unit: "Litres", status: "low", statusLabel: "Low" },
  { rfq: "RFQ-004", name: "Concrete Blocks", category: "Structural", current: "2,500", unit: "Pieces", status: "in-stock", statusLabel: "In stock" },
];

// ── Settings ───────────────────────────────────────────────────────────

export const settingsSections: SettingsSection[] = [
  {
    icon: User,
    title: "Profile",
    description: "Name, email, and account details",
    accent: "text-sky-300",
    glow: "from-sky-400/30 to-sky-400/0",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Alerts, emails, and low-stock warnings",
    accent: "text-amber-300",
    glow: "from-amber-400/30 to-amber-400/0",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Password, 2FA, and session management",
    accent: "text-emerald-300",
    glow: "from-emerald-400/30 to-emerald-400/0",
  },
  {
    icon: Database,
    title: "Data & integrations",
    description: "Exports, API keys, and third-party apps",
    accent: "text-violet-300",
    glow: "from-violet-400/30 to-violet-400/0",
  },
];

export const notificationToggles: NotificationToggle[] = [
  { label: "Low stock alerts", description: "Notify when an item hits its reorder threshold", on: true },
  { label: "New stock-in received", description: "Notify when inbound stock is confirmed", on: true },
  { label: "Stock-out dispatched", description: "Notify when an outbound dispatch is completed", on: false },
  { label: "Weekly summary email", description: "A weekly digest of all warehouse activity", on: true },
];
