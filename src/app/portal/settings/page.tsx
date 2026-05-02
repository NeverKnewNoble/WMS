import SettingsTabs, {
  type NotificationToggle,
  type SettingsUser,
} from "@/components/ui_components/portal/settings-tabs";
import { getCurrentUser, initialsFor } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const NOTIFICATION_DEFAULTS: { key: string; label: string; description: string; default: boolean }[] = [
  {
    key: "low_stock_alert",
    label: "Low stock alerts",
    description: "Notify when an item hits its reorder threshold",
    default: true,
  },
  {
    key: "stock_in_received",
    label: "New stock-in received",
    description: "Notify when inbound stock is confirmed",
    default: true,
  },
  {
    key: "stock_out_dispatched",
    label: "Stock-out dispatched",
    description: "Notify when an outbound dispatch is completed",
    default: false,
  },
  {
    key: "weekly_summary_email",
    label: "Weekly summary email",
    description: "A weekly digest of all warehouse activity",
    default: true,
  },
];

export default async function SettingsPage() {
  const user = await getCurrentUser();

  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: user.id },
  });
  const prefMap = new Map(prefs.map((p) => [p.key, p.enabled]));

  const toggles: NotificationToggle[] = NOTIFICATION_DEFAULTS.map((d) => ({
    key: d.key,
    label: d.label,
    description: d.description,
    enabled: prefMap.get(d.key) ?? d.default,
  }));

  const settingsUser: SettingsUser = {
    fullName: user.fullName,
    email:    user.email,
    initials: initialsFor(user.fullName || user.email),
    phone:    user.phone ?? "",
    role: {
      code:  user.role.code,
      label: user.role.label,
    },
    department: user.department
      ? { code: user.department.code, label: user.department.label }
      : null,
    defaultSite: user.defaultSite
      ? { code: user.defaultSite.code, label: user.defaultSite.label }
      : null,
    bio:        user.bio ?? "",
    isVerified: user.emailVerifiedAt !== null,
  };

  return <SettingsTabs user={settingsUser} toggles={toggles} />;
}
