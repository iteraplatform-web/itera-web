import { STATUS_THEME } from "@/lib/utils/status-theme";
import { STATUS_LABELS, type TransactionStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

export function StatusBadge({
  status,
  size = "default",
  className,
}: {
  status: TransactionStatus;
  size?: "sm" | "default";
  className?: string;
}) {
  const theme = STATUS_THEME[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset",
        theme.bg,
        theme.text,
        theme.border.replace("border-", "ring-"),
        size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[13px]",
        className
      )}
    >
      <span className={cn("rounded-full", theme.dot, size === "sm" ? "h-1.5 w-1.5" : "h-[7px] w-[7px]")} />
      {STATUS_LABELS[status]}
    </span>
  );
}
