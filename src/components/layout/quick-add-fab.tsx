"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Plus, StickyNote, UserPlus } from "lucide-react";
import { format, setHours, setMinutes, startOfTomorrow } from "date-fns";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { useAuthStore, useTransactionsStore } from "@/stores";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils/cn";
import type { TransactionFile } from "@/types";

type QuickAction = "note" | "reminder" | null;

/**
 * Floats above every signed-in screen so an agent can log a note, set a
 * reminder, or save a new contact without leaving whatever they're looking
 * at — including a different listing than the one they're in.
 */
export function QuickAddFab({ currentFile }: { currentFile?: TransactionFile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState<QuickAction>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const items: { key: string; label: string; icon: React.ElementType; onSelect: () => void }[] = [
    { key: "note", label: "New note", icon: StickyNote, onSelect: () => setAction("note") },
    { key: "reminder", label: "New reminder", icon: Bell, onSelect: () => setAction("reminder") },
    { key: "contact", label: "New contact", icon: UserPlus, onSelect: () => router.push("/files/new") },
  ];

  return (
    <>
      <div
        ref={menuRef}
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-5 z-40 flex flex-col items-end gap-3 sm:right-7"
      >
        {menuOpen && (
          <div className="flex flex-col items-end gap-2">
            {items.map((item, i) => (
              <button
                key={item.key}
                onClick={() => {
                  setMenuOpen(false);
                  item.onSelect();
                }}
                style={{ animationDelay: `${i * 30}ms` }}
                className="flex animate-rise items-center gap-2.5 rounded-full bg-ink-950 py-2.5 pl-4 pr-2.5 text-[14px] font-semibold text-white shadow-lg shadow-ink-950/25 ring-1 ring-inset ring-white/10 transition-transform hover:scale-[1.03] active:scale-95"
              >
                {item.label}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <item.icon className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close quick add menu" : "Quick add"}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-itera-500 to-itera-600 text-white shadow-lg shadow-itera-600/30 ring-1 ring-inset ring-white/15 transition-transform duration-200 hover:from-itera-600 hover:to-itera-700 active:scale-95"
        >
          <Plus className={cn("h-6 w-6 transition-transform duration-200", menuOpen && "rotate-45")} />
        </button>
      </div>

      <NoteModal open={action === "note"} onClose={() => setAction(null)} currentFile={currentFile} />
      <ReminderModal open={action === "reminder"} onClose={() => setAction(null)} currentFile={currentFile} />
    </>
  );
}

/** Every open file, most recently touched first, labeled the way a card is. */
function useFileOptions() {
  const files = useTransactionsStore((s) => s.files);
  return [...files].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

function fileLabel(file: TransactionFile) {
  const address = file.propertyAddress && file.propertyAddress !== "TBD" ? file.propertyAddress : null;
  return address ? `${address} — ${file.clientName}` : file.clientName;
}

function FilePicker({
  value,
  onChange,
  files,
}: {
  value: string;
  onChange: (id: string) => void;
  files: TransactionFile[];
}) {
  return (
    <Select id="quickTargetFile" label="Listing or buyer file" value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="" disabled>
        Choose a file…
      </option>
      {files.map((f) => (
        <option key={f.id} value={f.id}>
          {fileLabel(f)}
        </option>
      ))}
    </Select>
  );
}

function NoteModal({
  open,
  onClose,
  currentFile,
}: {
  open: boolean;
  onClose: () => void;
  currentFile?: TransactionFile;
}) {
  const files = useFileOptions();
  const addNote = useTransactionsStore((s) => s.addNote);
  const user = useAuthStore((s) => s.user);
  const [fileId, setFileId] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) {
      setFileId(currentFile?.id ?? "");
      setContent("");
    }
  }, [open, currentFile]);

  const targetFile = files.find((f) => f.id === fileId);

  const save = () => {
    if (!fileId || !content.trim()) return;
    addNote(fileId, content.trim(), user?.name ?? "Agent");
    toast.success("Note added", targetFile ? fileLabel(targetFile) : undefined);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick note"
      description="Logged to the file's activity feed."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!fileId || !content.trim()}>
            Add note
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FilePicker value={fileId} onChange={setFileId} files={files} />
        <Textarea
          id="quickNoteContent"
          label="Note"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Called the client, they want to push showings to the weekend…"
          autoFocus
        />
      </div>
    </Modal>
  );
}

function ReminderModal({
  open,
  onClose,
  currentFile,
}: {
  open: boolean;
  onClose: () => void;
  currentFile?: TransactionFile;
}) {
  const files = useFileOptions();
  const addReminder = useTransactionsStore((s) => s.addReminder);
  const [fileId, setFileId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(startOfTomorrow(), "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");

  useEffect(() => {
    if (open) {
      setFileId(currentFile?.id ?? "");
      setTitle("");
      setDate(format(startOfTomorrow(), "yyyy-MM-dd"));
      setTime("09:00");
    }
  }, [open, currentFile]);

  const save = () => {
    if (!fileId || !title.trim()) return;
    const [h, m] = time.split(":").map(Number);
    const dueAt = setMinutes(setHours(new Date(`${date}T00:00:00`), h), m);
    addReminder(fileId, { title: title.trim(), dueAt: dueAt.toISOString() });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick reminder"
      description="ITERA will alert you at that time, wherever you are in the app."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!fileId || !title.trim()}>
            Set reminder
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FilePicker value={fileId} onChange={setFileId} files={files} />
        <Input
          id="quickReminderTitle"
          label="Remind me to…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Follow up on inspection response"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <Input id="quickReminderDate" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input id="quickReminderTime" label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
