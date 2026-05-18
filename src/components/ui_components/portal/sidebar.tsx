"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { clsx } from "clsx";
import { JoshobWordmark } from "@/components/ui_components/wordmark";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageMinus,
  Bell,
  FolderKanban,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
  Truck,
  Building,
  Warehouse,
  Users,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
  adminOnly?: boolean;
}

function buildSections(reorderAlertCount: number): NavSection[] {
  return [
    {
      heading: "Overview",
      items: [{ label: "Dashboard", href: "/portal", icon: LayoutDashboard }],
    },
    {
      heading: "Inventory",
      items: [
        { label: "Item Registry", href: "/portal/inventory", icon: Package },
        { label: "Stock In", href: "/portal/stock-in", icon: PackagePlus },
        { label: "Stock Out", href: "/portal/stock-out", icon: PackageMinus },
        {
          label: "Reorder Alerts",
          href: "/portal/reorder-alerts",
          icon: Bell,
          badge: reorderAlertCount > 0 ? String(reorderAlertCount) : undefined,
        },
      ],
    },
    {
      heading: "Operations",
      adminOnly: true,
      items: [
        { label: "Projects", href: "/portal/projects", icon: FolderKanban },
        { label: "Maintenance", href: "/portal/maintenance", icon: Wrench },
      ],
    },
    {
      heading: "Reference",
      adminOnly: true,
      items: [
        { label: "Suppliers", href: "/portal/suppliers", icon: Truck },
        { label: "Departments", href: "/portal/departments", icon: Building },
        { label: "Storage Locations", href: "/portal/storage-locations", icon: Warehouse },
      ],
    },
    {
      heading: "Insights",
      adminOnly: true,
      items: [{ label: "Reports", href: "/portal/reports", icon: BarChart3 }],
    },
    {
      heading: "Administration",
      adminOnly: true,
      items: [{ label: "Users", href: "/portal/users", icon: Users }],
    },
  ];
}

export type SidebarUser = {
  name: string;
  email: string;
  initials: string;
  role: string;
};

export default function PortalSidebar({
  user,
  reorderAlertCount = 0,
}: {
  user: SidebarUser;
  reorderAlertCount?: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = buildSections(reorderAlertCount);

  const isActive = (href: string) =>
    href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);

  // Close drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open on mobile.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isAdmin = user.role === "admin";
  const visibleSections = sections.filter((s) => !s.adminOnly || isAdmin);

  const navBody = (
    <>
      <div className="relative flex flex-col gap-3 px-6 pb-6 pt-7">
        <Link
          href="/portal"
          aria-label="Joshob Construction Co. Ltd."
          className="group inline-flex w-fit"
        >
          <JoshobWordmark size="sm" />
        </Link>
        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/85">
          Operations portal
        </p>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 pb-6">
        {visibleSections.map((section) => (
          <div key={section.heading} className="mb-6">
            <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85">
              {section.heading}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ label, href, icon: Icon, badge }, i) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{ animationDelay: `${i * 35}ms` }}
                    className={clsx(
                      "group relative flex items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium transition-all animate-nav-item-in",
                      active
                        ? "bg-white/6 text-white"
                        : "text-white/90 hover:bg-white/3 hover:text-white",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand-orange shadow-[0_0_12px_rgba(226,107,26,0.7)]" />
                    )}
                    <Icon
                      className={clsx(
                        "h-4 w-4 shrink-0 transition",
                        active ? "text-brand-orange" : "text-white/85 group-hover:text-white/85",
                      )}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {badge && (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/30">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-white/6 px-3 py-4">
        <Link
          href="/portal/settings"
          className={clsx(
            "flex items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium transition",
            isActive("/portal/settings")
              ? "bg-white/6 text-white"
              : "text-white/90 hover:bg-white/3 hover:text-white",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-3 flex items-center gap-3 rounded-lg px-3.5 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange/20 text-xs font-semibold text-brand-orange-bright ring-1 ring-inset ring-brand-orange/30">
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-[10px] text-white/85">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="rounded-md p-1.5 text-white/85 transition hover:bg-white/5 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile topbar (visible < lg) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/6 bg-zinc-950/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/portal" aria-label="Joshob Construction Co. Ltd." className="inline-flex">
          <JoshobWordmark size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/90 transition hover:bg-white/10 hover:text-white"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      </header>

      {/* Desktop sidebar (lg+) */}
      <aside className="relative hidden h-screen w-72 shrink-0 flex-col border-r border-white/6 bg-zinc-950 animate-sidebar-in lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(226,107,26,0.10),transparent_55%)]" />
        {navBody}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />
          <aside className="relative ml-auto flex h-full w-[min(20rem,85vw)] flex-col border-l border-white/6 bg-zinc-950 shadow-2xl animate-sidebar-in">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(226,107,26,0.10),transparent_55%)]" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            {navBody}
          </aside>
        </div>
      )}
    </>
  );
}
