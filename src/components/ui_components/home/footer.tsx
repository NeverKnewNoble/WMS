import { JoshobWordmark } from "@/components/ui_components/wordmark";

const sections = [
  {
    title: "Modules",
    links: ["Stock In · GRN", "Stock Out · MRN", "Reorder Alerts", "Project Reports"],
  },
  {
    title: "Operations",
    links: ["Item Registry", "Storage Locations", "Suppliers", "Departments"],
  },
  {
    title: "Support",
    links: ["Documentation", "Changelog", "Contact IT", "Status"],
  },
];

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-white/10 bg-zinc-950 px-6 py-16 sm:px-10 lg:px-16">
      <div aria-hidden className="bg-hazard pointer-events-none absolute inset-x-0 top-0 h-1 opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(226,107,26,0.08),transparent_55%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <JoshobWordmark size="sm" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/95">
              Internal operations portal for Joshob Construction Co. Ltd. —
              from the moment a delivery hits the gate to the moment a length
              of rebar is cut on site.
            </p>

            <form className="mt-7 flex max-w-sm items-center gap-2">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="you@joshobconstruction.com"
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/85 focus:border-brand-orange/50 focus:outline-none focus:ring-2 focus:ring-brand-orange/25"
              />
              <button
                type="submit"
                className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-orange-deep/30 ring-1 ring-inset ring-white/10 transition hover:bg-brand-orange-bright"
              >
                Subscribe
              </button>
            </form>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-orange">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/65 transition hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/90 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Joshob Construction Co. Ltd. All rights reserved.
          </p>
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
