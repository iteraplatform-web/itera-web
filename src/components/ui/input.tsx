import { cn } from "@/lib/utils/cn";
import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

const fieldStyles =
  "block w-full rounded-xl border-0 bg-surface px-3.5 py-2.5 text-sm text-ink-950 shadow-xs " +
  "ring-1 ring-inset ring-hairline-strong transition-shadow placeholder:text-ink-400 " +
  "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-itera-500 " +
  "disabled:cursor-not-allowed disabled:bg-canvas-deep disabled:text-ink-500";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Renders inside the field on the left — an icon or a currency symbol. */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leading, trailing, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[14px] font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-500">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            fieldStyles,
            leading && "pl-8",
            trailing && "pr-10",
            error && "ring-red-400 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {trailing && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-500">
            {trailing}
          </span>
        )}
      </div>
      {hint && !error && <p className="text-xs text-ink-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[14px] font-medium text-ink-700">
          {label}
        </label>
      )}
      <textarea ref={ref} id={id} className={cn(fieldStyles, "resize-y leading-relaxed", className)} {...props} />
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(
  ({ className, label, id, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[14px] font-medium text-ink-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(fieldStyles, "cursor-pointer appearance-none bg-no-repeat pr-9", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%238492a9' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.6' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
          backgroundPosition: "right 0.6rem center",
          backgroundSize: "1.1em 1.1em",
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
);
Select.displayName = "Select";
