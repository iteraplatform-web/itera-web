import { cn } from "@/lib/utils/cn";

/**
 * The mark is a stack of three offset bars — a checklist assembling itself,
 * which is the product's core idea in one shape.
 */
export function IteraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={cn("h-7 w-7", className)} aria-hidden>
      <rect width="28" height="28" rx="8" className="fill-ink-950" />
      <rect x="7" y="8" width="14" height="2.6" rx="1.3" className="fill-white/35" />
      <rect x="7" y="12.7" width="10" height="2.6" rx="1.3" className="fill-white/60" />
      <rect x="7" y="17.4" width="6" height="2.6" rx="1.3" className="fill-itera-400" />
    </svg>
  );
}

export function IteraLogo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <IteraMark className={markClassName} />
      <span
        className={cn(
          "text-[19px] font-bold tracking-[-0.04em] text-ink-950",
          wordClassName
        )}
      >
        ITERA
      </span>
    </span>
  );
}
