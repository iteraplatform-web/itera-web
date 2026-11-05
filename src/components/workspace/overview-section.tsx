"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isToday,
  isTomorrow,
  parseISO,
  setHours,
  setMinutes,
  startOfTomorrow,
} from "date-fns";
import {
  AlarmClock,
  ArrowRight,
  Bell,
  ExternalLink,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Hourglass,
  Mail,
  MessageSquare,
  Phone,
  Megaphone,
  Pin,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { useAuthStore, useTransactionsStore } from "@/stores";
import { googleCalendarUrl, openGoogleCalendar } from "@/lib/calendar/google";
import { GoogleCalendarChoice } from "@/components/calendar/google-choice";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { FROM_CONTRACT } from "@/lib/checklist/rules";
import { listingExpiryWarning, listingTermEnd } from "@/lib/work/listing-expiry";
import {
  lastOpenHouse,
  launchPoints,
  nextOpenHouse,
  overviewMarketingFilled,
  resolveMarketingDates,
} from "@/lib/work/marketing-plan";
import { ExtendListingButton } from "@/components/workspace/extend-listing";
import { DealContactsCard } from "@/components/workspace/deal-contacts";
import { cn } from "@/lib/utils/cn";
import type { ChecklistTask, TransactionFile } from "@/types";

const CLOSED = new Set(["closed", "dropped", "terminated", "expired"]);

/**
 * The file's home screen. Answers one question: what does this file need from
 * me today? Everything here is a shortcut — the full detail lives on the
 * other tabs, one click away.
 *
 * Each card is only as tall as its own content. The two columns stack on
 * their own, so a longer task list never stretches Key dates, and marketing
 * sits on its own row so a longer campaign never opens an empty pocket in
 * Reminders. Phone order stays: Next up, Key dates, Waiting, Reminders.
 */
export function OverviewSection({ file }: { file: TransactionFile }) {
  const listing = file.side === "listing";

  return (
    <div className="flex flex-col gap-3">
      <LatestMessageCard file={file} />

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-3">
          <NextUpCard file={file} className="order-1 lg:order-none" />
          <WaitingOnCard file={file} className="order-3 lg:order-none" />
        </div>
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-3">
          <KeyDatesCard file={file} className="order-2 lg:order-none" />
          <RemindersCard file={file} className="order-4 lg:order-none" />
        </div>
      </div>

      {listing && <MarketingDatesOverviewCard file={file} />}

      <DealContactsCard file={file} />
    </div>
  );
}

/* ── Shared panel frame ─────────────────────────────────────────────── */

function Panel({
  title,
  icon: Icon,
  action,
  children,
  tone = "default",
  className,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "alert";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-sm",
        tone === "alert" ? "border-red-200" : "border-hairline",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink-950">
          <Icon className={cn("h-4.5 w-4.5", tone === "alert" ? "text-red-600" : "text-ink-500")} />
          {title}
        </h2>
        {action}
      </header>
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">{children}</div>
    </section>
  );
}

function dueLabel(dueDate: string): { text: string; tone: "red" | "amber" | "green" } {
  const days = differenceInCalendarDays(parseISO(dueDate), new Date());
  if (days < 0) return { text: `${Math.abs(days)} day${days === -1 ? "" : "s"} late`, tone: "red" };
  if (days === 0) return { text: "Due today", tone: "red" };
  if (days === 1) return { text: "Due tomorrow", tone: "red" };
  if (days <= 3) return { text: `Due in ${days} days`, tone: "red" };
  if (days <= 7) return { text: `Due in ${days} days`, tone: "amber" };
  return { text: `Due ${format(parseISO(dueDate), "MMM d")}`, tone: "green" };
}

const TONE_CHIP = {
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

/* ── 1. Next up ─────────────────────────────────────────────────────── */

const SHOW_TASKS = 3;

function NextUpCard({ file, className }: { file: TransactionFile; className?: string }) {
  const toggleTask = useTransactionsStore((s) => s.toggleTask);

  // Only work that can actually be done now, soonest first.
  const actionable = useMemo(
    () =>
      file.checklist
        .filter((t) => t.status === "not_started" || t.status === "in_progress")
        .sort((a, b) => {
          const ad = a.dueDate ? parseISO(a.dueDate).getTime() : Infinity;
          const bd = b.dueDate ? parseISO(b.dueDate).getTime() : Infinity;
          return ad - bd;
        }),
    [file.checklist]
  );
  const waiting = file.checklist.filter((t) => t.status === "blocked").length;
  const shown = actionable.slice(0, SHOW_TASKS);
  const overdue = actionable.filter((t) => t.dueDate && parseISO(t.dueDate) < new Date()).length;

  if (CLOSED.has(file.status) && actionable.length === 0) {
    return (
      <Panel title="Next up" icon={CheckCircle2} className={className}>
        <p className="text-[15px] text-ink-600">This file is {file.status}. There is nothing left to do on it.</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Next up"
      icon={Clock}
      className={className}
      tone={overdue > 0 ? "alert" : "default"}
      action={
        <Link href={sectionHref(file.id, "checklist")} className="text-[14px] font-semibold text-itera-700 hover:text-itera-800">
          Full checklist →
        </Link>
      }
    >
      {overdue > 0 && (
        <p className="mb-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[15px] font-medium text-red-800">
          {overdue} task{overdue === 1 ? " is" : "s are"} past due. Start with the first one below.
        </p>
      )}

      {shown.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
          <p className="text-[15px] text-emerald-900">
            You&apos;re caught up.{" "}
            {waiting > 0 ? `${waiting} task${waiting === 1 ? " is" : "s are"} waiting on someone else first.` : ""}
          </p>
        </div>
      ) : (
        <ol className="space-y-2.5">
          {shown.map((task, i) => (
            <NextTaskRow key={task.id} task={task} file={file} first={i === 0} onDone={() => toggleTask(file.id, task.id)} />
          ))}
        </ol>
      )}

      {actionable.length > SHOW_TASKS && (
        <p className="mt-4 text-[14px] text-ink-500">
          {actionable.length - SHOW_TASKS} more ready to start
          {waiting ? `, ${waiting} waiting on earlier tasks` : ""}.{" "}
          <Link href={sectionHref(file.id, "checklist")} className="font-semibold text-itera-700 hover:underline">
            See them all
          </Link>
        </p>
      )}
    </Panel>
  );
}

function NextTaskRow({
  task,
  file,
  first,
  onDone,
}: {
  task: ChecklistTask;
  file: TransactionFile;
  first: boolean;
  onDone: () => void;
}) {
  const due = task.dueDate ? dueLabel(task.dueDate) : null;
  const stepsDone = task.subtasks.filter((s) => s.completed).length;
  const target = task.workTarget;

  return (
    <li
      className={cn(
        "rounded-xl border p-3.5",
        first ? "border-itera-200 bg-itera-50/40" : "border-hairline bg-surface"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold leading-snug text-ink-950">{task.title}</p>
          <p className="mt-1 text-[14px] text-ink-500">
            {task.description}
            {task.subtasks.length > 0 && (
              <span className="text-ink-600">
                {" "}
                · {stepsDone} of {task.subtasks.length} steps done
              </span>
            )}
          </p>
        </div>
        {due && (
          <span className={cn("tnum shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ring-1 ring-inset", TONE_CHIP[due.tone])}>
            {due.text}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {target && (
          <Link href={sectionHref(file.id, target.section, target.focus)}>
            <Button size="sm" variant={first ? "primary" : "secondary"}>
              {target.label ?? "Open"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <Link href={sectionHref(file.id, "checklist", task.id)}>
          <Button size="sm" variant="ghost">
            See steps
          </Button>
        </Link>
        <Button size="sm" variant="ghost" onClick={onDone} className="ml-auto">
          <Check className="h-4 w-4" />
          Mark done
        </Button>
      </div>
    </li>
  );
}

/* ── 2. Waiting on ──────────────────────────────────────────────────── */

function WaitingOnCard({ file, className }: { file: TransactionFile; className?: string }) {
  const outstanding = file.documents.filter((d) => d.status === "needed");
  if (outstanding.length === 0 || CLOSED.has(file.status)) return null;
  const shown = outstanding.slice(0, 4);

  return (
    <Panel
      title={`Waiting on ${outstanding.length} document${outstanding.length === 1 ? "" : "s"}`}
      icon={Hourglass}
      className={className}
      action={
        <Link href={sectionHref(file.id, "documents")} className="text-[15px] font-semibold text-itera-700 hover:underline">
          All documents
        </Link>
      }
    >
      <ul className="divide-y divide-hairline">
        {shown.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] text-ink-900">{d.name}</span>
              <span className="block text-[14px] text-ink-500">
                From {d.expectedFrom === "Client" ? "the client" : d.expectedFrom ?? "—"}
              </span>
            </span>
            <Link href={sectionHref(file.id, "documents", d.name)}>
              <Button size="sm" variant="secondary">
                Upload
              </Button>
            </Link>
          </li>
        ))}
      </ul>
      {outstanding.length > shown.length && (
        <p className="mt-3 text-[15px] text-ink-500">and {outstanding.length - shown.length} more</p>
      )}
    </Panel>
  );
}

/* ── 3. A question from the client ──────────────────────────────────── */

function LatestMessageCard({ file }: { file: TransactionFile }) {
  const last = file.messages[file.messages.length - 1];
  if (!last || last.sender !== "client") return null;
  // Only interrupt for a question — a thank-you doesn't need a banner.
  if (!/\?|can we|could you|when|what|how|please/i.test(last.content)) return null;
  return (
    <Link
      href={sectionHref(file.id, "communications", "thread")}
      className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 hover:shadow-md"
    >
      <MessageSquare className="h-5 w-5 shrink-0 text-amber-700" />
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-ink-950">{file.clientName.split(" ")[0]} asked a question</span>
        <span className="block truncate text-[15px] text-ink-700">&ldquo;{last.content}&rdquo;</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[15px] font-semibold text-ink-900">
        Reply
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

/* ── 4. Reminders ───────────────────────────────────────────────────── */

const PRESETS = [
  { label: "Later today", at: () => addDays(new Date(), 0), hours: () => Math.min(new Date().getHours() + 3, 20) },
  { label: "Tomorrow 9 AM", at: () => startOfTomorrow(), hours: () => 9 },
  { label: "In 3 days", at: () => addDays(new Date(), 3), hours: () => 9 },
  { label: "Next week", at: () => addDays(new Date(), 7), hours: () => 9 },
];

function RemindersCard({ file, className }: { file: TransactionFile; className?: string }) {
  const addReminder = useTransactionsStore((s) => s.addReminder);
  const toggleReminder = useTransactionsStore((s) => s.toggleReminder);
  const removeReminder = useTransactionsStore((s) => s.removeReminder);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(startOfTomorrow(), "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");
  const [addToGoogle, setAddToGoogle] = useState(false);

  const reminders = [...(file.reminders ?? [])].sort(
    (a, b) => Number(a.done) - Number(b.done) || parseISO(a.dueAt).getTime() - parseISO(b.dueAt).getTime()
  );

  const save = (alsoGoogle: boolean) => {
    if (!title.trim()) return;
    const [h, m] = time.split(":").map(Number);
    const dueAt = setMinutes(setHours(parseISO(date), h), m);
    const text = title.trim();
    addReminder(file.id, { title: text, dueAt: dueAt.toISOString() });
    if (alsoGoogle) {
      openGoogleCalendar({
        title: text,
        start: dueAt,
        details: `ITERA file: ${file.propertyAddress || file.clientName}`,
      });
    }
    setTitle("");
    setAddToGoogle(false);
    setOpen(false);
  };

  const when = (iso: string) => {
    const d = parseISO(iso);
    if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
    if (isTomorrow(d)) return `Tomorrow at ${format(d, "h:mm a")}`;
    return format(d, "EEE, MMM d 'at' h:mm a");
  };

  return (
    <Panel
      title="Reminders"
      icon={Bell}
      className={className}
      action={
        <Button size="xs" variant="secondary" onClick={() => { setAddToGoogle(false); setOpen(true); }}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      }
    >
      {reminders.length === 0 ? (
        <p className="text-[15px] text-ink-500">
          No reminders yet. Add one and it shows here and on the calendar. You can also copy it to Google Calendar.
        </p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => {
            const due = !r.done && parseISO(r.dueAt) <= new Date();
            return (
              <li
                key={r.id}
                className={cn(
                  "flex flex-wrap items-center gap-2.5 rounded-xl border px-3 py-2.5",
                  r.done ? "border-hairline bg-canvas" : due ? "border-amber-300 bg-amber-50" : "border-hairline bg-surface"
                )}
              >
                <button
                  onClick={() => toggleReminder(file.id, r.id)}
                  aria-label={r.done ? `Reopen ${r.title}` : `Mark ${r.title} done`}
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                    r.done ? "bg-emerald-500 text-white" : "bg-surface ring-1 ring-inset ring-ink-300 hover:ring-itera-500"
                  )}
                >
                  {r.done && <Check className="h-4 w-4" strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[15px] font-medium", r.done ? "text-ink-400 line-through" : "text-ink-900")}>{r.title}</p>
                  <p className={cn("text-[13px]", due ? "font-semibold text-amber-800" : "text-ink-500")}>
                    {due ? "Due now · " : ""}
                    {when(r.dueAt)}
                  </p>
                </div>
                <a
                  href={googleCalendarUrl({
                    title: r.title,
                    start: parseISO(r.dueAt),
                    details: `ITERA file: ${file.propertyAddress || file.clientName}`,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-ink-600 ring-1 ring-inset ring-hairline hover:bg-canvas hover:text-ink-950"
                >
                  <ExternalLink className="h-3 w-3" />
                  Google Calendar
                </a>
                <button
                  onClick={() => removeReminder(file.id, r.id)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  aria-label={`Delete reminder ${r.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a reminder"
        description="You'll get a notification at this time, and it will show on the calendar."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save(addToGoogle)} disabled={!title.trim()}>
              <AlarmClock className="h-4 w-4" />
              Set reminder
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="reminderTitle"
            label="Remind me to…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Call the lender about the appraisal"
            autoFocus
          />
          <div>
            <p className="mb-2 text-[14px] font-medium text-ink-700">Quick pick</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setDate(format(p.at(), "yyyy-MM-dd"));
                    setTime(`${String(p.hours()).padStart(2, "0")}:00`);
                  }}
                  className="rounded-full bg-ink-100 px-3.5 py-1.5 text-[14px] font-medium text-ink-700 hover:bg-ink-200"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="reminderDate" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input id="reminderTime" label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <GoogleCalendarChoice checked={addToGoogle} onChange={setAddToGoogle} />
        </div>
      </Modal>
    </Panel>
  );
}

/* ── 5. Marketing dates (listing only) ──────────────────────────────── */

function MarketingDatesOverviewCard({
  file,
  className,
}: {
  file: TransactionFile;
  className?: string;
}) {
  const m = file.marketing;
  const sheetLive = file.listingDetails.publishStatus === "published_external";
  const points = launchPoints(m, sheetLive);
  const done = points.filter((p) => p.done).length;
  const required = points.filter((p) => !p.optional);
  const requiredDone = required.filter((p) => p.done).length;
  const filled = overviewMarketingFilled(m, file.listingDetails.publishedAt);
  const upcomingHouse = nextOpenHouse(m.openHouses);
  const pastHouse = lastOpenHouse(m.openHouses);
  const goLive = resolveMarketingDates(m, file.listingDetails.publishedAt).goLiveAt;
  const daysLive =
    goLive && !CLOSED.has(file.status)
      ? Math.max(0, differenceInCalendarDays(new Date(), parseISO(goLive)))
      : null;
  const launchPct = points.length ? Math.round((done / points.length) * 100) : 0;
  const showings = file.showings.appointments.filter((a) => a.status !== "cancelled").length;
  const openHouseVisitors = m.openHouses.reduce((n, h) => n + (h.visitors || 0), 0);
  const nextMilestone =
    filled.find((r) => r.upcoming) ??
    filled.find((r) => {
      if (!r.iso) return false;
      return differenceInCalendarDays(parseISO(r.iso), new Date()) >= 0 && r.id !== "goLiveAt";
    });

  return (
    <Panel
      title="Marketing"
      icon={Megaphone}
      className={className}
      action={
        <Link href={sectionHref(file.id, "marketing")}>
          <Button size="xs" variant="secondary">
            Open
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-xl bg-itera-50 px-3 py-2 ring-1 ring-inset ring-itera-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-itera-700">On market</p>
          <p className="tnum mt-0.5 text-[22px] font-bold leading-none tracking-[-0.03em] text-itera-900">
            {daysLive !== null ? daysLive : "—"}
          </p>
          <p className="mt-0.5 text-[12px] text-itera-700">
            {daysLive === null ? "Not live yet" : daysLive === 0 ? "Launched today" : "days live"}
          </p>
        </div>
        <div className="rounded-xl bg-canvas px-3 py-2 ring-1 ring-inset ring-hairline">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Launch</p>
          <p className="tnum mt-0.5 text-[22px] font-bold leading-none tracking-[-0.03em] text-ink-950">
            {launchPct}
            <span className="text-[13px] font-semibold text-ink-400">%</span>
          </p>
          <p className="mt-0.5 text-[12px] text-ink-500">
            {requiredDone}/{required.length} required
          </p>
        </div>
        <div className="rounded-xl border border-hairline bg-canvas/50 px-2.5 py-2 text-center">
          <p className="tnum text-[16px] font-bold text-ink-950">{showings}</p>
          <p className="text-[11px] font-medium text-ink-500">Showings</p>
        </div>
        <div className="rounded-xl border border-hairline bg-canvas/50 px-2.5 py-2 text-center">
          <p className="tnum text-[16px] font-bold text-ink-950">{m.openHouses.length}</p>
          <p className="text-[11px] font-medium text-ink-500">Open houses</p>
        </div>
        <div className="col-span-2 rounded-xl border border-hairline bg-canvas/50 px-2.5 py-2 text-center sm:col-span-1">
          <p className="tnum text-[16px] font-bold text-ink-950">{openHouseVisitors}</p>
          <p className="text-[11px] font-medium text-ink-500">OH visitors</p>
        </div>
      </div>

      <Progress
        className="mt-3"
        value={launchPct}
        size="sm"
        barClassName={
          launchPct >= 70
            ? "from-emerald-500 to-emerald-600"
            : launchPct >= 35
              ? "from-itera-500 to-itera-600"
              : "from-amber-500 to-amber-600"
        }
      />

      <div className="mt-3 rounded-xl border border-itera-100 bg-itera-50/50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-itera-700">Up next</p>
        {upcomingHouse ? (
          <p className="mt-0.5 text-[14px] font-semibold text-ink-950">
            Open house · {format(parseISO(upcomingHouse.date), "EEE, MMM d")}
            <span className="text-ink-500">
              {" "}
              · {upcomingHouse.startTime}–{upcomingHouse.endTime}
            </span>
          </p>
        ) : nextMilestone?.iso ? (
          <p className="mt-0.5 text-[14px] font-semibold text-ink-950">
            {nextMilestone.label} · {format(parseISO(nextMilestone.iso), "EEE, MMM d")}
            {nextMilestone.detail ? <span className="text-ink-500"> · {nextMilestone.detail}</span> : null}
          </p>
        ) : (
          <p className="mt-0.5 text-[14px] font-medium text-ink-500">Nothing scheduled yet.</p>
        )}
      </div>

      {filled.length > 0 ? (
        <dl className="mt-3 divide-y divide-hairline rounded-xl border border-hairline bg-canvas/40 px-3">
          {filled.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 py-2">
              <dt className="min-w-0">
                <span className="block text-[13px] text-ink-500">{r.label}</span>
                {r.note ? (
                  <span className="mt-0.5 block text-[12px] leading-snug text-ink-600">{r.note}</span>
                ) : null}
              </dt>
              <dd className="shrink-0 text-right text-[13px] font-semibold text-ink-900">
                {r.iso ? format(parseISO(r.iso), "MMM d, yyyy") : "—"}
                {r.detail ? <span className="text-ink-500"> · {r.detail}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-hairline bg-canvas/40 px-3 py-2.5 text-[13px] text-ink-500">
          No marketing dates yet. Add them on the Marketing tab.
        </p>
      )}

      {pastHouse && !upcomingHouse && (
        <p className="mt-2 text-[12.5px] text-ink-500">
          Last open house {format(parseISO(pastHouse.date), "MMM d")} · {pastHouse.visitors} visitors
        </p>
      )}

      {m.campaignNotes.trim() && (
        <div className="mt-2.5 rounded-xl border border-hairline bg-surface px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Campaign notes</p>
          <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-ink-700">{m.campaignNotes}</p>
        </div>
      )}
    </Panel>
  );
}

/* ── 6. Key dates ───────────────────────────────────────────────────── */

function KeyDatesCard({ file, className }: { file: TransactionFile; className?: string }) {
  const setKeyDates = useTransactionsStore((s) => s.setKeyDates);
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(file.closingDate ? format(parseISO(file.closingDate), "yyyy-MM-dd") : "");
  const [contract, setContract] = useState(file.contractDate ? format(parseISO(file.contractDate), "yyyy-MM-dd") : "");

  const optionEnds = file.contractDate ? addDays(parseISO(file.contractDate), FROM_CONTRACT.inspection) : null;
  const daysToClose = file.closingDate ? differenceInCalendarDays(parseISO(file.closingDate), new Date()) : null;
  const listingEnds = file.side === "listing" ? listingTermEnd(file) : undefined;
  const expiryWarning = listingExpiryWarning(file);

  const rows = [
    { label: "File opened", value: format(parseISO(file.createdAt), "MMM d, yyyy") },
    { label: "Date of acceptance", value: file.contractDate ? format(parseISO(file.contractDate), "MMM d, yyyy") : "Not yet" },
    ...(optionEnds ? [{ label: "Option period ends", value: format(optionEnds, "MMM d, yyyy") }] : []),
    { label: "Date of closing", value: file.closingDate ? format(parseISO(file.closingDate), "EEE, MMM d, yyyy") : "Not set" },
    ...(file.side === "listing"
      ? [
          {
            label: "Listing expires",
            value: listingEnds ? format(parseISO(listingEnds), "EEE, MMM d, yyyy") : "Not set",
          },
        ]
      : []),
  ];

  return (
    <Panel
      title="Key dates"
      icon={CalendarDays}
      className={className}
      action={
        <Button size="xs" variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      }
    >
      {daysToClose !== null && !CLOSED.has(file.status) && (
        <div className="mb-3 flex items-baseline gap-2 rounded-xl bg-ink-950 px-3.5 py-3 text-white">
          <span className="tnum text-[28px] font-bold leading-none">{Math.max(daysToClose, 0)}</span>
          <span className="text-[15px] text-ink-300">
            {daysToClose > 0 ? `day${daysToClose === 1 ? "" : "s"} until closing` : daysToClose === 0 ? "Closing is today" : "Closing date has passed"}
          </span>
        </div>
      )}
      <dl className="divide-y divide-hairline">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-[15px] text-ink-500">{r.label}</dt>
            <dd className="text-right text-[15px] font-semibold text-ink-900">{r.value}</dd>
          </div>
        ))}
      </dl>
      {file.side === "listing" && listingEnds && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] text-ink-600">
            {file.status === "expired"
              ? "This listing is expired."
              : expiryWarning
                ? expiryWarning.daysLeft === 0
                  ? "This listing expires today."
                  : `This listing expires in ${expiryWarning.daysLeft} day${expiryWarning.daysLeft === 1 ? "" : "s"}.`
                : "Extend the agreement if the seller wants more time."}
          </p>
          <ExtendListingButton file={file} />
        </div>
      )}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit key dates"
        description="Contract deadlines are recalculated from these dates — the inspection and earnest money from the contract date, appraisal, financing and walkthrough back from closing."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setKeyDates(file.id, {
                  contractDate: contract ? parseISO(contract).toISOString() : "",
                  closingDate: closing ? setHours(parseISO(closing), 12).toISOString() : "",
                });
                setEditing(false);
              }}
            >
              Save and recalculate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input id="contractDate" label="Date of acceptance" type="date" value={contract} onChange={(e) => setContract(e.target.value)} />
          <Input id="closingDate" label="Date of closing" type="date" value={closing} onChange={(e) => setClosing(e.target.value)} />
        </div>
      </Modal>
    </Panel>
  );
}
