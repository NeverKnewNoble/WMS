const sections = [
  {
    title: "Product",
    links: ["Stock In", "Stock Out", "Reorder Alerts", "Reports"],
  },
  {
    title: "Company",
    links: ["About", "Customers", "Careers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Changelog", "Support", "Status"],
  },
];

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-white/10 bg-zinc-950 px-6 py-16 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-sky-400 to-emerald-400 text-zinc-950">
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
              <span className="text-lg font-semibold tracking-tight text-white">
                Warehouse MS
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              A single source of truth for your inventory — from the moment
              stock arrives to the moment it ships.
            </p>

            <form className="mt-6 flex max-w-sm items-center gap-2">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
              >
                Subscribe
              </button>
            </form>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/70 transition hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Warehouse MS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition hover:text-white">
              Privacy
            </a>
            <a href="#" className="transition hover:text-white">
              Terms
            </a>
            <a href="#" className="transition hover:text-white">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
