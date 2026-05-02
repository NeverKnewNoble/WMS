export type Me = {
  id:        string;
  email:     string;
  fullName:  string;
  phone:     string | null;
  bio:       string | null;
  avatarUrl: string | null;
  status:    "invited" | "active" | "suspended";
  role:        { code: string; label: string };
  department:  { id: string; code: string; label: string } | null;
  defaultSite: { id: string; code: string; label: string } | null;
  isVerified: boolean;
};

export type UpdateMePayload = Partial<{
  fullName:      string;
  phone:         string | null;
  bio:           string | null;
  avatarUrl:     string | null;
  departmentId:  string | null;
  defaultSiteId: string | null;
}>;

/**
 * API-shaped notification toggle. The legacy demo toggle in
 * `@/types/settings` has a different shape (`on` instead of `enabled`)
 * and is only used by `sampleData.tsx`.
 */
export type NotificationToggle = {
  key:         string;
  label:       string;
  description: string;
  enabled:     boolean;
};
