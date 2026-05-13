import type {
  AdminUserRow,
  AdminUsersListResponse,
  CreateAdminUserPayload,
  Me,
  NotificationToggle,
  UpdateAdminUserPayload,
  UpdateMePayload,
} from "@/types/users";
import { http, qs } from "./http";
import { failWithToast } from "./toast";

export async function getMe(): Promise<Me> {
  try {
    return await http.get<Me>("/api/users/me");
  } catch (err) {
    failWithToast(err, "Could not load your profile");
  }
}

export async function updateMe(payload: UpdateMePayload): Promise<Me> {
  try {
    return await http.patch<Me>("/api/users/me", payload);
  } catch (err) {
    failWithToast(err, "Could not save your profile");
  }
}

export async function getNotificationPreferences(): Promise<NotificationToggle[]> {
  try {
    return await http.get<NotificationToggle[]>("/api/users/me/notifications");
  } catch (err) {
    failWithToast(err, "Could not load notification preferences");
  }
}

export async function setNotificationPreference(
  key: string,
  enabled: boolean,
): Promise<{ key: string; enabled: boolean }> {
  try {
    return await http.patch<{ key: string; enabled: boolean }>(
      "/api/users/me/notifications",
      { key, enabled },
    );
  } catch (err) {
    failWithToast(err, `Could not update notification "${key}"`);
  }
}

// ─── Admin: users management ─────────────────────────────────────────

export async function listUsers(
  query: { q?: string; limit?: number; offset?: number } = {},
): Promise<AdminUsersListResponse> {
  try {
    return await http.get<AdminUsersListResponse>(`/api/users${qs(query)}`);
  } catch (err) {
    failWithToast(err, "Could not load users");
  }
}

export async function createUser(payload: CreateAdminUserPayload): Promise<AdminUserRow> {
  try {
    return await http.post<AdminUserRow>("/api/users", payload);
  } catch (err) {
    failWithToast(err, "Could not create user");
  }
}

export async function updateUser(
  id: string,
  payload: UpdateAdminUserPayload,
): Promise<AdminUserRow> {
  try {
    return await http.patch<AdminUserRow>(`/api/users/${id}`, payload);
  } catch (err) {
    failWithToast(err, "Could not update user");
  }
}

export async function deleteUser(id: string): Promise<{ id: string }> {
  try {
    return await http.delete<{ id: string }>(`/api/users/${id}`);
  } catch (err) {
    failWithToast(err, "Could not delete user");
  }
}
