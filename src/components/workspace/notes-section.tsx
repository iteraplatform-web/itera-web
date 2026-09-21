"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileText,
  History,
  Home,
  LineChart,
  Megaphone,
  MessageSquare,
  StickyNote,
  UserRound,
  Zap,
  Bell,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useAuthStore, useTransactionsStore } from "@/stores";
import { formatDate } from "@/lib/utils/dates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { SectionLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { ActivityEntry, TransactionFile } from "@/types";

const ACTIVITY_STYLE: Record<
  ActivityEntry["type"],
  { icon: React.ElementType; tone: string }
> = {
  task_completed: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  status_change: { icon: ArrowRightLeft, tone: "bg-itera-50 text-itera-600" },
  document_received: { icon: FileText, tone: "bg-ink-100 text-ink-600" },
  message_sent: { icon: MessageSquare, tone: "bg-ink-100 text-ink-600" },
  note_added: { icon: StickyNote, tone: "bg-amber-50 text-amber-600" },
  cma_updated: { icon: LineChart, tone: "bg-itera-50 text-itera-600" },
  listing_updated: { icon: Home, tone: "bg-ink-100 text-ink-600" },
  showing_logged: { icon: ClipboardList, tone: "bg-amber-50 text-amber-600" },
  marketing_updated: { icon: Megaphone, tone: "bg-ink-100 text-ink-600" },
  milestone_updated: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  profile_updated: { icon: UserRound, tone: "bg-ink-100 text-ink-600" },
  prep_updated: { icon: Camera, tone: "bg-amber-50 text-amber-600" },
  media_updated: { icon: Camera, tone: "bg-ink-100 text-ink-600" },
  agreement_updated: { icon: FileText, tone: "bg-itera-50 text-itera-600" },
  automation: { icon: Zap, tone: "bg-ink-100 text-ink-600" },
  photo_added: { icon: Camera, tone: "bg-ink-100 text-ink-600" },
  field_changed: { icon: UserRound, tone: "bg-ink-100 text-ink-600" },
  reminder: { icon: Bell, tone: "bg-amber-50 text-amber-600" },
};

export function NotesSection({ file }: { file: TransactionFile }) {
  const addNote = useTransactionsStore((s) => s.addNote);
  const user = useAuthStore((s) => s.user);
  const [note, setNote] = useState("");
  const [showAll, setShowAll] = useState(false);

  const handleAdd = () => {
    const text = note.trim();
    if (!text) return;
    addNote(file.id, text, user?.name ?? "Agent");
    setNote("");
  };

  const visibleActivity = showAll ? file.activity : file.activity.slice(0, 12);

  return (
    <div className="space-y-8">
      {/* ── Notes ─────────────────────────────────────────────── */}
      <section>
        <SectionLabel icon={StickyNote}>Notes</SectionLabel>

        <div className="rounded-2xl border border-hairline bg-canvas/60 p-3">
          <Textarea
            id="newNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              // Cmd/Ctrl+Enter saves without reaching for the mouse.
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
            }}
            rows={2}
            placeholder="Anything worth remembering about this file…"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[13px] text-ink-500">⌘ + Enter to save</p>
            <Button size="sm" onClick={handleAdd} disabled={!note.trim()}>
              Add note
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {file.notes.length === 0 ? (
            <EmptyState
              icon={StickyNote}
              title="No notes yet"
              description="Notes stay internal — the client never sees them."
              className="py-10"
            />
          ) : (
            file.notes.map((n) => (
              <article
                key={n.id}
                className="rounded-xl border border-hairline bg-surface p-4 shadow-xs"
              >
                <p className="text-[14px] leading-relaxed text-ink-800">{n.content}</p>
                <div className="mt-2.5 flex items-center gap-2 border-t border-hairline pt-2.5">
                  <Avatar name={n.author} size="xs" />
                  <span className="text-[13px] font-medium text-ink-600">{n.author}</span>
                  <span className="text-[13px] text-ink-400">·</span>
                  <span className="text-[13px] text-ink-500">
                    {formatDate(n.createdAt, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* ── Activity log ──────────────────────────────────────── */}
      <section>
        <SectionLabel icon={History}>
          Activity log ({file.activity.length})
        </SectionLabel>
        <p className="-mt-1 mb-3 text-[14px] text-ink-500">
          Every task completed, status change, and document received — with who and when.
        </p>

        <ol className="relative space-y-0.5 pl-1">
          <span className="absolute bottom-4 left-[15px] top-4 w-px bg-hairline" />
          {visibleActivity.map((entry) => {
            const style = ACTIVITY_STYLE[entry.type] ?? ACTIVITY_STYLE.status_change;
            const Icon = style.icon;
            return (
              <li key={entry.id} className="relative flex gap-3 py-2">
                <span
                  className={cn(
                    "z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-surface",
                    style.tone
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-snug text-ink-800">{entry.description}</p>
                  <p className="mt-0.5 text-[13px] text-ink-500">
                    {entry.actor} ·{" "}
                    {formatDistanceToNow(parseISO(entry.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {file.activity.length > 12 && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-3"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show less" : `Show all ${file.activity.length} entries`}
          </Button>
        )}
      </section>
    </div>
  );
}
