import type { Lookups } from "@/types/lookups";
import { http } from "./http";
import { failWithToast } from "./toast";

/**
 * One round-trip for every dropdown in the modals. Cache this in your
 * client if you call it often — the contents change rarely.
 */
export async function getLookups(): Promise<Lookups> {
  try {
    return await http.get<Lookups>("/api/lookups");
  } catch (err) {
    failWithToast(err, "Could not load reference data");
  }
}
