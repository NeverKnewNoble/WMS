import type {
  CreateMovementPayload,
  ListMovementsQuery,
  MovementRow,
  MovementsListResponse,
} from "@/types/stock-movements";
import type { ImportSummary } from "@/types/import";
import { ApiError, http, qs } from "./http";
import { failWithToast } from "./toast";
import { triggerBlobDownload, postFileForJson } from "./download";

export type MovementDirection = "in" | "out";

export async function listMovements(query: ListMovementsQuery = {}): Promise<MovementsListResponse> {
  try {
    return await http.get<MovementsListResponse>(`/api/stock-movements${qs(query)}`);
  } catch (err) {
    failWithToast(err, "Could not load stock movements");
  }
}

export async function getMovement(id: string): Promise<MovementRow> {
  try {
    return await http.get<MovementRow>(`/api/stock-movements/${id}`);
  } catch (err) {
    failWithToast(err, "Could not load movement");
  }
}

export async function deleteMovement(id: string): Promise<{ id: string; refNo: string }> {
  try {
    return await http.delete<{ id: string; refNo: string }>(`/api/stock-movements/${id}`);
  } catch (err) {
    failWithToast(err, "Could not delete movement");
  }
}

/**
 * Mirrors the §7 CHECK constraint client-side so we can fail fast before
 * the round-trip. Returns null if valid, or an error message if not.
 */
function validateMovementShape(p: CreateMovementPayload): string | null {
  if (!p.lines.length) return "At least one line item is required";

  if (p.kind === "operations" && p.direction === "in" && !p.supplierName) {
    return "Operations stock-in requires a supplier";
  }
  if (p.kind === "operations" && p.direction === "out" && !p.projectWbs) {
    return "Operations stock-out requires a project (WBS)";
  }
  if (p.kind === "maintenance" && !p.siteCode) {
    return "Maintenance movements require a site";
  }
  return null;
}

export async function createMovement(payload: CreateMovementPayload): Promise<MovementRow> {
  const violation = validateMovementShape(payload);
  if (violation) {
    // Surface the same error shape services emit for server-side failures so
    // callers don't need a separate code path.
    throw new ApiError(400, violation);
  }

  try {
    return await http.post<MovementRow>("/api/stock-movements", payload);
  } catch (err) {
    failWithToast(err, "Could not record movement");
  }
}

// ─── Excel template / import ────────────────────────────────────────

/** Download the bulk-import template for either GRN (in) or MRN (out) flows. */
export async function downloadMovementsTemplate(direction: MovementDirection): Promise<void> {
  try {
    const res = await fetch(`/api/stock-movements/template?direction=${direction}`, {
      credentials: "same-origin",
    });
    if (!res.ok) throw new Error(`Template download failed (${res.status})`);
    const filename = direction === "in" ? "stock-in-template.xlsx" : "stock-out-template.xlsx";
    triggerBlobDownload(await res.blob(), filename);
  } catch (err) {
    failWithToast(err, "Could not download template");
  }
}

export async function importMovementsExcel(
  direction: MovementDirection,
  file: File,
): Promise<ImportSummary> {
  return postFileForJson<ImportSummary>(
    `/api/stock-movements/import?direction=${direction}`,
    file,
  );
}
