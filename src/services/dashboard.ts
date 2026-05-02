import type { DashboardResponse } from "@/types/dashboard";
import { http } from "./http";
import { failWithToast } from "./toast";

export async function getDashboard(): Promise<DashboardResponse> {
  try {
    return await http.get<DashboardResponse>("/api/dashboard");
  } catch (err) {
    failWithToast(err, "Could not load dashboard");
  }
}
