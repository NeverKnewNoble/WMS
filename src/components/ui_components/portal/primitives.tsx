import { clsx } from "clsx";

export type StatusTone =
  | "in-stock"
  | "low"
  | "critical"
  | "out"
  | "good"
  | "active"
  | "on-hold"
  | "completed"
  | "watch";

const TONE: Record<StatusTone, string> = {
  "in-stock":
    "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  good: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  active: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  completed: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  low: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  watch: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20",
  "on-hold": "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  critical: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
  out: "bg-zinc-500/10 text-zinc-300 ring-zinc-500/20",
};

export function StatusPill({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ring-1 ring-inset",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/6 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-sky-300/80">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-white/55">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Surface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative rounded-2xl border border-white/8 bg-white/2 backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ToolbarButton({
  children,
  variant = "ghost",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "primary";
}) {
  return (
    <button
      type="button"
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
        variant === "primary"
          ? "bg-white text-zinc-900 shadow-lg shadow-black/30 hover:bg-zinc-100"
          : "border border-white/10 bg-white/4 text-white/80 hover:bg-white/10 hover:text-white",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
      {children}
    </label>
  );
}

export const fieldClass =
  "mt-1.5 w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2.5 text-sm text-white scheme-dark placeholder:text-white/40 focus:border-sky-400/60 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-sky-400/25 disabled:cursor-not-allowed disabled:opacity-50";

export function MonoCell({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[12.5px] tracking-tight text-white/85">
      {children}
    </span>
  );
}
