import type {
  CreateSupplierPayload,
  SupplierRow,
  SuppliersListResponse,
  UpdateSupplierPayload,
} from "@/types/lookups";
import { http, qs } from "./http";
import { failWithToast } from "./toast";

export async function listSuppliers(
  query: { q?: string; limit?: number; offset?: number } = {},
): Promise<SuppliersListResponse> {
  try {
    return await http.get<SuppliersListResponse>(`/api/suppliers${qs(query)}`);
  } catch (err) {
    failWithToast(err, "Could not load suppliers");
  }
}

export async function createSupplier(payload: CreateSupplierPayload) {
  try {
    return await http.post<SupplierRow>("/api/suppliers", payload);
  } catch (err) {
    failWithToast(err, "Could not create supplier");
  }
}

export async function updateSupplier(id: string, payload: UpdateSupplierPayload) {
  try {
    return await http.patch<SupplierRow>(`/api/suppliers/${id}`, payload);
  } catch (err) {
    failWithToast(err, "Could not update supplier");
  }
}

export async function deleteSupplier(id: string): Promise<{ id: string }> {
  try {
    return await http.delete<{ id: string }>(`/api/suppliers/${id}`);
  } catch (err) {
    failWithToast(err, "Could not delete supplier");
  }
}
