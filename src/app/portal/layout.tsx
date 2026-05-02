import type { Metadata } from "next";
import PortalSidebar from "@/components/ui_components/portal/sidebar";

export const metadata: Metadata = {
  title: "Warehouse MS — Portal",
  description: "Warehouse management portal",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans text-white">
      <PortalSidebar />

      <main className="relative flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.07),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.05),transparent_50%)]" />
        <div className="relative">{children}</div>
      </main>
    </div>
  );
}
