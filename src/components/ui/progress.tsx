import { cn } from "@/lib/utils/cn";

export function Progress({
  value,
  className,
  barClassName,
  size = "md",
}: {
  /** 0-100 */
  value: number;
  className?: string;
  barClassName?: string;
  size?: "xs" | "sm" | "md";
}) {
  const heights = { xs: "h-1", sm: "h-1.5", md: "h-2" };
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-ink-100", heights[size], className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-itera-500 to-itera-600 transition-[width] duration-700 ease-out",
          barClassName
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/** Circular progress used on file cards where horizontal room is tight. */
export function ProgressRing({
  value,
  size = 40,
  strokeWidth = 3.5,
  className,
  trackClassName = "text-ink-100",
  barClassName = "text-itera-600",
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-700 ease-out", barClassName)}
          stroke="currentColor"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
