"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Mail, MessageSquare, Send } from "lucide-react";
import { EMAIL_TEMPLATES, interpolateTemplate } from "@/lib/checklist/engine";
import { useAuthStore, useTransactionsStore } from "@/stores";
import { formatDate } from "@/lib/utils/dates";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { SectionLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { useFocusTarget } from "@/hooks/use-focus-target";
import type { EmailTemplate, TransactionFile } from "@/types";

export function CommunicationsSection({ file, focus }: { file: TransactionFile; focus?: string }) {
  const sendEmail = useTransactionsStore((s) => s.sendEmail);
  const sendMessage = useTransactionsStore((s) => s.sendMessage);
  const user = useAuthStore((s) => s.user);

  const [message, setMessage] = useState("");
  // Arriving from a checklist button opens that email ready to review and send.
  const [preview, setPreview] = useState<EmailTemplate | null>(
    () => EMAIL_TEMPLATES.find((t) => t.id === focus) ?? null
  );
  useFocusTarget(focus && !EMAIL_TEMPLATES.some((t) => t.id === focus) ? focus : undefined);
  const threadRef = useRef<HTMLDivElement>(null);

  // Keep the thread pinned to the newest message.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [file.messages.length]);

  const ctx = { agentName: user?.name ?? "Your Agent", brokerage: user?.brokerage ?? "" };

  const handleSendMessage = () => {
    const text = message.trim();
    if (!text) return;
    sendMessage(file.id, text, "agent");
    setMessage("");
  };

  const confirmSend = () => {
    if (!preview) return;
    sendEmail(file.id, preview.id);
    setPreview(null);
  };

  return (
    <div className="space-y-8">
      {/* ── Email templates ───────────────────────────────────── */}
      <section>
        <SectionLabel icon={Mail}>Email templates</SectionLabel>
        <p className="-mt-1 mb-3 text-[14px] text-ink-500">
          Each one fills itself in from this file. Preview before anything goes out.
        </p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {EMAIL_TEMPLATES.map((template) => {
            const sentCount = file.sentEmails.filter((e) => e.templateId === template.id).length;
            return (
              <button
                key={template.id}
                onClick={() => setPreview(template)}
                className="group rounded-xl border border-hairline bg-surface p-3.5 text-left transition-all hover:border-hairline-strong hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-semibold text-ink-950">{template.name}</p>
                  {sentCount > 0 && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[12px] font-bold text-emerald-700">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      Sent{sentCount > 1 ? ` ×${sentCount}` : ""}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-[13px] text-ink-500">
                  {interpolateTemplate(template.subject, file, ctx)}
                </p>
                <span className="mt-2.5 inline-block text-[13px] font-semibold text-itera-600 group-hover:text-itera-700">
                  Preview &amp; send →
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Sent record ───────────────────────────────────────── */}
      {file.sentEmails.length > 0 && (
        <section>
          <SectionLabel>Sent</SectionLabel>
          <ul className="overflow-hidden rounded-xl border border-hairline">
            {file.sentEmails.map((email, i) => (
              <li
                key={email.id}
                className={cn(
                  "flex items-center gap-3 bg-surface px-4 py-2.5",
                  i > 0 && "border-t border-hairline"
                )}
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink-900">{email.subject}</p>
                  <p className="text-[13px] text-ink-500">
                    {email.sentBy} · {formatDate(email.sentAt, "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Client thread ─────────────────────────────────────── */}
      <section data-focus="thread">
        <SectionLabel icon={MessageSquare}>
          Message thread with {file.clientName}
        </SectionLabel>
        <p className="-mt-1 mb-3 text-[14px] text-ink-500">
          Exactly what the client sees on their own side.
        </p>

        <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas/50">
          <div ref={threadRef} className="max-h-[320px] space-y-3 overflow-y-auto p-4">
            {file.messages.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No messages yet"
                description="Anything you send here appears instantly on the client's side."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              file.messages.map((msg) => {
                const fromAgent = msg.sender === "agent";
                return (
                  <div
                    key={msg.id}
                    className={cn("flex items-end gap-2", fromAgent && "flex-row-reverse")}
                  >
                    <Avatar
                      name={fromAgent ? user?.name ?? "Agent" : file.clientName}
                      size="xs"
                      className="mb-4"
                    />
                    <div className={cn("max-w-[75%]", fromAgent && "text-right")}>
                      <div
                        className={cn(
                          "inline-block rounded-2xl px-3.5 py-2 text-left text-[14px] leading-relaxed",
                          fromAgent
                            ? "rounded-br-md bg-itera-600 text-white"
                            : "rounded-bl-md bg-surface text-ink-800 ring-1 ring-inset ring-hairline"
                        )}
                      >
                        {msg.content}
                      </div>
                      <p className="mt-1 px-1 text-[13px] text-ink-500">
                        {fromAgent ? "You" : file.clientName.split(" ")[0]} ·{" "}
                        {formatDate(msg.sentAt, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-hairline bg-surface p-2.5">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              placeholder={`Message ${file.clientName.split(" ")[0]}…`}
              className="flex-1 rounded-xl border-0 bg-canvas px-3.5 py-2.5 text-sm text-ink-950 ring-1 ring-inset ring-transparent placeholder:text-ink-400 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-itera-500"
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Preview before sending ────────────────────────────── */}
      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ""}
        description="Details are pulled from this file. Nothing is actually sent in the demonstration."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Cancel
            </Button>
            <Button onClick={confirmSend}>
              <Send className="h-4 w-4" />
              Send to {file.clientName.split(" ")[0]}
            </Button>
          </>
        }
      >
        {preview && (
          <div className="overflow-hidden rounded-xl border border-hairline">
            <dl className="divide-y divide-hairline bg-canvas text-[14px]">
              <div className="flex gap-3 px-4 py-2.5">
                <dt className="w-16 shrink-0 font-medium text-ink-500">To</dt>
                <dd className="min-w-0 flex-1 truncate text-ink-900">
                  {file.clientName} &lt;{file.email || "no email on file"}&gt;
                </dd>
              </div>
              <div className="flex gap-3 px-4 py-2.5">
                <dt className="w-16 shrink-0 font-medium text-ink-500">Subject</dt>
                <dd className="min-w-0 flex-1 font-semibold text-ink-950">
                  {interpolateTemplate(preview.subject, file, ctx)}
                </dd>
              </div>
            </dl>
            <div className="border-t border-hairline bg-surface p-5">
              <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-ink-700">
                {interpolateTemplate(preview.body, file, ctx)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
