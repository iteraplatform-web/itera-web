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
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Hourglass,
  Mail,
  MessageSquare,
  Phone,
  Pin,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { useAuthStore, useTransactionsStore } from "@/stores";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { calculatePayout, money } from "@/lib/work/payout";
import { FROM_CONTRACT } from "@/lib/checklist/rules";
import { cn } from "@/lib/utils/cn";
import type { ChecklistTask, TransactionFile } from "@/types";

const CLOSED = new Set(["closed", "dropped", "terminated"]);

/**
 * The file's home screen. Answers one question: what does this file need from
 * me today? Everything here is a shortcut — the full detail lives on the
 * other tabs, one click away.
 */
export function OverviewSection({ file }: { file: TransactionFile }) {
  return (
    <div className="space-y-6">
      <LatestMessageCard file={file} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <NextUpCard file={file} />
          <WaitingOnCard file={file} />
        </div>
        <div className="min-w-0 space-y-6">
          <KeyDatesCard file={file} />
          <RemindersCard file={file} />
        </div>
      </div>
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
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "alert";
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-surface shadow-sm",
        tone === "alert" ? "border-red-200" : "border-hairline"
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
        <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-ink-950">
          <Icon className={cn("h-5 w-5", tone === "alert" ? "text-red-600" : "text-ink-500")} />
          {title}
        </h2>
        {action}
      </header>
      <div className="p-5">{children}</div>
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

function NextUpCard({ file }: { file: TransactionFile }) {
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
      <Panel title="Next up" icon={CheckCircle2}>
        <p className="text-[15px] text-ink-600">This file is {file.status}. There is nothing left to do on it.</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Next up"
      icon={Clock}
      tone={overdue > 0 ? "alert" : "default"}
      action={
        <Link href={sectionHref(file.id, "checklist")} className="text-[14px] font-semibold text-itera-700 hover:text-itera-800">
          Full checklist →
        </Link>
      }
    >
      {overdue > 0 && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[15px] font-medium text-red-800">
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
        <ol className="space-y-3">
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
        "rounded-xl border p-4",
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

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
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

function WaitingOnCard({ file }: { file: TransactionFile }) {
  const outstanding = file.documents.filter((d) => d.status === "needed");
  if (outstanding.length === 0 || CLOSED.has(file.status)) return null;
  const shown = outstanding.slice(0, 4);

  return (
    <Panel
      title={`Waiting on ${outstanding.length} document${outstanding.length === 1 ? "" : "s"}`}
      icon={Hourglass}
      action={
        <Link href={sectionHref(file.id, "documents")} className="text-[15px] font-semibold text-itera-700 hover:underline">
          All documents
        </Link>
      }
    >
      <ul className="divide-y divide-hairline">
        {shown.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
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
      className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 hover:shadow-md"
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

function RemindersCard({ file }: { file: TransactionFile }) {
  const addReminder = useTransactionsStore((s) => s.addReminder);
  const toggleReminder = useTransactionsStore((s) => s.toggleReminder);
  const removeReminder = useTransactionsStore((s) => s.removeReminder);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(startOfTomorrow(), "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");

  const reminders = [...(file.reminders ?? [])].sort(
    (a, b) => Number(a.done) - Number(b.done) || parseISO(a.dueAt).getTime() - parseISO(b.dueAt).getTime()
  );

  const save = () => {
    if (!title.trim()) return;
    const [h, m] = time.split(":").map(Number);
    const dueAt = setMinutes(setHours(parseISO(date), h), m);
    addReminder(file.id, { title: title.trim(), dueAt: dueAt.toISOString() });
    setTitle("");
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
      action={
        <Button size="xs" variant="secondary" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      }
    >
      {reminders.length === 0 ? (
        <p className="text-[15px] text-ink-500">
          No reminders. Add one and ITERA will alert you at that time — even if you are on another file.
        </p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => {
            const due = !r.done && parseISO(r.dueAt) <= new Date();
            return (
              <li
                key={r.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-3.5 py-3",
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
        description="You'll get a notification at this time, wherever you are in ITERA."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!title.trim()}>
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
        </div>
      </Modal>
    </Panel>
  );
}

/* ── 5. Key dates ───────────────────────────────────────────────────── */

function KeyDatesCard({ file }: { file: TransactionFile }) {
  const setKeyDates = useTransactionsStore((s) => s.setKeyDates);
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(file.closingDate ? format(parseISO(file.closingDate), "yyyy-MM-dd") : "");
  const [contract, setContract] = useState(file.contractDate ? format(parseISO(file.contractDate), "yyyy-MM-dd") : "");

  const optionEnds = file.contractDate ? addDays(parseISO(file.contractDate), FROM_CONTRACT.inspection) : null;
  const daysToClose = file.closingDate ? differenceInCalendarDays(parseISO(file.closingDate), new Date()) : null;

  const rows = [
    { label: "File opened", value: format(parseISO(file.createdAt), "MMM d, yyyy") },
    { label: "Contract signed", value: file.contractDate ? format(parseISO(file.contractDate), "MMM d, yyyy") : "Not yet" },
    ...(optionEnds ? [{ label: "Option period ends", value: format(optionEnds, "MMM d, yyyy") }] : []),
    { label: "Closing", value: file.closingDate ? format(parseISO(file.closingDate), "EEE, MMM d, yyyy") : "Not set" },
  ];

  return (
    <Panel
      title="Key dates"
      icon={CalendarDays}
      action={
        <Button size="xs" variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      }
    >
      {daysToClose !== null && !CLOSED.has(file.status) && (
        <div className="mb-4 flex items-baseline gap-2 rounded-xl bg-ink-950 px-4 py-3.5 text-white">
          <span className="tnum text-[30px] font-bold leading-none">{Math.max(daysToClose, 0)}</span>
          <span className="text-[15px] text-ink-300">
            {daysToClose > 0 ? `day${daysToClose === 1 ? "" : "s"} until closing` : daysToClose === 0 ? "Closing is today" : "Closing date has passed"}
          </span>
        </div>
      )}
      <dl className="divide-y divide-hairline">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-[15px] text-ink-500">{r.label}</dt>
            <dd className="text-right text-[15px] font-semibold text-ink-900">{r.value}</dd>
          </div>
        ))}
      </dl>

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
          <Input id="contractDate" label="Contract signed" type="date" value={contract} onChange={(e) => setContract(e.target.value)} />
          <Input id="closingDate" label="Closing date" type="date" value={closing} onChange={(e) => setClosing(e.target.value)} />
        </div>
      </Modal>
    </Panel>
  );
}
