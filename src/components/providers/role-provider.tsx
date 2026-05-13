"use client";

import { createContext, useContext, type ReactNode } from "react";

type RoleContextValue = {
  role: string;
  isAdmin: boolean;
  canDelete: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ role, children }: { role: string; children: ReactNode }) {
  const isAdmin = role === "admin";
  return (
    <RoleContext.Provider value={{ role, isAdmin, canDelete: isAdmin }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) return { role: "storekeeper", isAdmin: false, canDelete: false };
  return ctx;
}
