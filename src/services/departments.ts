import type {
  CreateDepartmentPayload,
  DepartmentRow,
  DepartmentsListResponse,
  UpdateDepartmentPayload,
} from "@/types/lookups";
import { http, qs } from "./http";
import { failWithToast } from "./toast";

export async function listDepartments(
  query: { q?: string; limit?: number; offset?: number } = {},
): Promise<DepartmentsListResponse> {
  try {
    return await http.get<DepartmentsListResponse>(`/api/departments${qs(query)}`);
  } catch (err) {
    failWithToast(err, "Could not load departments");
  }
}

export async function createDepartment(payload: CreateDepartmentPayload) {
  try {
    return await http.post<DepartmentRow>("/api/departments", payload);
  } catch (err) {
    failWithToast(err, "Could not create department");
  }
}

export async function updateDepartment(id: string, payload: UpdateDepartmentPayload) {
  try {
    return await http.patch<DepartmentRow>(`/api/departments/${id}`, payload);
  } catch (err) {
    failWithToast(err, "Could not update department");
  }
}

export async function deleteDepartment(id: string): Promise<{ id: string }> {
  try {
    return await http.delete<{ id: string }>(`/api/departments/${id}`);
  } catch (err) {
    failWithToast(err, "Could not delete department");
  }
}
