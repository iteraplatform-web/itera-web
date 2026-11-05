"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { SentEmail } from "@/types";

/** Opens the demo email a visiting agent would read. */
export function VisitNoticeModal({
  email,
  onClose,
}: {
  email: SentEmail | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={Boolean(email)}
      onClose={onClose}
      title="What the visiting agent sees"
      description="This message is saved on the file. Nothing was sent through Gmail."
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {email && (
        <div className="overflow-hidden rounded-xl border border-hairline">
          <dl className="divide-y divide-hairline bg-canvas text-[14px]">
            <div className="flex gap-3 px-4 py-2.5">
              <dt className="w-16 shrink-0 font-medium text-ink-500">To</dt>
              <dd className="min-w-0 flex-1 text-ink-900">{email.to || "Visiting agent"}</dd>
            </div>
            <div className="flex gap-3 px-4 py-2.5">
              <dt className="w-16 shrink-0 font-medium text-ink-500">Subject</dt>
              <dd className="min-w-0 flex-1 font-semibold text-ink-950">{email.subject}</dd>
            </div>
          </dl>
          <div className="border-t border-hairline bg-surface p-5">
            <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-ink-700">
              {email.body}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  );
}
