import type { ElementType } from "react";
import type { StatusTone } from "@/components/ui_components/portal/primitives";

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
