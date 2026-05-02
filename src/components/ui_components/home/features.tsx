type Feature = {
  title: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    title: "Stock In",
    description:
      "Receive shipments, assign bins, and update quantities the moment goods land at the dock.",
    accent: "from-emerald-400/30 to-emerald-400/0",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M4 21h16" />
      </svg>
    ),
  },
  {
    title: "Stock Out",
    description:
      "Pick, pack, and dispatch with confidence — every outbound movement is logged in real time.",
    accent: "from-sky-400/30 to-sky-400/0",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21V9" />
        <path d="m7 14 5-5 5 5" />
        <path d="M4 3h16" />
      </svg>
    ),
  },
  {
    title: "Reorder Alerts",
    description:
      "Smart thresholds flag low stock before it costs you a sale, so reorders happen on time, not too late.",
    accent: "from-amber-400/30 to-amber-400/0",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    title: "Reports",
    description:
      "Turn raw warehouse activity into clear dashboards — movement, valuation, and trend reports on demand.",
    accent: "from-violet-400/30 to-violet-400/0",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16" />
        <rect x="6" y="11" width="3" height="7" rx="1" />
        <rect x="11" y="6" width="3" height="12" rx="1" />
        <rect x="16" y="9" width="3" height="9" rx="1" />
      </svg>
    ),
  },
  {
    title: "Inventory Audit",
    description:
      "Cycle counts and full audits with variance tracking so the books always match the shelves.",
    accent: "from-rose-400/30 to-rose-400/0",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 12 2 2 4-4" />
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Roles & Access",
    description:
      "Give receivers, pickers, and managers exactly the permissions they need — nothing more, nothing less.",
    accent: "from-cyan-400/30 to-cyan-400/0",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M17 11h5" />
        <path d="M19.5 8.5v5" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative w-full bg-zinc-950 px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-sky-300/80">
              What's inside
            </span>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Everything you need to run the floor.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/60">
              Built around the day-to-day reality of warehouse work — fast
              entries, fewer surprises, and reports your team will actually
              open.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70">
            Six core modules
          </span>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="group relative bg-zinc-950 p-8 transition hover:bg-zinc-900/80"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-linear-to-br ${feature.accent} opacity-0 transition group-hover:opacity-100`}
              />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
                <span className="h-6 w-6">{feature.icon}</span>
              </div>
              <h3 className="relative mt-6 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/60">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
