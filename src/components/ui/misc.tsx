import { cn } from "@/lib/utils/cn";

/** Initials avatar — deterministic color from the name so it stays stable. */
const AVATAR_TONES = [
  "bg-itera-100 text-itera-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
];

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];

  const sizes = {
    xs: "h-6 w-6 text-[12px]",
    sm: "h-8 w-8 text-[13px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-inset ring-ink-950/5",
        tone,
        sizes[size],
        className
      )}
    >
      {initials || "?"}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline-strong bg-canvas/60 px-6 py-14 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface shadow-xs ring-1 ring-hairline">
          <Icon className="h-5 w-5 text-ink-400" />
        </div>
      )}
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[14px] text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Segmented control — the dashboard view switcher and similar 2-4 way toggles. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: React.ElementType }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl bg-ink-100/80 p-1 ring-1 ring-inset ring-ink-950/[0.03]",
        className
      )}
    >
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all duration-150",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[14px]",
              active
                ? "bg-surface text-ink-950 shadow-xs ring-1 ring-ink-950/5"
                : "text-ink-500 hover:text-ink-800"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Small key/value row used across financials, detail panels and previews. */
export function DataRow({
  label,
  value,
  className,
  emphasis,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5", className)}>
      <span className={cn("text-[14px]", emphasis ? "font-semibold text-ink-900" : "text-ink-500")}>
        {label}
      </span>
      <span
        className={cn(
          "tnum text-right",
          emphasis ? "text-base font-bold text-ink-950" : "text-[14px] font-semibold text-ink-800"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Thin horizontal rule with an optional centered label. */
export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) return <div className={cn("h-px w-full bg-hairline", className)} />;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-px flex-1 bg-hairline" />
      <span className="section-title">{label}</span>
      <div className="h-px flex-1 bg-hairline" />
    </div>
  );
}
