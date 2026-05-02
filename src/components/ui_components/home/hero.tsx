import Image from "next/image";
import Link from "next/link";

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

      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/55 to-black/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.18),transparent_55%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-start justify-center px-6 py-24 sm:px-10 lg:px-16">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/80 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Warehouse Management System
        </span>

        <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Move stock with{" "}
          <span className="bg-linear-to-r from-sky-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">
            precision
          </span>
          , every shelf, every shift.
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/75 sm:text-xl">
          A single source of truth for your inventory — track stock in and out,
          stay ahead of reorders, and turn warehouse activity into reports your
          team can actually act on.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/auth/login"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/20 transition hover:bg-zinc-100"
          >
            Get started
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
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            See features
          </a>
        </div>

        <dl className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              SKUs tracked
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-white">12k+</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              Stock accuracy
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-white">99.4%</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-white/50">
              Live updates
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-white">24 / 7</dd>
          </div>
        </dl>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/50">
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="block h-8 w-px bg-linear-to-b from-white/60 to-transparent" />
      </div>
    </section>
  );
}
