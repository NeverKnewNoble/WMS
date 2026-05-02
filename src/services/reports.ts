import type {
  MaintenanceUsageFilters,
  MaintenanceUsageRow,
  ProjectConsumptionRow,
  ReportEnvelope,
  ReportFilters,
  ReportRow,
  ReportSlug,
  SlowMovingFilters,
  SlowMovingRow,
  StockMovementHistoryFilters,
  StockMovementHistoryRow,
  StockOnHandFilters,
  StockOnHandRow,
} from "@/types/reports";
import { http, qs } from "./http";
import { failWithToast } from "./toast";

export async function getStockOnHandReport(
  filters: StockOnHandFilters = {},
): Promise<ReportEnvelope<StockOnHandRow>> {
  try {
    return await http.get<ReportEnvelope<StockOnHandRow>>(
      `/api/reports/stock-on-hand${qs(filters)}`,
    );
  } catch (err) {
    failWithToast(err, "Could not load stock-on-hand report");
  }
}

export async function getStockMovementHistoryReport(
  filters: StockMovementHistoryFilters = {},
): Promise<ReportEnvelope<StockMovementHistoryRow>> {
  try {
    return await http.get<ReportEnvelope<StockMovementHistoryRow>>(
      `/api/reports/stock-movement-history${qs(filters)}`,
    );
  } catch (err) {
    failWithToast(err, "Could not load stock movement history report");
  }
}

export async function getProjectConsumptionReport(): Promise<
  ReportEnvelope<ProjectConsumptionRow>
> {
  try {
    return await http.get<ReportEnvelope<ProjectConsumptionRow>>(
      "/api/reports/project-consumption",
    );
  } catch (err) {
    failWithToast(err, "Could not load project consumption report");
  }
}

export async function getSlowMovingReport(
  filters: SlowMovingFilters = {},
): Promise<ReportEnvelope<SlowMovingRow>> {
  try {
    return await http.get<ReportEnvelope<SlowMovingRow>>(
      `/api/reports/slow-moving${qs(filters)}`,
    );
  } catch (err) {
    failWithToast(err, "Could not load slow-moving stock report");
  }
}

export async function getMaintenanceUsageReport(
  filters: MaintenanceUsageFilters = {},
): Promise<ReportEnvelope<MaintenanceUsageRow>> {
  try {
    return await http.get<ReportEnvelope<MaintenanceUsageRow>>(
      `/api/reports/maintenance-usage${qs(filters)}`,
    );
  } catch (err) {
    failWithToast(err, "Could not load maintenance parts usage report");
  }
}

/**
 * Generic dispatcher. Returns the right envelope shape for the given
 * slug — the conditional types `ReportRow` / `ReportFilters` (in
 * `@/types/reports`) do the type-level routing.
 */
export async function getReport<S extends ReportSlug>(
  slug: S,
  filters: ReportFilters<S> = {} as ReportFilters<S>,
): Promise<ReportEnvelope<ReportRow<S>>> {
  try {
    return await http.get<ReportEnvelope<ReportRow<S>>>(
      `/api/reports/${slug}${qs(filters as Record<string, string | number | boolean | null | undefined>)}`,
    );
  } catch (err) {
    failWithToast(err, `Could not load ${slug} report`);
  }
}
