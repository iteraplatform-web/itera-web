"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, KeyRound } from "lucide-react";
import { IconButton, Button } from "@/components/ui/button";
import { STATUS_THEME } from "@/lib/utils/status-theme";
import { cn } from "@/lib/utils/cn";
import type { TransactionFile } from "@/types";

interface CalendarEvent {
  id: string;
  fileId: string;
  label: string;
  fileLabel: string;
  kind: "task" | "closing";
  status: TransactionFile["status"];
  overdue: boolean;
}

export function CalendarView({ files }: { files: TransactionFile[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = new Date();

  /* Build the day → events map once per input change. */
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    const push = (date: string, event: CalendarEvent) => {
      const key = format(parseISO(date), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), event]);
    };

    files.forEach((file) => {
      file.checklist.forEach((task) => {
        if (!task.dueDate || task.status === "completed") return;
        push(task.dueDate, {
          id: `${file.id}-${task.id}`,
          fileId: file.id,
          label: task.title,
          fileLabel: file.propertyAddress || file.clientName,
          kind: "task",
          status: file.status,
          overdue: parseISO(task.dueDate) < today,
        });
      });

      if (file.closingDate) {
        push(file.closingDate, {
          id: `${file.id}-closing`,
          fileId: file.id,
          label: "Closing",
          fileLabel: file.propertyAddress || file.clientName,
          kind: "closing",
          status: file.status,
          overdue: false,
        });
      }
    });

    return map;
  }, [files, today]);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = monthStart.getDay();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthEventCount = days.reduce(
    (sum, d) => sum + (eventsByDay.get(format(d, "yyyy-MM-dd"))?.length ?? 0),
    0
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-4">
        <div>
          <h3 className="text-[16px] font-semibold text-ink-950">
            {format(month, "MMMM yyyy")}
          </h3>
          <p className="text-[13px] text-ink-500">
            <span className="tnum">{monthEventCount}</span> deadline
            {monthEventCount === 1 ? "" : "s"} this month
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isSameMonth(month, today) && (
            <Button size="sm" variant="ghost" onClick={() => setMonth(startOfMonth(today))}>
              Today
            </Button>
          )}
          <IconButton
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <IconButton onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-hairline bg-canvas">
        {weekDays.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[13px] font-semibold uppercase tracking-wide text-ink-500"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-hairline">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[96px] bg-canvas/50" />
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const events = eventsByDay.get(key) ?? [];
          const isToday = isSameDay(day, today);

          return (
            <div
              key={key}
              className={cn(
                "min-h-[96px] bg-surface p-1.5 transition-colors",
                isToday && "bg-itera-50/60"
              )}
            >
              <div className="flex items-center justify-between px-0.5">
                <span
                  className={cn(
                    "tnum flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[13px] font-semibold",
                    isToday ? "bg-itera-600 text-white" : "text-ink-500"
                  )}
                >
                  {format(day, "d")}
                </span>
                {events.length > 2 && (
                  <span className="tnum text-[12px] font-medium text-ink-400">
                    {events.length}
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-1">
                {events.slice(0, 2).map((event) => (
                  <Link
                    key={event.id}
                    href={`/files/${event.fileId}`}
                    title={`${event.label} — ${event.fileLabel}`}
                    className={cn(
                      "flex items-center gap-1 truncate rounded-md px-1.5 py-1 text-[12px] font-medium leading-tight transition-colors",
                      event.kind === "closing"
                        ? "bg-ink-950 text-white hover:bg-ink-800"
                        : event.overdue
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                    )}
                  >
                    {event.kind === "closing" ? (
                      <KeyRound className="h-2.5 w-2.5 shrink-0" />
                    ) : (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          STATUS_THEME[event.status].solid
                        )}
                      />
                    )}
                    <span className="truncate">{event.label}</span>
                  </Link>
                ))}
                {events.length > 2 && (
                  <p className="px-1.5 text-[12px] text-ink-500">
                    +{events.length - 2} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-hairline bg-canvas px-5 py-3">
        <span className="flex items-center gap-1.5 text-[13px] text-ink-500">
          <CalendarDays className="h-3 w-3 text-ink-500" />
          Task deadline
        </span>
        <span className="flex items-center gap-1.5 text-[13px] text-ink-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink-950" />
          Closing date
        </span>
        <span className="flex items-center gap-1.5 text-[13px] text-ink-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
          Overdue
        </span>
      </div>
    </div>
  );
}
