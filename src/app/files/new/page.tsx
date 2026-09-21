"use client";

import { useState, Suspense, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  Home,
  Lock,
  Search,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CallNotesAssist } from "@/components/intake/call-notes-assist";
import { BuildProgress } from "@/components/intake/build-progress";
import { useTransactionsStore } from "@/stores";
import { generateChecklist, generateDocuments } from "@/lib/checklist/engine";
import { PHASE_LABELS, type IntakeAnswers, type TransactionSide } from "@/types";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { id: 1, label: "Client", icon: User },
  { id: 2, label: "Transaction", icon: Home },
  { id: 3, label: "Detail", icon: FileText },
  { id: 4, label: "Review", icon: ClipboardList },
];

export default function NewFilePage() {
  return (
    <AuthGuard>
      <Suspense>
        <NewFileContent />
      </Suspense>
    </AuthGuard>
  );
}

function NewFileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isQuickLead = !searchParams.get("full");
  /** When set, this intake completes an existing quick lead rather than creating one. */
  const completingId = searchParams.get("complete");

  const files = useTransactionsStore((s) => s.files);
  const createFile = useTransactionsStore((s) => s.createFile);
  const createQuickLead = useTransactionsStore((s) => s.createQuickLead);
  const completeIntake = useTransactionsStore((s) => s.completeIntake);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<IntakeAnswers>>({
    side: "listing",
    isReferral: false,
    isRelocation: false,
    builtBefore1978: false,
  });

  // Prefill from the quick lead being completed.
  useEffect(() => {
    if (!completingId) return;
    const existing = files.find((f) => f.id === completingId);
    if (!existing) return;
    setForm((prev) => ({
      ...prev,
      clientName: existing.clientName,
      phone: existing.phone,
      email: existing.email || undefined,
    }));
  }, [completingId, files]);

  const update = (field: keyof IntakeAnswers, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const applyExtracted = (values: Partial<IntakeAnswers>) =>
    setForm((prev) => ({ ...prev, ...values }));

  /* The answers as they stand, used for both preview and submission. */
  const answers: IntakeAnswers = useMemo(
    () => ({
      clientName: form.clientName ?? "",
      phone: form.phone ?? "",
      email: form.email ?? "",
      side: (form.side ?? "listing") as TransactionSide,
      propertyAddress: form.propertyAddress ?? "",
      isReferral: form.isReferral ?? false,
      isRelocation: form.isRelocation ?? false,
      builtBefore1978: form.side === "listing" ? form.builtBefore1978 : undefined,
      referralSource: form.isReferral ? form.referralSource : undefined,
      referralPercentage: form.isReferral ? form.referralPercentage : undefined,
      leadSource: form.leadSource,
      coClientName: form.coClientName,
      coClientContact: form.coClientContact,
      websiteOrSocial: form.websiteOrSocial,
      petNames: form.petNames,
      preferredContact: form.preferredContact,
      preferredContactTime: form.preferredContactTime,
    }),
    [form]
  );

  const preview = useMemo(() => {
    if (step !== 4 || !answers.clientName) return { tasks: [], docs: [] };
    return { tasks: generateChecklist(answers), docs: generateDocuments(answers) };
  }, [step, answers]);

  const conditionalTasks = preview.tasks.filter((t) => t.addedBecause);

  const [building, setBuilding] = useState(false);

  const buildSteps = useMemo(() => {
    const tasks = preview.tasks;
    const conditional = tasks.filter((t) => t.addedBecause);
    const withDeps = tasks.filter((t) => t.dependsOn.length > 0).length;
    const steps = tasks.reduce((n, t) => n + t.subtasks.length, 0);
    return [
      { label: "Reading your answers", detail: `${answers.side === "listing" ? "Listing" : "Buyer"} file for ${answers.clientName}` },
      { label: "Choosing the tasks that apply", detail: `${tasks.length} tasks, ${steps} individual steps` },
      {
        label: "Adding tasks for this situation",
        detail: conditional.length ? conditional.map((t) => t.title).join(", ") : "No special cases on this file",
      },
      { label: "Putting tasks in order", detail: `${withDeps} tasks wait on an earlier one` },
      { label: "Setting deadlines", detail: "Each task dated from today" },
      { label: "Listing the paperwork you'll need", detail: `${preview.docs.length} documents to collect` },
    ];
  }, [preview, answers.side, answers.clientName]);

  const finishBuild = () => {
    if (completingId) {
      completeIntake(completingId, answers);
      router.push(`/files/${completingId}?welcome=1`);
      return;
    }
    const id = createFile(answers);
    router.push(`/files/${id}?welcome=1`);
  };

  const handleSubmit = () => setBuilding(true);

  const canProceed = () => {
    if (step === 1) return Boolean(form.clientName && form.phone && form.email);
    if (step === 2) return Boolean(form.propertyAddress);
    return true;
  };

  if (isQuickLead) {
    return <QuickLeadForm onCreate={createQuickLead} />;
  }

  return (
    <AppShell crumbs={[{ label: "Home", href: "/dashboard" }, { label: completingId ? "Complete intake" : "New file" }]}>
      {building && <BuildProgress steps={buildSteps} onDone={finishBuild} />}
      <div className="mx-auto max-w-3xl">
        <Link
          href={completingId ? `/files/${completingId}` : "/dashboard"}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {completingId ? "Back to the file" : "Back to the dashboard"}
        </Link>

        <div className="mt-4 text-center">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-ink-950">
            {completingId ? "Complete the intake" : "New listing or buyer file"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-500">
            Eight guided questions. The checklist assembles itself around the answers.
          </p>
        </div>

        {/* ── Step rail ─────────────────────────────────────────── */}
        <div className="mt-7 flex items-center justify-center">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id >= step}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-bold transition-all",
                    step > s.id && "bg-emerald-500 text-white",
                    step === s.id && "bg-ink-950 text-white ring-4 ring-ink-950/10",
                    step < s.id && "bg-ink-100 text-ink-400"
                  )}
                >
                  {step > s.id ? <Check className="h-4 w-4" strokeWidth={3} /> : <s.icon className="h-4 w-4" />}
                </span>
                <span
                  className={cn(
                    "text-[13px] font-semibold",
                    step >= s.id ? "text-ink-800" : "text-ink-400"
                  )}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "mx-2 mb-5 h-0.5 w-10 rounded-full sm:w-16",
                    step > s.id ? "bg-emerald-500" : "bg-ink-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Card ──────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5 shadow-sm sm:p-7">
          {step === 1 && (
            <div className="animate-fade-in space-y-5">
              <StepHeading
                title="Who is the client?"
                blurb="In the finished product, the email address is also what creates their portal access."
              />

              <CallNotesAssist onApply={applyExtracted} />

              <div className="space-y-4">
                <Input
                  id="clientName"
                  label="Client name *"
                  value={form.clientName ?? ""}
                  onChange={(e) => update("clientName", e.target.value)}
                  placeholder="Sarah Mitchell"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="phone"
                    label="Phone number *"
                    type="tel"
                    value={form.phone ?? ""}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(555) 234-5678"
                  />
                  <Input
                    id="email"
                    label="Email address *"
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="sarah@email.com"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-5">
              <StepHeading
                title="What kind of transaction?"
                blurb="These five answers decide which tasks and documents appear."
              />

              <div>
                <p className="mb-2 text-[14px] font-medium text-ink-700">
                  Listing or buying *
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { value: "listing", label: "Listing", icon: Home, blurb: "Selling a property" },
                      { value: "buying", label: "Buying", icon: Search, blurb: "Representing a buyer" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update("side", option.value)}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition-all",
                        form.side === option.value
                          ? "border-ink-950 bg-ink-950 text-white"
                          : "border-hairline bg-surface hover:border-hairline-strong"
                      )}
                    >
                      <option.icon
                        className={cn(
                          "h-4 w-4",
                          form.side === option.value ? "text-white" : "text-ink-500"
                        )}
                      />
                      <p className="mt-2 text-[15px] font-semibold">{option.label}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-[13px]",
                          form.side === option.value ? "text-ink-300" : "text-ink-500"
                        )}
                      >
                        {option.blurb}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                id="propertyAddress"
                label={form.side === "buying" ? "Search criteria *" : "Property address *"}
                value={form.propertyAddress ?? ""}
                onChange={(e) => update("propertyAddress", e.target.value)}
                placeholder={
                  form.side === "buying"
                    ? "3BR/2BA in Austin, $400K–$500K"
                    : "1842 Oakwood Drive, Austin, TX 78704"
                }
              />

              <div className="space-y-4 border-t border-hairline pt-5">
                <YesNo
                  label="Is this a referral? *"
                  hint="Adds the referral agreement task and splits the commission."
                  value={form.isReferral}
                  onChange={(v) => update("isReferral", v)}
                />
                <YesNo
                  label="Is this a relocation? *"
                  hint="Adds the corporate relocation authorization task."
                  value={form.isRelocation}
                  onChange={(v) => update("isRelocation", v)}
                />
                {form.side === "listing" && (
                  <YesNo
                    label="Was the property built before 1978? *"
                    hint="Federally required lead-based paint disclosure."
                    value={form.builtBefore1978}
                    onChange={(v) => update("builtBefore1978", v)}
                  />
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in space-y-5">
              <StepHeading
                title="Anything else worth recording?"
                blurb="All optional — every one of these can be added later from the workspace."
              />

              {form.isReferral && (
                <div className="grid gap-4 rounded-xl border border-ink-200 bg-ink-100/50 p-4 sm:grid-cols-2">
                  <Input
                    id="referralSource"
                    label="Referral source"
                    value={form.referralSource ?? ""}
                    onChange={(e) => update("referralSource", e.target.value)}
                    placeholder="Direct or Corporate"
                  />
                  <Input
                    id="referralPercentage"
                    label="Referral percentage"
                    type="number"
                    trailing="%"
                    value={form.referralPercentage ?? ""}
                    onChange={(e) => update("referralPercentage", Number(e.target.value))}
                    placeholder="25"
                  />
                </div>
              )}

              <Input
                id="leadSource"
                label="Source of the lead"
                value={form.leadSource ?? ""}
                onChange={(e) => update("leadSource", e.target.value)}
                placeholder="Open house, Zillow, past client…"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="coClientName"
                  label="Spouse or co-client"
                  value={form.coClientName ?? ""}
                  onChange={(e) => update("coClientName", e.target.value)}
                  placeholder="Linda Chen"
                />
                <Input
                  id="coClientContact"
                  label="Co-client contact"
                  value={form.coClientContact ?? ""}
                  onChange={(e) => update("coClientContact", e.target.value)}
                  placeholder="(555) 987-6543"
                />
              </div>

              <Input
                id="websiteOrSocial"
                label="Website or social profile"
                value={form.websiteOrSocial ?? ""}
                onChange={(e) => update("websiteOrSocial", e.target.value)}
                placeholder="linkedin.com/in/…"
              />

              <Input
                id="petNames"
                label="Pet names"
                value={form.petNames ?? ""}
                onChange={(e) => update("petNames", e.target.value)}
                placeholder="Biscuit"
                hint="Worth knowing before scheduling showings."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="preferredContact"
                  label="Preferred contact method"
                  value={form.preferredContact ?? ""}
                  onChange={(e) => update("preferredContact", e.target.value)}
                  placeholder="Text"
                />
                <Input
                  id="preferredContactTime"
                  label="Best time to reach them"
                  value={form.preferredContactTime ?? ""}
                  onChange={(e) => update("preferredContactTime", e.target.value)}
                  placeholder="Evenings after 6pm"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in space-y-5">
              <StepHeading
                title="Here's what will be created"
                blurb="Built from your answers, not from a fixed template."
              />

              <dl className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2">
                <Summary label="Client" value={answers.clientName} />
                <Summary label="Type" value={answers.side === "listing" ? "Listing" : "Buyer"} />
                <Summary
                  label={answers.side === "listing" ? "Property" : "Criteria"}
                  value={answers.propertyAddress}
                />
                <Summary label="Contact" value={answers.phone} />
                {answers.isReferral && (
                  <Summary
                    label="Referral"
                    value={`Yes${answers.referralPercentage ? ` · ${answers.referralPercentage}%` : ""}`}
                  />
                )}
                {answers.isRelocation && <Summary label="Relocation" value="Yes" />}
                {answers.builtBefore1978 && <Summary label="Built" value="Before 1978" />}
              </dl>

              {/* Headline outcome */}
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat value={preview.tasks.length} label="Checklist tasks" />
                <Stat
                  value={preview.tasks.reduce((n, t) => n + t.subtasks.length, 0)}
                  label="Individual steps"
                />
                <Stat value={preview.docs.length} label="Documents expected" />
              </div>

              {/* The conditional payoff — the point of the whole flow */}
              {conditionalTasks.length > 0 && (
                <div className="rounded-2xl border border-ink-200 bg-ink-100/60 p-4">
                  <p className="flex items-center gap-2 text-[14px] font-semibold text-ink-900">
                    <Sparkles className="h-3.5 w-3.5" />
                    {conditionalTasks.length} task
                    {conditionalTasks.length === 1 ? "" : "s"} added because of your answers
                  </p>
                  <ul className="mt-2.5 space-y-1.5">
                    {conditionalTasks.map((t) => (
                      <li key={t.id} className="flex items-start gap-2 text-[14px]">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                        <span>
                          <span className="font-medium text-ink-900">{t.title}</span>
                          <span className="text-ink-600"> — {t.addedBecause}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full preview, grouped by phase */}
              <div className="overflow-hidden rounded-2xl border border-hairline">
                <p className="border-b border-hairline bg-canvas px-4 py-2.5 text-[13px] font-semibold text-ink-700">
                  The checklist that will be built
                </p>
                <ul className="max-h-72 divide-y divide-hairline overflow-y-auto">
                  {preview.tasks.map((t) => (
                    <li key={t.id} className="flex items-start gap-3 bg-surface px-4 py-2.5">
                      {t.dependsOn.length > 0 ? (
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                      ) : (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium text-ink-900">
                          {t.title}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="gray" size="xs">
                            {PHASE_LABELS[t.phase]}
                          </Badge>
                          {t.subtasks.length > 0 && (
                            <span className="text-[13px] text-ink-500">
                              {t.subtasks.length} steps
                            </span>
                          )}
                          {t.addedBecause && (
                            <Badge variant="purple" size="xs">
                              Conditional
                            </Badge>
                          )}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── Navigation ──────────────────────────────────────── */}
          <div className="mt-7 flex items-center justify-between gap-3 border-t border-hairline pt-5">
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <span />
            )}

            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ink" size="lg" onClick={handleSubmit}>
                <Sparkles className="h-4 w-4" />
                {completingId ? "Rebuild the checklist" : "Create file & build checklist"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ────────────────────────────────────────────────────────────── */

function QuickLeadForm({ onCreate }: { onCreate: (name: string, phone: string) => string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = onCreate(name.trim(), phone.trim());
    router.push(`/files/${id}`);
  };

  return (
    <AppShell crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Quick lead" }]}>
      <div className="mx-auto max-w-md">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to the dashboard
        </Link>

        <div className="mt-4 rounded-2xl border border-hairline bg-surface p-7 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Zap className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-[22px] font-bold tracking-[-0.025em] text-ink-950">
            Quick lead
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
            Thirty seconds, not five minutes. Save the name and number now — the
            guided questions can wait until you&apos;re back at a desk.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input
              id="quickName"
              label="Client name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Daniel Okafor"
              required
              autoFocus
            />
            <Input
              id="quickPhone"
              label="Phone number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 412-7788"
              required
            />
            <Button type="submit" size="lg" className="w-full">
              Save lead
            </Button>
          </form>

          <p className="mt-5 text-center text-[14px] text-ink-500">
            Got more time?{" "}
            <Link
              href="/files/new?full=true"
              className="font-semibold text-itera-600 hover:text-itera-700"
            >
              Start the full intake
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function StepHeading({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div>
      <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink-950">{title}</h2>
      <p className="mt-1 text-[14px] leading-relaxed text-ink-500">{blurb}</p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="section-title">{label}</dt>
      <dd className="mt-1 truncate text-[14px] font-semibold text-ink-950">{value || "—"}</dd>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas px-4 py-3 text-center">
      <p className="tnum text-[26px] font-bold leading-none tracking-[-0.03em] text-ink-950">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-ink-500">{label}</p>
    </div>
  );
}

function YesNo({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ink-800">{label}</p>
        {hint && <p className="mt-0.5 text-[13px] text-ink-500">{hint}</p>}
      </div>
      <div className="inline-flex shrink-0 rounded-xl bg-ink-100/80 p-1">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-[14px] font-semibold transition-all",
              value === v
                ? v
                  ? "bg-ink-950 text-white shadow-xs"
                  : "bg-surface text-ink-800 shadow-xs"
                : "text-ink-500 hover:text-ink-700"
            )}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}
