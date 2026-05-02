import type { ElementType } from "react";

export type SettingsSection = {
  icon: ElementType;
  title: string;
  description: string;
  accent: string;
  glow: string;
};

export type NotificationToggle = {
  label: string;
  description: string;
  on: boolean;
};
