import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variants;
  size?: "xs" | "sm";
  dot?: boolean;
}

const variants = {
  default: "bg-itera-50 text-itera-700 ring-itera-200/70",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  amber: "bg-amber-50 text-amber-700 ring-amber-200/70",
  red: "bg-red-50 text-red-700 ring-red-200/70",
  gray: "bg-ink-100 text-ink-600 ring-ink-200/70",
  purple: "bg-ink-100 text-ink-700 ring-ink-200/70",
  ink: "bg-ink-950 text-white ring-transparent",
} as const;

const dots = {
  default: "bg-itera-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-ink-400",
  purple: "bg-ink-500",
  ink: "bg-white",
} as const;

export function Badge({ children, className, variant = "default", size = "sm", dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset",
        size === "xs" ? "px-1.5 py-0.5 text-[12px]" : "px-2.5 py-0.5 text-[13px]",
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dots[variant])} />}
      {children}
    </span>
  );
}
