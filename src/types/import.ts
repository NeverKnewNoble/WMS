// Shared shape returned by every bulk-import endpoint.
// `created` + `skipped` always sum to the total rows the server attempted;
// `errors` enumerates per-row problems so the UI can show actionable feedback.

export type ImportRowError = {
  row:     number;   // 1-based sheet row (header is row 1)
  message: string;
};

export type ImportSummary = {
  created: number;
  skipped: number;
  errors:  ImportRowError[];
};
