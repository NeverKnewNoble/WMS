export type Item = {
  rfq: string;
  name: string;
  category: string;
  unit: string;
  current: number;
  reorder: number;
  min: number;
  max: number;
  status: "in-stock" | "low" | "critical" | "out";
  statusLabel: string;
};
