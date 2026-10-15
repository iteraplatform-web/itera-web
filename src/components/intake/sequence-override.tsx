"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Lock, Plus, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createAgentTask, type SequenceDraftItem } from "@/lib/checklist/engine";
import { PHASE_LABELS, type ChecklistPhase } from "@/types";
import { cn } from "@/lib/utils/cn";

const PHASES = Object.keys(PHASE_LABELS) as ChecklistPhase[];

/**
 * The review-screen editor. The automatic list is the starting point.
 * Changes apply to this file only.
 */
export function SequenceOverride({
  items,
  changed,
  onChange,
  onReset,
}: {
  items: SequenceDraftItem[];
  changed: boolean;
  onChange: (items: SequenceDraftItem[]) => void;
  onReset: () => void;
}) {
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState<ChecklistPhase>("intake");

  const titleFor = (id: string) => items.find((item) => item.task.id === id)?.task.title;

  const patch = (id: string, edit: (item: SequenceDraftItem) => SequenceDraftItem) =>
    onChange(items.map((item) => (item.task.id === id ? edit(item) : item)));

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    const copy = items.slice();
    const [row] = copy.splice(index, 1);
    copy.splice(next, 0, row);
    onChange(copy);
  };

  const add = () => {
    const name = title.trim();
    if (!name) return;
    onChange([
      ...items,
      { task: createAgentTask(name, phase), included: true, templateDependsOn: [] },
    ]);
    setTitle("");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline">
      <div className="flex items-start justify-between gap-3 border-b border-hairline bg-canvas px-4 py-2.5">
        <div>
          <p className="text-[13px] font-semibold text-ink-700">The checklist for this file</p>
          <p className="mt-0.5 text-[13px] text-ink-500">
            Turn a task off, add one, move it, or let it start without waiting.
          </p>
        </div>
        {changed && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 text-[13px] font-semibold text-itera-600 hover:text-itera-700"
          >
            Use the automatic list
          </button>
        )}
      </div>

      <ul className="max-h-112 divide-y divide-hairline overflow-y-auto">
        {items.map((item, index) => {
          const waits = item.task.dependsOn
            .filter((id) => items.some((row) => row.task.id === id && row.included))
            .map((id) => titleFor(id))
            .filter(Boolean) as string[];
          const canRestore = item.templateDependsOn.length > 0 && item.task.dependsOn.length === 0;
          return (
            <li
              key={item.task.id}
              className={cn("flex items-start gap-3 bg-surface px-4 py-2.5", !item.included && "bg-canvas/80")}
            >
              <button
                type="button"
                aria-pressed={item.included}
                aria-label={item.included ? `Leave off ${item.task.title}` : `Put back ${item.task.title}`}
                onClick={() => patch(item.task.id, (row) => ({ ...row, included: !row.included }))}
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all",
                  item.included
                    ? "bg-emerald-500 text-white"
                    : "bg-surface ring-1 ring-inset ring-ink-300 hover:ring-ink-400"
                )}
              >
                {item.included && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-[14px] font-medium",
                    item.included ? "text-ink-900" : "text-ink-400 line-through"
                  )}
                >
                  {item.task.title}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="gray" size="xs">
                    {PHASE_LABELS[item.task.phase]}
                  </Badge>
                  {item.task.subtasks.length > 0 && (
                    <span className="text-[13px] text-ink-500">{item.task.subtasks.length} steps</span>
                  )}
                  {item.task.addedBecause && item.included && (
                    <Badge variant="purple" size="xs">
                      {item.task.id.startsWith("custom_") ? "Added" : "Conditional"}
                    </Badge>
                  )}
                  {!item.included && <span className="text-[13px] text-ink-400">Left off this file</span>}
                </span>
                {item.included && waits.length > 0 && (
                  <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-500">
                    <Lock className="h-3 w-3 shrink-0" />
                    Waits on {waits.join(" and ")}
                    <button
                      type="button"
                      onClick={() =>
                        patch(item.task.id, (row) => ({ ...row, task: { ...row.task, dependsOn: [] } }))
                      }
                      className="font-semibold text-itera-600 hover:text-itera-700"
                    >
                      Start without waiting
                    </button>
                  </span>
                )}
                {item.included && canRestore && (
                  <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-500">
                    <Unlock className="h-3 w-3 shrink-0" />
                    Starts right away
                    <button
                      type="button"
                      onClick={() =>
                        patch(item.task.id, (row) => ({
                          ...row,
                          task: { ...row.task, dependsOn: [...row.templateDependsOn] },
                        }))
                      }
                      className="font-semibold text-itera-600 hover:text-itera-700"
                    >
                      Put the wait back
                    </button>
                  </span>
                )}
              </span>

              <span className="flex shrink-0 flex-col">
                <button
                  type="button"
                  aria-label={`Move ${item.task.title} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${item.task.title} down`}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                  className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 border-t border-hairline bg-canvas px-4 py-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Input
            id="extra-task"
            label="Add a task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Call the photographer"
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            id="extra-task-phase"
            label="Phase"
            value={phase}
            onChange={(e) => setPhase(e.target.value as ChecklistPhase)}
          >
            {PHASES.map((p) => (
              <option key={p} value={p}>
                {PHASE_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" variant="secondary" size="md" onClick={add} disabled={!title.trim()}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
