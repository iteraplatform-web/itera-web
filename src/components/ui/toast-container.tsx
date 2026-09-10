"use client";

import { AlertTriangle, CheckCircle2, Info, X, Clock } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/toast-store";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  deadline: Clock,
};

/** Each toast carries a colored accent rail on its left edge. */
const ACCENTS: Record<ToastType, { rail: string; icon: string }> = {
  success: { rail: "bg-emerald-500", icon: "text-emerald-600" },
  error: { rail: "bg-red-500", icon: "text-red-600" },
  warning: { rail: "bg-amber-500", icon: "text-amber-600" },
  info: { rail: "bg-itera-500", icon: "text-itera-600" },
  deadline: { rail: "bg-red-500", icon: "text-red-600" },
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[100] flex w-full max-w-[380px] flex-col gap-2.5 p-4">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        const accent = ACCENTS[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto relative flex animate-slide-in items-start gap-3 overflow-hidden",
              "rounded-xl bg-surface/95 py-3.5 pl-4 pr-3 shadow-lg ring-1 ring-ink-950/[0.07] backdrop-blur-sm"
            )}
          >
            <span className={cn("absolute inset-y-0 left-0 w-[3px]", accent.rail)} />
            <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", accent.icon)} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-ink-950">{t.title}</p>
              {t.message && <p className="mt-0.5 text-[14px] leading-snug text-ink-500">{t.message}</p>}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="-mt-0.5 shrink-0 rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
