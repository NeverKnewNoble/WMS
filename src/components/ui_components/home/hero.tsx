import Image from "next/image";
import Link from "next/link";
import { JoshobWordmark } from "@/components/ui_components/wordmark";

export default function Hero() {
  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden">
      <Image
        src="/ally.jpg"
        alt=""
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />

      {/* Site-yard atmosphere: dark base, warm orange light, vignette top/bottom. */}
      <div className="absolute inset-0 bg-linear-to-b from-zinc-950/85 via-zinc-950/65 to-zinc-950/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(226,107,26,0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(176,82,16,0.18),transparent_55%)]" />

      {/* Decorative hazard accents — diagonal tape strokes in the corners. */}
      <div
        aria-hidden
        className="bg-hazard pointer-events-none absolute -right-10 top-24 h-2 w-72 rotate-[-6deg] opacity-80 shadow-[0_8px_28px_rgba(226,107,26,0.35)]"
      />
      <div
        aria-hidden
        className="bg-hazard pointer-events-none absolute -left-12 bottom-32 h-2 w-64 rotate-[6deg] opacity-70"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-20 pt-12 sm:px-10 lg:px-16 lg:pt-16">
        {/* Top row: wordmark + portal nav. */}
        <header className="flex items-start justify-between gap-6">
          <Link href="/" aria-label="Joshob Construction Co. Ltd." className="inline-flex">
            <JoshobWordmark size="sm" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 sm:flex">
            <a href="#features" className="transition hover:text-white">
              Capabilities
            </a>
            <Link
              href="/auth/login"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur transition hover:border-brand-orange/40 hover:text-white"
            >
              Sign in
            </Link>
          </nav>
        </header>

        {/* Hero body — pinned to lower half so the wordmark + breathing room read first. */}
        <div className="mt-auto flex flex-col items-start">
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-orange backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange shadow-[0_0_10px_rgba(255,122,46,0.9)]" />
            Operations portal · v1
          </span>

          <h1 className="max-w-5xl text-balance font-mark text-5xl leading-[0.95] tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl xl:text-[88px]">
            Materials, accounted for.
            <br />
            <span className="text-brand-orange">Sites, in sync.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-white/70 sm:text-xl">
            One source of truth for every bag of cement, every length of rebar,
            every tool that leaves the yard — across every Joshob Construction
            site.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/auth/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-brand-orange px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-orange-deep/40 ring-1 ring-inset ring-white/15 transition hover:bg-brand-orange-bright"
            >
              Enter the portal
              <svg
                className="h-4 w-4 transition group-hover:translate-x-0.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-brand-orange/40 hover:bg-white/10"
            >
              See what's inside
            </a>
          </div>

          {/* Stats row — separated by hazard tape, anchored at the bottom of the viewport. */}
          <div className="mt-16 w-full max-w-4xl">
            <div aria-hidden className="bg-hazard mb-6 h-1 w-full rounded-[1px] opacity-80" />
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              <Stat label="Active sites"     value="14" />
              <Stat label="SKUs catalogued"  value="2.4k" />
              <Stat label="GRNs this month"  value="318" />
              <Stat label="Stock accuracy"   value="99.2%" />
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {label}
      </dt>
      <dd className="mt-1.5 font-mark text-3xl tracking-tight text-white sm:text-4xl">
        {value}
      </dd>
    </div>
  );
}
