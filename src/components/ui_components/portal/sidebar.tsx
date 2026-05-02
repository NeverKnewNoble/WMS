"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
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
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const SECTIONS: { heading: string; items: NavItem[] }[] = [
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
        badge: "4",
      },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Projects", href: "/portal/projects", icon: FolderKanban },
      { label: "Maintenance", href: "/portal/maintenance", icon: Wrench },
    ],
  },
  {
    heading: "Insights",
    items: [{ label: "Reports", href: "/portal/reports", icon: BarChart3 }],
  },
];

export default function PortalSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);

  return (
    <aside className="relative flex h-screen w-72 shrink-0 flex-col border-r border-white/6 bg-zinc-950 animate-sidebar-in">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_55%)]" />

      <div className="relative flex items-center gap-3 px-6 pb-6 pt-7">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-sky-400 to-emerald-400 text-zinc-950 shadow-lg shadow-sky-500/20">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7 12 3l9 4v10l-9 4-9-4V7z" />
            <path d="M3 7 12 11l9-4" />
            <path d="M12 11v10" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">
            Warehouse MS
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Operations portal
          </p>
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 pb-6">
        {SECTIONS.map((section) => (
          <div key={section.heading} className="mb-6">
            <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
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
                        : "text-white/55 hover:bg-white/3 hover:text-white",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-linear-to-b from-sky-400 to-emerald-400" />
                    )}
                    <Icon
                      className={clsx(
                        "h-4 w-4 shrink-0 transition",
                        active ? "text-sky-300" : "text-white/40 group-hover:text-white/70",
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
              : "text-white/55 hover:bg-white/3 hover:text-white",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-3 flex items-center gap-3 rounded-lg px-3.5 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-sky-400/30 to-emerald-400/30 text-xs font-semibold text-white">
            LN
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">Luk Noor</p>
            <p className="truncate text-[10px] text-white/40">
              luk.noor@gmail.com
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1.5 text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
