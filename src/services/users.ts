import type { Me, NotificationToggle, UpdateMePayload } from "@/types/users";
import { http } from "./http";
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
