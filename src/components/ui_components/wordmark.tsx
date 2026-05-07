import { clsx } from "clsx";

// Joshob Construction Co. Ltd. — typographic wordmark.
//
// Three pieces, stacked or inline:
//   1. JOSHOB        — Archivo Black, heavy industrial sans, near-white
//   2. hazard tape   — orange/black stripe divider (the brand's signature)
//   3. CONSTRUCTION LIMITED — orange caps with wide tracking
//
// The stacked form is the canonical mark. The inline form is for places
// where vertical room is tight (footer, header bars).

type WordmarkProps = {
  variant?: "stacked" | "inline";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Hide the hazard-stripe divider on stacked. Useful in dense UI. */
  showStripe?: boolean;
};

const STACKED_SIZES: Record<
  NonNullable<WordmarkProps["size"]>,
  { name: string; tag: string; gap: string; stripeH: string }
> = {
  xs: { name: "text-base",  tag: "text-[8px]  tracking-[0.32em]", gap: "mt-1 mb-1",     stripeH: "h-[2px]" },
  sm: { name: "text-xl",    tag: "text-[9px]  tracking-[0.32em]", gap: "mt-1.5 mb-1.5", stripeH: "h-[2px]" },
  md: { name: "text-3xl",   tag: "text-[11px] tracking-[0.34em]", gap: "mt-2 mb-2",     stripeH: "h-[3px]" },
  lg: { name: "text-5xl",   tag: "text-[13px] tracking-[0.36em]", gap: "mt-3 mb-2.5",   stripeH: "h-[4px]" },
  xl: { name: "text-7xl",   tag: "text-base   tracking-[0.4em]",  gap: "mt-4 mb-3",     stripeH: "h-[6px]" },
};

export function JoshobWordmark({
  variant = "stacked",
  size = "md",
  className,
  showStripe = true,
}: WordmarkProps) {
  if (variant === "inline") {
    return (
      <span className={clsx("inline-flex items-center gap-2.5 leading-none", className)}>
        <span className="font-mark text-lg tracking-tight text-white">JOSHOB</span>
        <span aria-hidden className="h-3.5 w-px bg-brand-orange/70" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-orange">
          Construction Ltd.
        </span>
      </span>
    );
  }

  const s = STACKED_SIZES[size];

  return (
    <span className={clsx("inline-flex flex-col items-start leading-none", className)}>
      <span className={clsx("font-mark tracking-[-0.015em] text-white", s.name)}>
        JOSHOB
      </span>
      {showStripe && (
        <span
          aria-hidden
          className={clsx(
            "bg-hazard w-full rounded-[1px] shadow-[0_2px_14px_rgba(226,107,26,0.35)]",
            s.gap,
            s.stripeH,
          )}
        />
      )}
      <span
        className={clsx(
          "font-semibold uppercase text-brand-orange",
          s.tag,
          !showStripe && "mt-2",
        )}
      >
        Construction Limited
      </span>
    </span>
  );
}
