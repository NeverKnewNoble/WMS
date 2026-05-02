"use client";

import { useState } from "react";
import { Bell, Mail, Phone, Save, ShieldCheck, User2 } from "lucide-react";
import { clsx } from "clsx";
import {
  PageHeader,
  Surface,
  FieldLabel,
  fieldClass,
} from "@/components/ui_components/portal/primitives";

const TABS = [
  { key: "profile", label: "Profile", icon: User2 },
  { key: "notifications", label: "Notification preferences", icon: Bell },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export type SettingsUser = {
  fullName: string;
  email: string;
  initials: string;
  phone: string;
  role: { code: string; label: string };
  department: { code: string; label: string } | null;
  defaultSite: { code: string; label: string } | null;
  bio: string;
  isVerified: boolean;
};

export type NotificationToggle = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

export default function SettingsTabs({
  user,
  toggles: initialToggles,
}: {
  user: SettingsUser;
  toggles: NotificationToggle[];
}) {
  const [tab, setTab] = useState<TabKey>("profile");
  const [toggles, setToggles] = useState(initialToggles);

  return (
    <div className="px-8 py-10 animate-page-in">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your profile and how the system reaches you."
      />

      <div className="mt-8 inline-flex gap-1 rounded-full border border-white/10 bg-white/3 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-medium transition",
                active
                  ? "bg-white text-zinc-900"
                  : "text-white/60 hover:text-white",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "profile" && <ProfileTab user={user} />}
        {tab === "notifications" && (
          <NotificationsTab
            toggles={toggles}
            onToggle={(i) =>
              setToggles((prev) =>
                prev.map((t, idx) =>
                  idx === i ? { ...t, enabled: !t.enabled } : t,
                ),
              )
            }
          />
        )}
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: SettingsUser }) {
  return (
    <Surface className="p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-sky-400/30 to-emerald-400/20 text-xl font-semibold text-white ring-1 ring-inset ring-white/10">
            {user.initials}
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              {user.fullName}
            </h2>
            <p className="mt-0.5 text-xs text-white/55">
              {user.email} · {user.role.label}
            </p>
            {user.isVerified && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 sm:self-auto"
        >
          Change avatar
        </button>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-8 grid grid-cols-1 gap-5 border-t border-white/8 pt-6 sm:grid-cols-2"
      >
        <div>
          <FieldLabel>Full name</FieldLabel>
          <input
            className={fieldClass}
            defaultValue={user.fullName}
            placeholder="Your name"
          />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              className={`${fieldClass} pl-9`}
              defaultValue={user.email}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Phone</FieldLabel>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              type="tel"
              className={`${fieldClass} pl-9`}
              placeholder="+233 ..."
              defaultValue={user.phone}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Role</FieldLabel>
          <input
            className={fieldClass}
            value={user.role.label}
            readOnly
            disabled
          />
        </div>

        <div>
          <FieldLabel>Department</FieldLabel>
          <input
            className={fieldClass}
            value={user.department?.label ?? "—"}
            readOnly
            disabled
          />
        </div>
        <div>
          <FieldLabel>Default site</FieldLabel>
          <input
            className={fieldClass}
            value={user.defaultSite?.label ?? "—"}
            readOnly
            disabled
          />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Bio</FieldLabel>
          <textarea
            rows={3}
            className={`${fieldClass} resize-none`}
            placeholder="A short note about your role and responsibilities..."
            defaultValue={user.bio}
          />
        </div>

        <div className="-mx-6 mt-2 flex items-center justify-end gap-3 border-t border-white/8 px-6 pt-5 sm:col-span-2 sm:-mx-8 sm:px-8">
          <button
            type="button"
            className="rounded-full px-5 py-2 text-sm font-medium text-white/70 transition hover:text-white"
          >
            Reset
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100"
          >
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </div>
      </form>
    </Surface>
  );
}

function NotificationsTab({
  toggles,
  onToggle,
}: {
  toggles: NotificationToggle[];
  onToggle: (index: number) => void;
}) {
  return (
    <Surface className="p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 ring-1 ring-inset ring-sky-400/25">
          <Bell className="h-5 w-5 text-sky-300" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-white">
            Notification preferences
          </h2>
          <p className="mt-1 text-xs text-white/55">
            Choose which events trigger notifications. Changes save instantly.
          </p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-white/5 border-t border-white/8 pt-2">
        {toggles.map((t, i) => (
          <li
            key={t.key}
            className="flex items-center justify-between gap-6 py-4"
          >
            <div>
              <p className="text-sm font-medium text-white">{t.label}</p>
              <p className="mt-0.5 text-xs text-white/50">{t.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={t.enabled}
              aria-label={t.label}
              onClick={() => onToggle(i)}
              className={clsx(
                "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition",
                t.enabled
                  ? "bg-linear-to-r from-sky-400 to-emerald-400"
                  : "bg-white/10 hover:bg-white/15",
              )}
            >
              <span
                className={clsx(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition",
                  t.enabled ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </li>
        ))}
      </ul>
    </Surface>
  );
}
