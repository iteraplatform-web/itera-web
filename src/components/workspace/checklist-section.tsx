"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Info,
  Lock,
  Sparkles,
} from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { PHASE_LABELS, type ChecklistPhase, type ChecklistTask, type TransactionFile } from "@/types";
import { formatDaysRemaining, daysRemaining, isOverdue } from "@/lib/utils/dates";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import { useFocusTarget } from "@/hooks/use-focus-target";
import { cn } from "@/lib/utils/cn";

const PHASE_ORDER: ChecklistPhase[] = [
  "intake",
  "listing_prep",
  "marketing",
  "offers",
  "under_contract",
  "closing",
  "post_close",
];

type PhaseState = "completed" | "active" | "upcoming";

export function ChecklistSection({ file, focus }: { file: TransactionFile; focus?: string }) {
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const toggleSubtask = useTransactionsStore((s) => s.toggleSubtask);
  // Arriving from "See steps" opens that task's steps straight away.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(focus ? [focus] : []));
  const [phaseFilter, setPhaseFilter] = useState<ChecklistPhase | "all">("all");
  // Finished work is hidden by default so the list shows only what is left.
  const [showFinished, setShowFinished] = useState(false);
  useFocusTarget(focus);

  const phases = useMemo(
    () => PHASE_ORDER.filter((p) => file.checklist.some((t) => t.phase === p)),
    [file.checklist]
  );

  const phaseStats = useMemo(() => {
    const map = new Map<ChecklistPhase, { done: number; total: number; state: PhaseState }>();
    phases.forEach((phase) => {
      const tasks = file.checklist.filter((t) => t.phase === phase);
      const done = tasks.filter((t) => t.status === "completed").length;
      const state: PhaseState =
        done === tasks.length ? "completed" : done > 0 || tasks.some((t) => t.status === "in_progress") ? "active" : "upcoming";
      map.set(phase, { done, total: tasks.length, state });
    });
    return map;
  }, [file.checklist, phases]);

  // The phase currently being worked drives the "current stage" progress line.
  const activePhase = phases.find((p) => phaseStats.get(p)?.state === "active") ?? phases[0];
  const activeStats = activePhase ? phaseStats.get(activePhase) : undefined;

  const inPhase =
    phaseFilter === "all" ? file.checklist : file.checklist.filter((t) => t.phase === phaseFilter);
  const finishedCount = inPhase.filter((t) => t.status === "completed").length;
  const displayed = showFinished
    ? inPhase
    : inPhase.filter((t) => t.status !== "completed" || t.id === focus);

  const toggleExpand = (taskId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });

  return (
    <div className="space-y-5">
      {/* ── Phase rail ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-hairline bg-canvas/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="section-title">Phases</span>
          <button
            onClick={() => setPhaseFilter("all")}
            className={cn(
              "text-[13px] font-semibold transition-colors",
              phaseFilter === "all" ? "text-ink-400" : "text-itera-600 hover:text-itera-700"
            )}
            disabled={phaseFilter === "all"}
          >
            Show all phases
          </button>
        </div>

        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-1">
          {phases.map((phase, i) => {
            const stats = phaseStats.get(phase)!;
            const selected = phaseFilter === phase;
            return (
              <div key={phase} className="flex shrink-0 items-center">
                <button
                  onClick={() => setPhaseFilter(selected ? "all" : phase)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all",
                    stats.state === "completed" && "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
                    stats.state === "active" && "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
                    stats.state === "upcoming" && "bg-ink-100 text-ink-500",
                    selected && "ring-2 ring-ink-950 ring-offset-1 ring-offset-canvas"
                  )}
                >
                  {stats.state === "completed" ? (
                    <Check className="h-3 w-3" />
                  ) : stats.state === "active" ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    </span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-ink-300" />
                  )}
                  {PHASE_LABELS[phase]}
                  <span className="tnum opacity-70">
                    {stats.done}/{stats.total}
                  </span>
                </button>
                {i < phases.length - 1 && (
                  <span
                    className={cn(
                      "mx-1 h-px w-4 shrink-0",
                      stats.state === "completed" ? "bg-emerald-300" : "bg-hairline-strong"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress within the phase actually being worked */}
        {activePhase && activeStats && activeStats.state !== "completed" && (
          <div className="mt-4 border-t border-hairline pt-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-500">
                Current stage:{" "}
                <span className="font-semibold text-ink-900">{PHASE_LABELS[activePhase]}</span>
              </span>
              <span className="tnum font-semibold text-ink-700">
                {activeStats.total - activeStats.done} of {activeStats.total} left
              </span>
            </div>
            <Progress
              value={(activeStats.done / activeStats.total) * 100}
              size="sm"
              className="mt-2"
              barClassName="from-amber-400 to-amber-500"
            />
          </div>
        )}
      </div>

      {/* ── Task list ─────────────────────────────────────────── */}
      {finishedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3">
          <p className="text-[15px] text-ink-600">
            <CheckCircle2 className="mr-1.5 inline h-4 w-4 text-emerald-600" />
            {finishedCount} task{finishedCount === 1 ? "" : "s"} finished{showFinished ? "" : " and hidden"}
          </p>
          <Button size="sm" variant="secondary" onClick={() => setShowFinished((v) => !v)}>
            {showFinished ? "Hide finished tasks" : "Show finished tasks"}
          </Button>
        </div>
      )}

      {displayed.length === 0 && (
        <p className="rounded-xl bg-emerald-50 px-4 py-4 text-[15px] text-emerald-900">
          Everything in this {phaseFilter === "all" ? "checklist" : "phase"} is done.
        </p>
      )}

      <ul className="space-y-3">
        {displayed.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            file={file}
            expanded={expanded.has(task.id)}
            onToggleExpand={() => toggleExpand(task.id)}
            onToggleTask={() => toggleTask(file.id, task.id)}
            onToggleSubtask={(subtaskId) => toggleSubtask(file.id, task.id, subtaskId)}
          />
        ))}
      </ul>
    </div>
  );
}

function TaskRow({
  task,
  file,
  expanded,
  onToggleExpand,
  onToggleTask,
  onToggleSubtask,
}: {
  task: ChecklistTask;
  file: TransactionFile;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleTask: () => void;
  onToggleSubtask: (subtaskId: string) => void;
}) {
  const isBlocked = task.status === "blocked";
  const isCompleted = task.status === "completed";
  const isInProgress = task.status === "in_progress";
  const hasSubtasks = task.subtasks.length > 0;
  const subDone = task.subtasks.filter((s) => s.completed).length;

  const days = task.dueDate && !isCompleted ? daysRemaining(task.dueDate) : null;
  const late = task.dueDate && !isCompleted ? isOverdue(task.dueDate) : false;

  const blockers = isBlocked
    ? task.dependsOn
        .map((id) => file.checklist.find((t) => t.id === id))
        .filter((t): t is ChecklistTask => Boolean(t) && t!.status !== "completed")
    : [];

  return (
    <li
      data-focus={task.id}
      className={cn(
        "overflow-hidden rounded-2xl border transition-all",
        isBlocked && "border-hairline bg-canvas/60",
        isCompleted && "border-emerald-200/70 bg-emerald-50/25",
        isInProgress && "border-amber-200 bg-amber-50/25 shadow-xs",
        !isBlocked && !isCompleted && !isInProgress && "border-hairline bg-surface hover:border-hairline-strong"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox / lock */}
        <div className="mt-0.5 shrink-0">
          {isBlocked ? (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-100 ring-1 ring-inset ring-ink-200"
              title="Waiting on an earlier task"
            >
              <Lock className="h-3 w-3 text-ink-500" />
            </span>
          ) : (
            <button
              onClick={onToggleTask}
              aria-label={isCompleted ? `Reopen ${task.title}` : `Complete ${task.title}`}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90",
                isCompleted
                  ? "bg-emerald-500 text-white shadow-xs hover:bg-emerald-600"
                  : "bg-surface ring-1 ring-inset ring-ink-300 hover:ring-2 hover:ring-itera-500"
              )}
            >
              {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[15px] font-semibold leading-snug",
                  isCompleted ? "text-ink-500 line-through" : isBlocked ? "text-ink-500" : "text-ink-950"
                )}
              >
                {task.title}
              </p>
              <p className={cn("mt-0.5 text-[14px] leading-snug", isBlocked ? "text-ink-400" : "text-ink-500")}>
                {task.description}
              </p>
            </div>

            {/* Deadline chip */}
            {days !== null && (
              <span
                className={cn(
                  "tnum inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-bold ring-1 ring-inset",
                  late || days <= 3
                    ? "bg-red-50 text-red-700 ring-red-200"
                    : days <= 7
                    ? "bg-amber-50 text-amber-700 ring-amber-200"
                    : "bg-ink-50 text-ink-500 ring-ink-200"
                )}
              >
                <Clock className="h-3 w-3" />
                {formatDaysRemaining(task.dueDate!)}
              </span>
            )}
          </div>

          {/* Why this task exists — the conditional-rule payoff */}
          {task.addedBecause && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-[13px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200/70">
              <Sparkles className="h-3 w-3" />
              Added because: {task.addedBecause}
            </p>
          )}

          {/* What this task is waiting on */}
          {blockers.length > 0 && (
            <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-[13px] text-ink-500">
              <Info className="mt-px h-3 w-3 shrink-0" />
              <span>
                Waiting on{" "}
                <span className="font-semibold text-ink-700">
                  {blockers.map((b) => b.title).join(" and ")}
                </span>
              </span>
            </p>
          )}

          {task.workTarget && !isCompleted && (
            <div className="mt-3">
              <Link href={sectionHref(file.id, task.workTarget.section, task.workTarget.focus)}>
                <Button size="sm" variant={isBlocked ? "secondary" : "primary"}>
                  {task.workTarget.label ?? "Open"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {isBlocked && (
                <span className="ml-3 text-[13px] text-ink-500">You can prepare this now; it unlocks when the earlier task is done.</span>
              )}
            </div>
          )}

          {task.completedAt && (
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              {task.completedBy} · {new Date(task.completedAt).toLocaleDateString()}
            </p>
          )}

          {/* Subtasks */}
          {hasSubtasks && (
            <div className="mt-3">
              <button
                onClick={onToggleExpand}
                className="flex w-full items-center gap-2 rounded-lg py-1 text-left transition-colors hover:text-ink-900"
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-ink-500 transition-transform duration-200",
                    expanded && "rotate-180"
                  )}
                />
                <span className="text-[13px] font-semibold text-ink-600">
                  {task.subtasks.length} steps
                </span>
                <span className="tnum text-[13px] text-ink-500">
                  {subDone}/{task.subtasks.length} done
                </span>
                <span className="ml-auto h-1 w-16 overflow-hidden rounded-full bg-ink-100">
                  <span
                    className={cn(
                      "block h-full rounded-full transition-[width] duration-500",
                      subDone === task.subtasks.length ? "bg-emerald-500" : "bg-amber-500"
                    )}
                    style={{ width: `${(subDone / task.subtasks.length) * 100}%` }}
                  />
                </span>
              </button>

              {expanded && (
                <ul className="mt-2 space-y-1 border-l-2 border-hairline pl-3.5">
                  {task.subtasks.map((sub) => (
                    <li key={sub.id}>
                      <label
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[14px]",
                          isBlocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-canvas"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors",
                            sub.completed
                              ? "bg-emerald-500 text-white"
                              : "bg-surface ring-1 ring-inset ring-ink-300"
                          )}
                        >
                          {sub.completed && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                        </span>
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          disabled={isBlocked}
                          onChange={() => onToggleSubtask(sub.id)}
                          className="sr-only"
                        />
                        <span className={sub.completed ? "text-ink-500 line-through" : "text-ink-700"}>
                          {sub.title}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
