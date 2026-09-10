import { cn } from "@/lib/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  /** Removes the default padding container styling for full-bleed content. */
  flush?: boolean;
}

export function Card({ children, className, onClick, hover, flush }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-hairline bg-surface shadow-sm",
        flush && "overflow-hidden",
        hover &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-hairline px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h3 className={cn("text-[16px] font-semibold text-ink-950", className)}>{children}</h3>;
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

/** A labelled group used to break long forms and panels into scannable bands. */
export function SectionLabel({
  children,
  icon: Icon,
  action,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-ink-500" />}
        <span className="section-title">{children}</span>
      </div>
      {action}
    </div>
  );
}
