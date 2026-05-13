"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  PageHeader,
  Surface,
} from "@/components/ui_components/portal/primitives";
import ReportViewerDialog from "@/components/modals/report-viewer";
import { reportCards } from "@/utils/sampleData";
import type { ReportCard } from "@/types/reports";

export default function ReportsPage() {
  const [selected, setSelected] = useState<ReportCard | null>(null);

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10 animate-page-in">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Select a report to open its full table, filter, and export."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((r) => (
          <Surface
            key={r.title}
            className={`group overflow-hidden p-6 transition hover:bg-white/3 ${
              r.active ? "ring-1 ring-inset ring-brand-orange/30" : ""
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-linear-to-br ${r.accent} opacity-50`}
            />
            <button
              type="button"
              onClick={() => setSelected(r)}
              className="relative block w-full text-left"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${r.iconClass}`}
                >
                  <r.icon className="h-5 w-5" />
                </span>
                <span className="rounded-full p-1.5 text-white/85 transition group-hover:bg-white/5 group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-white">
                {r.title}
              </h3>
              <p className="mt-1.5 text-sm text-white/90">{r.description}</p>
              <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition group-hover:bg-white/10">
                Open report
              </span>
            </button>
          </Surface>
        ))}
      </div>

      <ReportViewerDialog
        report={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
