import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Clock,
  Eye,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IteraLogo, IteraMark } from "@/components/marketing/logo";
import { DEMO_CREDENTIALS } from "@/types";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-hairline/70 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <IteraLogo />
          <div className="flex items-center gap-2">
            <Link href="/client">
              <Button variant="ghost" size="sm">
                Client view
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-70" />
          <div
            className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(47,82,224,0.16), transparent)",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-600 shadow-xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Interactive demonstration — no sign-up required
              </span>

              <h1 className="mt-7 text-[42px] font-bold leading-[1.05] tracking-[-0.035em] text-ink-950 sm:text-[60px]">
                Transaction management
                <br />
                that{" "}
                <span className="text-display italic text-itera-600">builds itself</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-500">
                Every listing and every buyer relationship becomes a living
                checklist — the right tasks, in the right order, with the
                deadlines already tracked and the client already informed.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" variant="ink" className="w-full sm:w-auto">
                    Continue as an agent
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/client" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    <Eye className="h-4 w-4" />
                    See the client side
                  </Button>
                </Link>
              </div>

              <p className="mt-5 text-[14px] text-ink-500">
                Or sign in with{" "}
                <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[13px] font-medium text-ink-700">
                  {DEMO_CREDENTIALS.email}
                </span>{" "}
                /{" "}
                <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[13px] font-medium text-ink-700">
                  {DEMO_CREDENTIALS.password}
                </span>
              </p>
            </div>

            {/* Product preview */}
            <div className="relative mx-auto mt-16 max-w-4xl">
              <div className="absolute -inset-x-8 -bottom-6 top-8 rounded-[28px] bg-ink-950/[0.06] blur-2xl" />
              <AppPreview />
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────── */}
        <section className="border-t border-hairline bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-2xl">
              <span className="section-title">How it works</span>
              <h2 className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.03em] text-ink-950">
                Four questions in. A complete transaction plan out.
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-500">
                ITERA keeps a defined library of tasks, documents, and rules for
                every kind of transaction. Answer a handful of guided questions
                and it assembles only the parts that apply to this deal — nothing
                built by hand, nothing irrelevant included.
              </p>
            </div>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="bg-surface p-6">
                  <span className="tnum text-[14px] font-bold text-itera-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-[16px] font-semibold text-ink-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Capabilities ──────────────────────────────────────── */}
        <section className="border-t border-hairline">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <span className="section-title">Built for the work</span>
                <h2 className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.03em] text-ink-950">
                  The parts agents actually lose deals over.
                </h2>
                <p className="mt-4 text-[16px] leading-relaxed text-ink-500">
                  Missed deadlines, paperwork that never arrived, and clients
                  who call because they have no idea what is happening. Each one
                  has a place in the product rather than a place in someone&apos;s
                  memory.
                </p>
                <Link href="/signup" className="mt-7 inline-block">
                  <Button variant="ink">
                    Open the dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <FeatureCard key={f.title} {...f} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Two sides ─────────────────────────────────────────── */}
        <section className="border-t border-hairline bg-ink-950 text-white">
          <div className="bg-dots mx-auto max-w-6xl px-6 py-20">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-itera-300">
                  Two sides, one truth
                </span>
                <h2 className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.03em]">
                  The client sees outcomes.
                  <br />
                  You keep the process.
                </h2>
                <p className="mt-5 text-[16px] leading-relaxed text-ink-200">
                  Clients get a simple timeline, one clear statement of what is
                  needed from them, and a direct line to their agent. No task
                  list, no document vault, no internal notes.
                </p>
                <p className="mt-4 text-[16px] leading-relaxed text-ink-200">
                  Open both views side by side in this demonstration — complete a
                  task on the agent side and watch the client side update.
                </p>
                <Link href="/client" className="mt-7 inline-block">
                  <Button variant="secondary">
                    <Eye className="h-4 w-4" />
                    Open the client view
                  </Button>
                </Link>
              </div>

              <div className="flex justify-center">
                <ClientPreview />
              </div>
            </div>
          </div>
        </section>

        {/* ── Colour legend ─────────────────────────────────────── */}
        <section className="border-t border-hairline bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-sm">
                <span className="section-title">One colour system</span>
                <h2 className="mt-3 text-[22px] font-bold tracking-[-0.02em] text-ink-950">
                  A colour never means two things.
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
                  The same four colours carry the same meaning on every screen,
                  so nothing has to be explained twice.
                </p>
              </div>
              <dl className="grid flex-1 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:max-w-md">
                {LEGEND.map((l) => (
                  <div key={l.label} className="flex items-center gap-3 bg-surface px-4 py-3">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${l.dot}`} />
                    <dt className="w-16 shrink-0 text-[14px] font-semibold text-ink-900">
                      {l.label}
                    </dt>
                    <dd className="text-[14px] text-ink-500">{l.meaning}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <IteraMark className="h-6 w-6" />
            <span className="text-[14px] text-ink-500">
              ITERA — transaction management for real estate agents
            </span>
          </div>
          <p className="text-[13px] text-ink-500">
            Demonstration build. No data leaves this browser.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    title: "A file is opened",
    body: "An address and a client name — thirty seconds if that is all the time there is.",
  },
  {
    title: "Guided questions",
    body: "Referral? Relocation? Built before 1978? Eight questions that change what comes next.",
  },
  {
    title: "The checklist assembles",
    body: "Only the tasks that apply, ordered so nothing can start before its prerequisite.",
  },
  {
    title: "It stays current",
    body: "Deadlines surface on their own, and the client sees progress without asking.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Self-building checklists",
    body: "A referral adds the referral agreement. A pre-1978 property adds the lead paint disclosure. Every added task says why it is there.",
  },
  {
    icon: Lock,
    title: "Enforced task order",
    body: "The closing data sheet cannot be marked ready until earnest money is confirmed. Dependent work stays locked until its prerequisite clears.",
  },
  {
    icon: Clock,
    title: "Deadlines that surface themselves",
    body: "One banner shows the single most urgent item across the whole portfolio — not whatever was touched last.",
  },
  {
    icon: Layers,
    title: "Three views of one portfolio",
    body: "Cards, a Kanban board, and a calendar. Same data, one click apart, whichever way you think.",
  },
  {
    icon: ShieldCheck,
    title: "Documents you can see through",
    body: "Grouped by category, each one marked received or still needed, in the file-naming pattern already in use.",
  },
  {
    icon: CheckCircle2,
    title: "A full activity record",
    body: "Every task completed, every status change, every document received — who did it and when.",
  },
];

const LEGEND = [
  { label: "Green", dot: "bg-emerald-500", meaning: "On track, complete, or received" },
  { label: "Amber", dot: "bg-amber-500", meaning: "Pending or in progress" },
  { label: "Red", dot: "bg-red-500", meaning: "Needs attention now" },
  { label: "Gray", dot: "bg-ink-400", meaning: "Not yet started, or informational" },
];

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-xs transition-shadow hover:shadow-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-itera-50 ring-1 ring-inset ring-itera-100">
        <Icon className="h-[18px] w-[18px] text-itera-600" />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-ink-950">{title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">{body}</p>
    </div>
  );
}

/** A static, stylised rendering of the dashboard — sets expectations before the click. */
function AppPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-hairline bg-canvas px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
        <div className="ml-3 flex-1 rounded-md bg-surface px-3 py-1 text-[13px] text-ink-500 ring-1 ring-hairline">
          itera.app/dashboard
        </div>
      </div>

      <div className="p-5">
        {/* Urgent banner */}
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
            <Clock className="h-4 w-4 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold uppercase tracking-wide text-red-700">
              Most urgent across portfolio
            </p>
            <p className="text-[14px] font-semibold text-ink-950">
              Prepare Closing Data Sheet
            </p>
          </div>
          <span className="tnum rounded-full bg-red-100 px-2.5 py-1 text-[13px] font-bold text-red-800">
            3d left
          </span>
        </div>

        {/* Stat row */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[
            { label: "Open files", value: "6" },
            { label: "Closing this month", value: "1" },
            { label: "Overdue", value: "0" },
            { label: "Pipeline", value: "$3.3M" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-hairline bg-canvas px-3 py-2.5">
              <p className="text-[12px] font-medium uppercase tracking-wide text-ink-500">
                {s.label}
              </p>
              <p className="tnum mt-0.5 text-[17px] font-bold text-ink-950">{s.value}</p>
            </div>
          ))}
        </div>

        {/* File cards */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { addr: "729 Maple Court", status: "Under Contract", tone: "amber", pct: 74, price: "$489,000" },
            { addr: "1842 Oakwood Drive", status: "Listed", tone: "emerald", pct: 41, price: "$625,000" },
          ].map((f) => (
            <div key={f.addr} className="rounded-xl border border-hairline bg-surface p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-semibold text-ink-950">{f.addr}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                    f.tone === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {f.status}
                </span>
              </div>
              <p className="tnum mt-1 text-[13px] text-ink-500">{f.price}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-itera-500"
                  style={{ width: `${f.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Phone-framed client view, mirroring what /client actually renders. */
function ClientPreview() {
  return (
    <div className="relative w-[268px] rounded-[2.2rem] border-[7px] border-ink-800 bg-ink-800 shadow-xl">
      <div className="overflow-hidden rounded-[1.7rem] bg-canvas">
        <div className="relative bg-surface px-5 pb-5 pt-7 text-center">
          <span className="absolute left-1/2 top-2 h-1 w-14 -translate-x-1/2 rounded-full bg-ink-200" />
          <p className="text-[14px] font-semibold text-ink-950">729 Maple Court</p>
          <p className="text-[13px] text-ink-500">Your transaction</p>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="rounded-xl bg-surface p-4 shadow-xs">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
              Progress
            </p>
            <div className="mt-3 space-y-2.5">
              {[
                { label: "Listed", state: "done" },
                { label: "Offer Accepted", state: "done" },
                { label: "Under Contract", state: "current" },
                { label: "Closing", state: "upcoming" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                      s.state === "done"
                        ? "bg-emerald-500 text-white"
                        : s.state === "current"
                        ? "bg-itera-600 text-white ring-4 ring-itera-100"
                        : "bg-ink-200"
                    }`}
                  >
                    {s.state === "done" ? "✓" : ""}
                  </span>
                  <span
                    className={`text-[13px] font-medium ${
                      s.state === "upcoming" ? "text-ink-400" : "text-ink-800"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 px-3.5 py-3 ring-1 ring-inset ring-amber-200/70">
            <p className="text-[12px] font-bold uppercase tracking-wide text-amber-700">
              Needed from you
            </p>
            <p className="mt-1 text-[13px] leading-snug text-amber-900">
              Nothing right now — we&apos;ll reach out before the walkthrough.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
