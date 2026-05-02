"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileSpreadsheet, FileText, Search, X } from "lucide-react";
import {
  StatusPill,
  MonoCell,
  fieldClass,
} from "../ui_components/portal/primitives";
import type { ReportCard } from "@/types/reports";
import {
  inventoryItems,
  maintenanceStockIn,
  maintenanceStockOut,
  projectsList,
  reportPreview,
  stockInReceipts,
  stockOutMrns,
} from "@/utils/sampleData";

type Column = { key: string; label: string; align?: "left" | "right" };
type Cell = React.ReactNode;
type Row = { id: string; cells: Cell[] };

type ReportShape = {
  columns: Column[];
  rows: Row[];
  filters: { label: string; options: string[] }[];
};

function shapeForReport(title: string): ReportShape {
  switch (title) {
    case "Stock movement history": {
      const movements = [
        ...stockInReceipts.map((r) => ({
          id: `in-${r.grn}`,
          date: r.date,
          type: "Stock in" as const,
          ref: r.grn,
          item: r.item,
          qty: r.qty,
          unit: r.unit,
          counterparty: r.supplier,
        })),
        ...stockOutMrns.map((m) => ({
          id: `out-${m.mrn}`,
          date: m.date,
          type: "Stock out" as const,
          ref: m.mrn,
          item: m.item,
          qty: m.qty,
          unit: m.unit,
          counterparty: m.project,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date));
      return {
        columns: [
          { key: "date", label: "Date" },
          { key: "type", label: "Type" },
          { key: "ref", label: "Reference" },
          { key: "item", label: "Item" },
          { key: "qty", label: "Qty", align: "right" },
          { key: "unit", label: "Unit" },
          { key: "counterparty", label: "Counterparty" },
        ],
        rows: movements.map((m) => ({
          id: m.id,
          cells: [
            <MonoCell key="d">{m.date}</MonoCell>,
            m.type === "Stock in" ? (
              <StatusPill key="t" tone="good">
                Stock in
              </StatusPill>
            ) : (
              <StatusPill key="t" tone="low">
                Stock out
              </StatusPill>
            ),
            <MonoCell key="r">{m.ref}</MonoCell>,
            <span key="i" className="font-medium text-white">
              {m.item}
            </span>,
            <MonoCell key="q">
              {m.type === "Stock in" ? "+" : "−"}
              {m.qty}
            </MonoCell>,
            <span key="u" className="text-white/65">
              {m.unit}
            </span>,
            <span key="c" className="text-white/65">
              {m.counterparty}
            </span>,
          ],
        })),
        filters: [
          {
            label: "Date range",
            options: ["Last 30 days", "Last 7 days", "Quarter to date"],
          },
          {
            label: "Type",
            options: ["All movements", "Stock in", "Stock out"],
          },
          {
            label: "Category",
            options: [
              "All Categories",
              "Structural",
              "Finishing",
              "Electrical",
            ],
          },
        ],
      };
    }
    case "Material consumption per project": {
      return {
        columns: [
          { key: "wbs", label: "WBS" },
          { key: "name", label: "Project" },
          { key: "location", label: "Location" },
          { key: "items", label: "Items issued", align: "right" },
          { key: "qty", label: "Qty consumed", align: "right" },
          { key: "last", label: "Last activity" },
        ],
        rows: projectsList.map((p) => ({
          id: p.wbs + p.name,
          cells: [
            <span
              key="w"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/5 font-mono text-[11px] font-semibold text-white"
            >
              {p.wbs}
            </span>,
            <span key="n" className="font-medium text-white">
              {p.name}
            </span>,
            <span key="l" className="text-white/65">
              {p.location}
            </span>,
            <MonoCell key="i">{p.itemsIssued}</MonoCell>,
            <MonoCell key="q">{p.qtyConsumed}</MonoCell>,
            <MonoCell key="d">{p.lastActivity}</MonoCell>,
          ],
        })),
        filters: [
          {
            label: "Date range",
            options: ["Last 30 days", "Last 7 days", "Quarter to date"],
          },
          {
            label: "Region",
            options: ["All Regions", "Ashanti", "Greater Accra", "Volta"],
          },
          {
            label: "Status",
            options: ["All", "Active", "On Hold", "Completed"],
          },
        ],
      };
    }
    case "Slow-moving stock": {
      const slow = inventoryItems
        .slice()
        .sort((a, b) => a.current - b.current)
        .map((it, i) => ({
          ...it,
          daysIdle: 32 + i * 9,
          lastOut: `2026-0${Math.max(1, 4 - i)}-1${i + 2}`,
        }));
      return {
        columns: [
          { key: "rfq", label: "RFQ" },
          { key: "item", label: "Item" },
          { key: "category", label: "Category" },
          { key: "current", label: "On hand", align: "right" },
          { key: "lastOut", label: "Last issued" },
          { key: "days", label: "Days idle", align: "right" },
        ],
        rows: slow.map((it) => ({
          id: it.rfq,
          cells: [
            <MonoCell key="r">{it.rfq}</MonoCell>,
            <span key="i" className="font-medium text-white">
              {it.name}
            </span>,
            <span key="c" className="text-white/65">
              {it.category}
            </span>,
            <MonoCell key="cur">{it.current.toLocaleString()}</MonoCell>,
            <MonoCell key="lo">{it.lastOut}</MonoCell>,
            <span
              key="d"
              className="font-mono text-[12.5px] tracking-tight text-amber-300"
            >
              {it.daysIdle}d
            </span>,
          ],
        })),
        filters: [
          {
            label: "Idle threshold",
            options: ["≥ 30 days", "≥ 60 days", "≥ 90 days"],
          },
          {
            label: "Category",
            options: [
              "All Categories",
              "Structural",
              "Finishing",
              "Electrical",
            ],
          },
        ],
      };
    }
    case "Maintenance parts usage": {
      const maint = [
        ...maintenanceStockIn.map((r) => ({
          ...r,
          direction: "in" as const,
        })),
        ...maintenanceStockOut.map((r) => ({
          ...r,
          direction: "out" as const,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date));
      return {
        columns: [
          { key: "no", label: "Receipt" },
          { key: "date", label: "Date" },
          { key: "type", label: "Type" },
          { key: "item", label: "Part" },
          { key: "qty", label: "Qty", align: "right" },
          { key: "site", label: "Site" },
          { key: "tech", label: "Technician" },
        ],
        rows: maint.map((r) => ({
          id: r.direction + r.no,
          cells: [
            <MonoCell key="n">{r.no}</MonoCell>,
            <MonoCell key="d">{r.date}</MonoCell>,
            r.direction === "in" ? (
              <StatusPill key="t" tone="good">
                Stock in
              </StatusPill>
            ) : (
              <StatusPill key="t" tone="low">
                Stock out
              </StatusPill>
            ),
            <span key="i" className="font-medium text-white">
              {r.item}
            </span>,
            <MonoCell key="q">
              {r.direction === "in" ? "+" : "−"}
              {r.qty} {r.unit}
            </MonoCell>,
            <span key="s" className="text-white/65">
              {r.site}
            </span>,
            <span key="te" className="text-white/65">
              {r.technician}
            </span>,
          ],
        })),
        filters: [
          {
            label: "Date range",
            options: ["Last 30 days", "Last 7 days", "Quarter to date"],
          },
          {
            label: "Site",
            options: ["All Sites", "Site A", "Main Office"],
          },
          {
            label: "Type",
            options: ["All movements", "Stock in", "Stock out"],
          },
        ],
      };
    }
    case "Stock on hand":
    default: {
      return {
        columns: [
          { key: "rfq", label: "RFQ" },
          { key: "item", label: "Item" },
          { key: "category", label: "Category" },
          { key: "current", label: "Current", align: "right" },
          { key: "unit", label: "Unit" },
          { key: "status", label: "Status" },
        ],
        rows: reportPreview.map((row) => ({
          id: row.rfq,
          cells: [
            <MonoCell key="r">{row.rfq}</MonoCell>,
            <span key="i" className="font-medium text-white">
              {row.name}
            </span>,
            <span key="c" className="text-white/65">
              {row.category}
            </span>,
            <MonoCell key="cur">{row.current}</MonoCell>,
            <span key="u" className="text-white/65">
              {row.unit}
            </span>,
            <StatusPill key="s" tone={row.status}>
              {row.statusLabel}
            </StatusPill>,
          ],
        })),
        filters: [
          {
            label: "Date range",
            options: ["Last 30 days", "Last 7 days", "Quarter to date"],
          },
          {
            label: "Project",
            options: ["All Projects"],
          },
          {
            label: "Department",
            options: ["All Departments"],
          },
          {
            label: "Category",
            options: [
              "All Categories",
              "Structural",
              "Finishing",
              "Electrical",
            ],
          },
        ],
      };
    }
  }
}

export default function ReportViewerDialog({
  report,
  onClose,
}: {
  report: ReportCard | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!report) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [report, onClose]);

  const shape = useMemo(
    () => (report ? shapeForReport(report.title) : null),
    [report],
  );

  if (!report || !mounted || !shape) return null;

  const Icon = report.icon;

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close report"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
        <div className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-400/40 to-transparent" />

          {/* HEADER */}
          <div className="relative shrink-0 overflow-hidden border-b border-white/8 px-6 pb-5 pt-6 sm:px-8">
            <div
              className={`pointer-events-none absolute inset-0 bg-linear-to-br ${report.accent} opacity-40`}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${report.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-sky-300/80">
                    Insights · Report
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                    {report.title}
                  </h2>
                  <p className="mt-1 max-w-2xl text-xs text-white/55">
                    {report.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="shrink-0 border-b border-white/8 px-6 py-4 sm:px-8">
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `1fr repeat(${shape.filters.length}, minmax(160px, 200px))`,
              }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  className={`${fieldClass} pl-9`}
                  placeholder="Search this report..."
                />
              </div>
              {shape.filters.map((f) => (
                <select
                  key={f.label}
                  className={fieldClass}
                  defaultValue={f.options[0]}
                  aria-label={f.label}
                >
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {/* TABLE */}
          <div className="flex-1 overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur">
                  <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {shape.columns.map((c) => (
                      <th
                        key={c.key}
                        className={`px-6 py-3 font-medium ${
                          c.align === "right" ? "text-right" : ""
                        }`}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shape.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 transition hover:bg-white/3"
                    >
                      {row.cells.map((cell, i) => (
                        <td
                          key={i}
                          className={`px-6 py-3.5 ${
                            shape.columns[i].align === "right"
                              ? "text-right"
                              : ""
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {shape.rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={shape.columns.length}
                        className="px-6 py-10 text-center text-xs text-white/40"
                      >
                        No data for this report yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex shrink-0 flex-col gap-3 border-t border-white/8 bg-zinc-950/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-xs text-white/50">
              {shape.rows.length} row{shape.rows.length === 1 ? "" : "s"} ·{" "}
              <span className="text-white/35">
                As of {new Date().toISOString().slice(0, 10)}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:brightness-110">
                <FileSpreadsheet className="h-4 w-4" /> Export to Excel
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-rose-400 to-rose-500 px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:brightness-110">
                <FileText className="h-4 w-4" /> Export to PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
