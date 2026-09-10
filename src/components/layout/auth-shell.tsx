import Link from "next/link";
import { IteraLogo } from "@/components/marketing/logo";

/**
 * Shared frame for sign-in, sign-up, and onboarding: a quiet form column on the
 * left, a dark panel carrying the product story on the right.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  aside,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Form column */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <Link href="/" className="inline-flex w-fit">
          <IteraLogo />
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px]">
            {eyebrow && <span className="section-title">{eyebrow}</span>}
            <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.03em] text-ink-950">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{subtitle}</p>
            )}
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </div>
      </div>

      {/* Story column */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <div className="bg-dots absolute inset-0 opacity-60" />
        <div
          className="pointer-events-none absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(47,82,224,0.35), transparent)" }}
        />
        <div className="relative flex h-full items-center justify-center p-12">
          {aside}
        </div>
      </div>
    </div>
  );
}

/** The default right-hand panel: a short pitch plus proof points. */
export function AuthAside({
  quote,
  points,
}: {
  quote: string;
  points: { label: string; value: string }[];
}) {
  return (
    <div className="max-w-sm text-white">
      <p className="text-display text-[26px] leading-snug text-white/95">{quote}</p>
      <dl className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/10">
        {points.map((p) => (
          <div key={p.label} className="bg-ink-950/60 px-3 py-4 text-center backdrop-blur-sm">
            <dt className="tnum text-[20px] font-bold text-white">{p.value}</dt>
            <dd className="mt-1 text-[13px] leading-tight text-ink-300">{p.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
