import type {
  ApiItem,
  CreateItemPayload,
  ItemsListResponse,
  ListItemsQuery,
  UpdateItemPayload,
} from "@/types/items";
import { http, qs } from "./http";
import { failWithToast } from "./toast";

export async function listItems(query: ListItemsQuery = {}): Promise<ItemsListResponse> {
  try {
    return await http.get<ItemsListResponse>(`/api/items${qs(query)}`);
  } catch (err) {
    failWithToast(err, "Could not load items");
  }
}

export async function getItem(id: string): Promise<ApiItem> {
  try {
    return await http.get<ApiItem>(`/api/items/${id}`);
  } catch (err) {
    failWithToast(err, "Could not load item");
  }
}

export async function createItem(payload: CreateItemPayload): Promise<ApiItem> {
  try {
    return await http.post<ApiItem>("/api/items", payload);
  } catch (err) {
    failWithToast(err, "Could not create item");
  }
}

export async function updateItem(id: string, payload: UpdateItemPayload): Promise<ApiItem> {
  try {
    return await http.patch<ApiItem>(`/api/items/${id}`, payload);
  } catch (err) {
    failWithToast(err, "Could not update item");
  }
}

export async function deleteItem(id: string): Promise<{ id: string }> {
  try {
    return await http.delete<{ id: string }>(`/api/items/${id}`);
  } catch (err) {
    failWithToast(err, "Could not delete item");
  }
}
