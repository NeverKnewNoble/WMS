import type {
  AlertSeverity,
  ReorderAlertsResponse,
} from "@/types/reorder-alerts";
import { http, qs } from "./http";
import { failWithToast } from "./toast";

export async function getReorderAlerts(
  filters: { severity?: AlertSeverity } = {},
): Promise<ReorderAlertsResponse> {
  try {
    return await http.get<ReorderAlertsResponse>(`/api/reorder-alerts${qs(filters)}`);
  } catch (err) {
    failWithToast(err, "Could not load reorder alerts");
  }
}
