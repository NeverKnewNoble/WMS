import type { Metadata } from "next";
import PortalSidebar from "@/components/ui_components/portal/sidebar";
import { RoleProvider } from "@/components/providers/role-provider";
import { getSessionUserOrRedirect, initialsFor } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Joshob Construction — Portal",
  description: "Operations portal for Joshob Construction Co. Ltd.",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUserOrRedirect();

  const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM v_reorder_alerts
  `;
  const reorderAlertCount = Number(count);

  return (
    <div className="flex h-screen flex-col bg-zinc-950 font-sans text-white lg:flex-row lg:overflow-hidden">
      <PortalSidebar
        user={{
          name: user.name,
          email: user.email,
          initials: initialsFor(user.name || user.email),
          role: user.role,
        }}
        reorderAlertCount={reorderAlertCount}
      />

      <main className="relative flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(226,107,26,0.09),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,122,46,0.04),transparent_55%)]" />
        <div className="relative">
          <RoleProvider role={user.role}>{children}</RoleProvider>
        </div>
      </main>
    </div>
  );
}
