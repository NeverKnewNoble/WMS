"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  Boxes,
  CalendarRange,
  Coins,
  ExternalLink,
  MapPin,
  PackageMinus,
  Pencil,
  ShieldCheck,
  Trash2,
  TrendingUp,
  User2,
  X,
} from "lucide-react";
import {
  StatusPill,
  type StatusTone,
} from "../ui_components/portal/primitives";
import type { Project } from "@/types/projects";
import { stockOutMrns } from "@/utils/sampleData";

type ProjectStatus = "Active" | "On Hold" | "Completed";

const STATUS_TONE: Record<ProjectStatus, StatusTone> = {
  Active: "active",
  "On Hold": "on-hold",
  Completed: "completed",
};

function statusForProject(p: Project): ProjectStatus {
  // Deterministic mock derivation so the demo feels alive without a real field.
  const sum = (p.wbs + p.name).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pick = sum % 5;
  if (pick === 0) return "On Hold";
  if (pick === 1) return "Completed";
  return "Active";
}

function managerForProject(p: Project): string {
  const pool = [
    "Eng. Boateng",
    "Eng. Adjei",
    "Eng. Owusu",
    "Eng. Mensah",
    "Eng. Ofori",
  ];
  const idx = (p.wbs.charCodeAt(0) + p.name.length) % pool.length;
  return pool[idx];
}

function topMaterialsForProject(p: Project) {
  const baseline = [
    { name: "Cement 50kg", unit: "Bags", weight: 1.0 },
    { name: "Steel Rods 12mm", unit: "Pieces", weight: 0.78 },
    { name: "Concrete Blocks", unit: "Pieces", weight: 0.62 },
    { name: "Sand", unit: "Trips", weight: 0.41 },
    { name: "Paint White 20L", unit: "Litres", weight: 0.28 },
  ];
  const total = Number(p.qtyConsumed.replace(/,/g, "")) || 1;
  const max = Math.round(total * baseline[0].weight);
  return baseline.map((b) => ({
    ...b,
    qty: Math.round(total * b.weight),
    pct: Math.round(b.weight * 100),
    max,
  }));
}

export default function ProjectDetailsDialog({
  project,
  onClose,
  onEdit,
  onDelete,
}: {
  project: Project | null;
  onClose: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  const status = useMemo(
    () => (project ? statusForProject(project) : null),
    [project],
  );
  const manager = useMemo(
    () => (project ? managerForProject(project) : ""),
    [project],
  );
  const materials = useMemo(
    () => (project ? topMaterialsForProject(project) : []),
    [project],
  );
  const recentMrns = useMemo(() => {
    if (!project) return [];
    const ofProject = stockOutMrns.filter((m) => m.wbs === project.wbs);
    if (ofProject.length > 0) return ofProject;
    return stockOutMrns.slice(0, 2).map((m) => ({ ...m, wbs: project.wbs }));
  }, [project]);

  if (!project || !mounted) return null;

  const utilization = Math.min(
    95,
    Math.round((project.itemsIssued / 60) * 100),
  );

  return createPortal(
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close project details"
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
        <div className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-zinc-900 shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-400/40 to-transparent" />

          {/* HERO */}
          <div className="relative shrink-0 overflow-hidden border-b border-white/8 px-6 pb-6 pt-6 sm:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.10),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.06),transparent_55%)]" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 font-mono text-xl font-semibold text-white ring-1 ring-inset ring-white/10">
                  {project.wbs}
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-sky-300/80">
                    Project · WBS {project.wbs}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {project.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-white/40" />
                      {project.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <User2 className="h-3.5 w-3.5 text-white/40" />
                      {manager}
                    </span>
                    {status && (
                      <StatusPill tone={STATUS_TONE[status]}>
                        {status}
                      </StatusPill>
                    )}
                  </div>
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

            {/* KPI ROW */}
            <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiTile
                icon={<Boxes className="h-4 w-4 text-sky-300" />}
                label="Items issued"
                value={project.itemsIssued.toString()}
                sub="distinct SKUs"
              />
              <KpiTile
                icon={<TrendingUp className="h-4 w-4 text-emerald-300" />}
                label="Qty consumed"
                value={project.qtyConsumed}
                sub="cumulative units"
              />
              <KpiTile
                icon={<Activity className="h-4 w-4 text-amber-300" />}
                label="Last activity"
                value={project.lastActivity}
                sub="most recent MRN"
              />
              <KpiTile
                icon={<Coins className="h-4 w-4 text-cyan-300" />}
                label="Budget used"
                value={`${utilization}%`}
                sub="vs. allocated"
                progress={utilization}
              />
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Materials breakdown */}
              <section className="lg:col-span-3 rounded-2xl border border-white/8 bg-white/2 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Top materials issued
                    </h3>
                    <p className="mt-0.5 text-xs text-white/45">
                      Composition of issuances against this WBS.
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                    last 30 days
                  </span>
                </div>

                <ul className="mt-4 space-y-3.5">
                  {materials.map((m) => (
                    <li key={m.name}>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-medium text-white/85">
                          {m.name}
                        </span>
                        <span className="font-mono text-[12px] text-white/70">
                          {m.qty.toLocaleString()}{" "}
                          <span className="text-white/40">{m.unit}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-sky-400/80 via-sky-300 to-emerald-300/80"
                          style={{ width: `${(m.qty / m.max) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Right rail */}
              <aside className="lg:col-span-2 space-y-6">
                <section className="rounded-2xl border border-white/8 bg-white/2 p-5">
                  <h3 className="text-sm font-semibold text-white">
                    Project info
                  </h3>
                  <dl className="mt-4 space-y-3 text-xs">
                    <InfoRow
                      icon={<MapPin className="h-3.5 w-3.5 text-white/40" />}
                      label="Location"
                      value={project.location}
                    />
                    <InfoRow
                      icon={<User2 className="h-3.5 w-3.5 text-white/40" />}
                      label="Manager"
                      value={manager}
                    />
                    <InfoRow
                      icon={
                        <CalendarRange className="h-3.5 w-3.5 text-white/40" />
                      }
                      label="Started"
                      value="2026-01-12"
                    />
                    <InfoRow
                      icon={
                        <CalendarRange className="h-3.5 w-3.5 text-white/40" />
                      }
                      label="Est. end"
                      value="2026-09-30"
                    />
                    <InfoRow
                      icon={
                        <ShieldCheck className="h-3.5 w-3.5 text-white/40" />
                      }
                      label="Compliance"
                      value="On track"
                    />
                  </dl>
                </section>

                <section className="rounded-2xl border border-white/8 bg-white/2 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Recent MRNs
                    </h3>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-300/90 transition hover:text-sky-200"
                    >
                      View all <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                  <ul className="mt-3 divide-y divide-white/5">
                    {recentMrns.map((m) => (
                      <li
                        key={m.mrn}
                        className="flex items-center gap-3 py-2.5 text-xs"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
                          <PackageMinus className="h-3.5 w-3.5 text-amber-300" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white/85">
                            {m.item}
                          </p>
                          <p className="truncate text-[11px] text-white/45">
                            {m.mrn} · {m.date} · {m.issuedTo}
                          </p>
                        </div>
                        <span className="font-mono text-[11.5px] text-white/75">
                          {m.qty} {m.unit}
                        </span>
                      </li>
                    ))}
                    {recentMrns.length === 0 && (
                      <li className="py-4 text-center text-xs text-white/40">
                        No MRNs against this project yet.
                      </li>
                    )}
                  </ul>
                </section>
              </aside>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/8 bg-zinc-950/40 px-6 py-4 sm:px-8">
            <span className="hidden text-[11px] uppercase tracking-[0.2em] text-white/35 sm:inline">
              Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white/70">Esc</kbd> to close
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onDelete?.(project)}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-200 transition hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete project
              </button>
              <button
                type="button"
                onClick={() => onEdit?.(project)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit project
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

function KpiTile({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  progress?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/45">
        <span>{label}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 ring-1 ring-inset ring-white/10">
          {icon}
        </span>
      </div>
      <p className="mt-2 font-mono text-xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-white/45">{sub}</p>
      {typeof progress === "number" && (
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-linear-to-r from-cyan-400 to-sky-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-white/55">
        {icon}
        {label}
      </span>
      <span className="font-medium text-white/85">{value}</span>
    </div>
  );
}
