import { Camera } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Shown until a file has a photo. Deliberately plain — a quiet grey surface,
 * a thin architectural outline, and a clear note — so it reads as "no photo
 * yet" rather than pretending to be the property.
 */
export function PropertyPlaceholder({
  variant = "listing",
  className,
  showLabel = true,
}: {
  seed?: string;
  variant?: "listing" | "buying";
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <div className={cn("relative flex h-full w-full items-center justify-center bg-gradient-to-b from-ink-100 to-ink-50", className)}>
      <svg viewBox="0 0 200 120" className="h-[46%] w-auto text-ink-300" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
        {variant === "listing" ? (
          <>
            <path d="M40 60 L100 22 L160 60" />
            <path d="M52 52 V100 H148 V52" />
            <path d="M88 100 V74 H112 V100" />
            <rect x="62" y="64" width="16" height="14" />
            <rect x="122" y="64" width="16" height="14" />
            <path d="M126 36 V26 H136 V43" />
            <path d="M20 100 H180" />
          </>
        ) : (
          <>
            <path d="M30 72 L55 54 L80 72 M36 68 V100 H74 V68" />
            <path d="M120 72 L145 54 L170 72 M126 68 V100 H164 V68" />
            <path d="M75 62 L100 40 L125 62 M82 58 V100 H118 V58" />
            <circle cx="100" cy="22" r="7" />
            <path d="M100 29 V36" />
            <path d="M15 100 H185" />
          </>
        )}
      </svg>
      {showLabel && (
        <span className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-ink-500">
          <Camera className="h-3.5 w-3.5" />
          No photos yet
        </span>
      )}
    </div>
  );
}
