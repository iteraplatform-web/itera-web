import { cn } from "@/lib/utils/cn";
import { type ButtonHTMLAttributes, forwardRef } from "react";

const variants = {
  /* Primary sits on a subtle vertical gradient with a top highlight so it
     reads as a raised physical control rather than a flat rectangle. */
  primary:
    "bg-gradient-to-b from-itera-500 to-itera-600 text-white shadow-sm shadow-itera-600/25 ring-1 ring-inset ring-white/15 hover:from-itera-600 hover:to-itera-700 active:from-itera-700 active:to-itera-700",
  ink:
    "bg-gradient-to-b from-ink-800 to-ink-950 text-white shadow-sm shadow-ink-950/25 ring-1 ring-inset ring-white/10 hover:from-ink-900 hover:to-ink-950",
  secondary:
    "bg-surface text-ink-700 ring-1 ring-inset ring-hairline-strong shadow-xs hover:bg-canvas hover:text-ink-950",
  ghost: "text-ink-500 hover:bg-ink-100/70 hover:text-ink-950",
  subtle: "bg-ink-100/70 text-ink-700 hover:bg-ink-200/70",
  danger:
    "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm shadow-red-600/25 ring-1 ring-inset ring-white/15 hover:from-red-600 hover:to-red-700",
  success:
    "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-600/25 ring-1 ring-inset ring-white/15 hover:from-emerald-600 hover:to-emerald-700",
} as const;

const sizes = {
  xs: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  sm: "h-9 gap-1.5 rounded-lg px-3.5 text-[14px]",
  md: "h-10 gap-2 rounded-[10px] px-4 text-[15px]",
  lg: "h-12 gap-2 rounded-xl px-6 text-[16px]",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-itera-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

/** Square icon-only button — keeps icon actions from stretching in flex rows. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }
>(({ className, variant = "ghost", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-all duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-itera-500 focus-visible:ring-offset-2",
      "active:scale-95 disabled:pointer-events-none disabled:opacity-40",
      variants[variant],
      className
    )}
    {...props}
  />
));
IconButton.displayName = "IconButton";
