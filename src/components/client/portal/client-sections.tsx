"use client";

import { useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow, isToday, parseISO } from "date-fns";
import { v4 as uuid } from "uuid";
import {
  Check,
  ChevronDown,
  Circle,
  Clock,
  Eye,
  FileText,
  Hourglass,
  Loader,
  Send,
  Upload,
} from "lucide-react";
import { useAuthStore, useNotificationsStore, useTransactionsStore } from "@/stores";
import { useUploader } from "@/hooks/use-uploader";
import { useFocusTarget } from "@/hooks/use-focus-target";
import { putBlob } from "@/lib/files/blob-store";
import { DOCUMENT_ACCEPT, openDocument, rejectNonDocument } from "@/lib/files/open-document";
import { formatBytes } from "@/lib/files/upload";
import { UploadProgressList } from "@/components/ui/upload-progress";
import { Avatar } from "@/components/ui/misc";
import {
  getClientMilestones,
  getClientStage,
  getClientUpdates,
  getFaq,
  STAGE_INFO,
  STAGE_ORDER,
} from "@/lib/client/portal";
import { cn } from "@/lib/utils/cn";
import { PageTitle, PCard } from "./client-shell";
import type { Document, TransactionFile } from "@/types";
import type { UploadMeta } from "@/stores/transactions-store";

/* ═══ Progress ═══════════════════════════════════════════════════════ */

export function ClientProgress({ file }: { file: TransactionFile }) {
  const milestones = getClientMilestones(file);
  const current = getClientStage(file);
  const updates = getClientUpdates(file, 30);
  const side = file.side;

  return (
    <div>
      <PageTitle title="Your progress" sub="Every milestone from start to keys, and what each one means for you." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {STAGE_ORDER.map((stage, si) => {
            const items = milestones.filter((m) => m.stage === stage);
            const doneAll = items.length > 0 && items.every((m) => m.state === "done");
            const isCurrent = stage === current && file.status !== "closed";
            return (
              <section
                key={stage}
                className={cn(
                  "rounded-2xl border bg-surface p-5 shadow-sm",
                  isCurrent ? "border-itera-300 ring-4 ring-itera-50" : "border-hairline"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[19px] font-semibold text-ink-950">
                    <span className="tnum mr-2 text-ink-400">{si + 1}.</span>
                    {STAGE_INFO[stage][side]}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[13px] font-semibold",
                      doneAll ? "bg-emerald-100 text-emerald-800" : isCurrent ? "bg-itera-100 text-itera-800" : "bg-ink-100 text-ink-600"
                    )}
                  >
                    {doneAll ? "Complete" : isCurrent ? "You are here" : "Later"}
                  </span>
                </div>
                <p className="mt-1 text-[15px] text-ink-600">{STAGE_INFO[stage].blurb[side]}</p>

                <ol className="mt-4 space-y-3">
                  {items.map((m) => (
                    <li key={m.taskId} className="flex gap-3.5">
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          m.state === "done" ? "bg-emerald-500 text-white" : m.state === "now" ? "bg-itera-600 text-white" : "bg-ink-100 text-ink-400"
                        )}
                      >
                        {m.state === "done" ? (
                          <Check className="h-4 w-4" strokeWidth={3} />
                        ) : m.state === "now" ? (
                          <Loader className="h-4 w-4" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <p className={cn("text-[16px] font-semibold", m.state === "upcoming" ? "text-ink-500" : "text-ink-950")}>
                            {m.label}
                          </p>
                          {m.date && (
                            <p className="text-[14px] text-ink-500">
                              {m.state === "done" ? "Done " : m.state === "now" ? "Expected " : "Around "}
                              {format(parseISO(m.date), "MMM d")}
                            </p>
                          )}
                        </div>
                        <p className="text-[15px] leading-snug text-ink-600">{m.meaning}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>

        <PCard title="Everything that has happened" icon={Clock} className="self-start">
          {updates.length === 0 ? (
            <p className="text-[16px] text-ink-600">Nothing yet.</p>
          ) : (
            <ol className="relative space-y-4 pl-5">
              <span className="absolute bottom-1 left-[5px] top-1 w-px bg-hairline-strong" />
              {updates.map((u) => (
                <li key={u.id} className="relative">
                  <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-itera-500 ring-4 ring-surface" />
                  <p className="text-[15px] text-ink-800">{u.text}</p>
                  <p className="text-[13px] text-ink-500">{format(parseISO(u.at), "MMM d, yyyy")}</p>
                </li>
              ))}
            </ol>
          )}
        </PCard>
      </div>
    </div>
  );
}

/* ═══ Documents ══════════════════════════════════════════════════════ */

async function storeDoc(f: File): Promise<UploadMeta> {
  const blobId = `doc-${uuid()}`;
  await putBlob(blobId, f);
  return { blobId, sizeKb: Math.max(1, Math.round(f.size / 1024)), originalName: f.name, mimeType: f.type || "application/octet-stream" };
}

export function ClientDocuments({ file, focus }: { file: TransactionFile; focus?: string }) {
  useFocusTarget(focus);
  const fromYou = file.documents.filter((d) => d.status === "needed" && d.expectedFrom === "Client");
  const fromOthers = file.documents.filter((d) => d.status === "needed" && d.expectedFrom !== "Client");
  const copies = file.documents.filter((d) => d.status === "received");

  return (
    <div>
      <PageTitle title="Documents" sub="Upload what your agent has asked for, and keep a copy of everything that's in." />
      <div className="space-y-6">
        <PCard title={`Needed from you${fromYou.length ? ` (${fromYou.length})` : ""}`} icon={Upload}>
          {fromYou.length === 0 ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-4 text-[16px] text-emerald-900">
              You&apos;re all caught up — there&apos;s nothing to upload right now.
            </p>
          ) : (
            <ul className="space-y-3">
              {fromYou.map((d) => (
                <ClientUploadRow key={d.id} doc={d} file={file} />
              ))}
            </ul>
          )}
        </PCard>

        {fromOthers.length > 0 && (
          <PCard title="Being prepared by others" icon={Hourglass}>
            <p className="-mt-1 mb-3 text-[15px] text-ink-600">You don&apos;t need to do anything — these come from the people handling your sale.</p>
            <ul className="divide-y divide-hairline">
              {fromOthers.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-[16px] text-ink-800">{d.name}</span>
                  <span className="shrink-0 text-[14px] text-ink-500">From {d.expectedFrom}</span>
                </li>
              ))}
            </ul>
          </PCard>
        )}

        <PCard title={`Your copies (${copies.length})`} icon={FileText}>
          {copies.length === 0 ? (
            <p className="text-[16px] text-ink-600">Signed and received documents will appear here.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {copies.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  <FileText className="h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium text-ink-900">{d.name}</p>
                    <p className="text-[14px] text-ink-500">
                      {d.receivedAt ? `In since ${format(parseISO(d.receivedAt), "MMM d")}` : "On file"}
                      {d.sizeKb ? ` · ${formatBytes(d.sizeKb * 1024)}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => openDocument(d, file)}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-canvas px-4 text-[15px] font-semibold text-ink-800 ring-1 ring-inset ring-hairline hover:bg-ink-100"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                </li>
              ))}
            </ul>
          )}
        </PCard>
      </div>
    </div>
  );
}

function ClientUploadRow({ doc, file }: { doc: Document; file: TransactionFile }) {
  const markReceived = useTransactionsStore((s) => s.markDocumentReceived);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const input = useRef<HTMLInputElement>(null);
  const { items, upload, cancel, busy } = useUploader<UploadMeta>({
    kind: "document",
    accept: rejectNonDocument,
    store: storeDoc,
    onBatchDone: ([meta]) => {
      if (!meta) return;
      markReceived(file.id, doc.id, file.clientName, meta);
      // The agent hears about it in their notifications — no email needed.
      addNotification({
        fileId: file.id,
        title: "Client uploaded a document",
        message: `${file.clientName} uploaded the ${doc.name}.`,
        type: "success",
      });
    },
  });

  return (
    <li data-focus={doc.name} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold text-ink-950">{doc.name}</p>
          <p className="text-[15px] text-ink-600">A clear photo of each page works, or a PDF. Up to 25 MB.</p>
        </div>
        <button
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-itera-600 px-5 text-[16px] font-semibold text-white hover:bg-itera-700 disabled:opacity-60"
        >
          <Upload className="h-5 w-5" />
          {busy ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={input}
          type="file"
          accept={DOCUMENT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload([f]);
            e.target.value = "";
          }}
        />
      </div>
      {items.length > 0 && (
        <div className="mt-3">
          <UploadProgressList items={items} onCancel={cancel} />
        </div>
      )}
    </li>
  );
}

/* ═══ Messages ═══════════════════════════════════════════════════════ */

const QUICK_REPLIES = ["Sounds good, thank you!", "Can you give me a call?", "What happens next?", "When do you need this by?"];

export function ClientMessages({ file }: { file: TransactionFile }) {
  const agent = useAuthStore((s) => s.user);
  const sendMessage = useTransactionsStore((s) => s.sendMessage);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const [text, setText] = useState("");
  const thread = useRef<HTMLDivElement>(null);

  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: "smooth" });
  }, [file.messages.length]);

  const send = (content: string) => {
    const c = content.trim();
    if (!c) return;
    sendMessage(file.id, c, "client");
    addNotification({ fileId: file.id, title: `Message from ${file.clientName}`, message: c.slice(0, 120), type: "info" });
    setText("");
  };

  let lastDay = "";

  return (
    <div>
      <PageTitle title="Messages" sub={`Only you and ${agent?.name ?? "your agent"} can see this conversation.`} />
      <section className="flex h-[min(68vh,720px)] flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-sm">
        <header className="flex items-center gap-3 border-b border-hairline px-5 py-4">
          <Avatar name={agent?.name ?? "Agent"} size="md" />
          <div>
            <p className="text-[16px] font-semibold text-ink-950">{agent?.name ?? "Your agent"}</p>
            <p className="text-[14px] text-ink-500">Usually replies within a few hours</p>
          </div>
        </header>

        <div ref={thread} className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 px-4 py-5 sm:px-6">
          {file.messages.length === 0 && (
            <p className="py-10 text-center text-[16px] text-ink-500">No messages yet. Say hello — your agent will see it straight away.</p>
          )}
          {file.messages.map((m) => {
            const day = format(parseISO(m.sentAt), "yyyy-MM-dd");
            const showDay = day !== lastDay;
            lastDay = day;
            const mine = m.sender === "client";
            return (
              <div key={m.id}>
                {showDay && (
                  <p className="my-3 text-center text-[13px] font-medium text-ink-500">
                    {isToday(parseISO(m.sentAt)) ? "Today" : format(parseISO(m.sentAt), "EEEE, MMMM d")}
                  </p>
                )}
                <div className={cn("flex", mine && "justify-end")}>
                  <div className={cn("max-w-[80%]", mine && "text-right")}>
                    <div
                      className={cn(
                        "inline-block rounded-2xl px-4 py-2.5 text-left text-[16px] leading-relaxed",
                        mine ? "rounded-br-md bg-itera-600 text-white" : "rounded-bl-md bg-surface text-ink-900 ring-1 ring-inset ring-hairline"
                      )}
                    >
                      {m.content}
                    </div>
                    <p className="mt-1 px-1 text-[13px] text-ink-500">{format(parseISO(m.sentAt), "h:mm a")}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-hairline p-3">
          <div className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="shrink-0 rounded-full bg-ink-100 px-3.5 py-2 text-[14px] font-medium text-ink-700 hover:bg-ink-200"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(text);
                }
              }}
              rows={1}
              placeholder="Write a message…"
              aria-label="Message"
              className="max-h-32 min-h-[48px] flex-1 resize-none rounded-xl border-0 bg-canvas px-4 py-3 text-[16px] text-ink-950 ring-1 ring-inset ring-hairline placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-itera-500"
            />
            <button
              onClick={() => send(text)}
              disabled={!text.trim()}
              className="flex h-12 items-center gap-2 rounded-xl bg-itera-600 px-5 text-[16px] font-semibold text-white hover:bg-itera-700 disabled:opacity-40"
            >
              <Send className="h-5 w-5" />
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══ Help ═══════════════════════════════════════════════════════════ */

export function ClientHelp({ file }: { file: TransactionFile }) {
  const stage = getClientStage(file);
  const faq = getFaq(file.side);
  const [open, setOpen] = useState<number | null>(0);
  const nowItems = getClientMilestones(file).filter((m) => m.state === "now");

  return (
    <div>
      <PageTitle title="Help" sub="Plain answers to the questions most people ask." />
      <div className="space-y-6">
        <PCard title="Where you are right now">
          <p className="text-[18px] font-semibold text-ink-950">{STAGE_INFO[stage][file.side]}</p>
          <p className="mt-1 text-[16px] leading-relaxed text-ink-600">{STAGE_INFO[stage].blurb[file.side]}</p>
          {nowItems.length > 0 && (
            <>
              <p className="mt-4 text-[15px] font-semibold text-ink-800">Happening now:</p>
              <ul className="mt-2 space-y-2">
                {nowItems.map((m) => (
                  <li key={m.taskId} className="rounded-xl bg-canvas px-4 py-3">
                    <p className="text-[16px] font-semibold text-ink-900">{m.label}</p>
                    <p className="text-[15px] text-ink-600">{m.meaning}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </PCard>

        <PCard title="Common questions">
          <ul className="divide-y divide-hairline">
            {faq.map((item, i) => (
              <li key={item.q}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  aria-expanded={open === i}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="text-[17px] font-medium text-ink-900">{item.q}</span>
                  <ChevronDown className={cn("h-5 w-5 shrink-0 text-ink-500 transition-transform", open === i && "rotate-180")} />
                </button>
                {open === i && <p className="pb-4 text-[16px] leading-relaxed text-ink-600">{item.a}</p>}
              </li>
            ))}
          </ul>
        </PCard>
      </div>
    </div>
  );
}

