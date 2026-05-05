import type {
  CreateStorageLocationPayload,
  StorageLocationRow,
  StorageLocationsListResponse,
  UpdateStorageLocationPayload,
} from "@/types/lookups";
import { http, qs } from "./http";
import { failWithToast } from "./toast";

export async function listStorageLocations(
  query: { q?: string; limit?: number; offset?: number } = {},
): Promise<StorageLocationsListResponse> {
  try {
    return await http.get<StorageLocationsListResponse>(
      `/api/storage-locations${qs(query)}`,
    );
  } catch (err) {
    failWithToast(err, "Could not load storage locations");
  }
}

export async function createStorageLocation(payload: CreateStorageLocationPayload) {
  try {
    return await http.post<StorageLocationRow>("/api/storage-locations", payload);
  } catch (err) {
    failWithToast(err, "Could not create storage location");
  }
}

export async function updateStorageLocation(id: string, payload: UpdateStorageLocationPayload) {
  try {
    return await http.patch<StorageLocationRow>(`/api/storage-locations/${id}`, payload);
  } catch (err) {
    failWithToast(err, "Could not update storage location");
  }
}

export async function deleteStorageLocation(id: string): Promise<{ id: string }> {
  try {
    return await http.delete<{ id: string }>(`/api/storage-locations/${id}`);
  } catch (err) {
    failWithToast(err, "Could not delete storage location");
  }
}
