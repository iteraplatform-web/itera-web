"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { GripVertical, Info } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { useNotificationsStore } from "@/stores/notifications-store";
import { STATUS_THEME, KANBAN_COLUMNS } from "@/lib/utils/status-theme";
import { daysRemaining, isOverdue } from "@/lib/utils/dates";
import { getFileProgress, getMostUrgentTask } from "@/lib/selectors/file-metrics";
import { Badge } from "@/components/ui/badge";
import type { TransactionFile, TransactionStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

export function KanbanBoard({ files }: { files: TransactionFile[] }) {
  const updateFileStatus = useTransactionsStore((s) => s.updateFileStatus);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const activeFile = activeId ? files.find((f) => f.id === activeId) : null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const fileId = active.id as string;
    const newStatus = over.id as TransactionStatus;
    const file = files.find((f) => f.id === fileId);

    if (!file || file.status === newStatus) return;
    if (!KANBAN_COLUMNS.includes(newStatus)) return;

    const prevLabel = STATUS_THEME[file.status].label;
    const newLabel = STATUS_THEME[newStatus].label;

    // The store raises its own toast and broadcasts to the client tab.
    updateFileStatus(fileId, newStatus);

    addNotification({
      fileId,
      title: "Status changed",
      message: `${file.propertyAddress || file.clientName} moved from ${prevLabel} to ${newLabel}.`,
      type: newStatus === "terminated" || newStatus === "dropped" ? "urgent" : "info",
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="mb-3 flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface px-4 py-2.5 shadow-xs">
        <p className="flex items-center gap-2 text-[14px] text-ink-600">
          <Info className="h-3.5 w-3.5 shrink-0 text-ink-500" />
          <span>
            <span className="font-semibold text-ink-900">Drag a card</span> between columns to
            change its status
          </span>
        </p>
        <p className="tnum shrink-0 text-[13px] text-ink-500">{files.length} on board</p>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-6">
        {KANBAN_COLUMNS.map((status) => {
          const columnFiles = files.filter((f) => f.status === status);
          return (
            <KanbanColumn key={status} status={status} count={columnFiles.length}>
              {columnFiles.map((file) => (
                <KanbanCard key={file.id} file={file} />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeFile ? <KanbanCard file={activeFile} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  count,
  children,
}: {
  status: TransactionStatus;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const theme = STATUS_THEME[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[272px] shrink-0 flex-col rounded-2xl border transition-colors",
        isOver ? "border-itera-400 bg-itera-50/60" : "border-hairline bg-canvas-deep/50"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", theme.solid)} />
          <h3 className="truncate text-[14px] font-semibold text-ink-800">{theme.label}</h3>
        </div>
        <span className="tnum shrink-0 rounded-full bg-surface px-2 py-0.5 text-[13px] font-bold text-ink-500 ring-1 ring-inset ring-hairline">
          {count}
        </span>
      </div>

      {/* Column accent under the header ties the column to its status colour. */}
      <div className="mx-3.5 h-px bg-hairline" />

      <div className="flex min-h-[140px] flex-1 flex-col gap-2 p-2.5">
        {count === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-hairline-strong py-8">
            <p className="text-[13px] text-ink-400">Drop a file here</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function KanbanCard({ file, isOverlay }: { file: TransactionFile; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: file.id,
  });

  const nextTask = getMostUrgentTask(file);
  const progress = getFileProgress(file);
  const days = nextTask?.dueDate ? daysRemaining(nextTask.dueDate) : null;
  const late = nextTask?.dueDate ? isOverdue(nextTask.dueDate) : false;

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      className={cn(
        "rounded-xl border border-hairline bg-surface shadow-xs transition-shadow",
        isOverlay && "rotate-2 shadow-xl ring-2 ring-itera-300",
        // The original stays in place but fades while its overlay is dragged.
        isDragging && !isOverlay && "opacity-30",
        !isOverlay && "hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-1 p-3">
        <button
          {...listeners}
          {...attributes}
          className="-ml-1 mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-ink-200 transition-colors hover:bg-ink-100 hover:text-ink-500 active:cursor-grabbing"
          aria-label="Drag to change status"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <Link href={`/files/${file.id}`} className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[14px] font-semibold leading-tight text-ink-950">
              {file.clientName}
            </p>
            <span className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-500">
              {file.side === "listing" ? "List" : "Buy"}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-500">
            {file.propertyAddress}
          </p>

          {file.listPrice > 0 && (
            <p className="tnum mt-2 text-[15px] font-bold tracking-[-0.02em] text-ink-950">
              ${file.listPrice.toLocaleString()}
            </p>
          )}

          {(file.isReferral || file.isRelocation || file.offers.length > 1) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {file.isReferral && (
                <Badge variant="purple" size="xs">
                  Referral
                </Badge>
              )}
              {file.isRelocation && (
                <Badge variant="default" size="xs">
                  Relocation
                </Badge>
              )}
              {file.offers.length > 1 && (
                <Badge variant="amber" size="xs">
                  {file.offers.length} offers
                </Badge>
              )}
            </div>
          )}

          {nextTask && (
            <div className="mt-2.5 rounded-lg bg-canvas px-2.5 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-500">
                Next
              </p>
              <p className="mt-0.5 truncate text-[13px] font-medium text-ink-800">
                {nextTask.title}
              </p>
              {days !== null && (
                <p
                  className={cn(
                    "tnum mt-0.5 text-[13px] font-semibold",
                    late || days <= 3
                      ? "text-red-600"
                      : days <= 7
                      ? "text-amber-600"
                      : "text-emerald-600"
                  )}
                >
                  {late
                    ? `${Math.abs(days)} days overdue`
                    : days === 0
                    ? "Due today"
                    : `${days} days left`}
                </p>
              )}
            </div>
          )}

          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[12px] text-ink-500">
              <span>Checklist</span>
              <span className="tnum font-semibold text-ink-600">{progress}%</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-100">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  progress === 100 ? "bg-emerald-500" : "bg-itera-500"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
