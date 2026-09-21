"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PortalAccessCard } from "@/components/workspace/portal-access-card";
import type { TransactionFile } from "@/types";

/**
 * Shown once, right after a file is created: what was built, and the client's
 * portal login — so it can be handed over (or tested) straight away.
 */
export function NewFileWelcome({ file }: { file: TransactionFile }) {
  const router = useRouter();
  const close = () => router.replace(`/files/${file.id}`);
  const docs = file.documents.length;

  return (
    <Modal
      open
      onClose={close}
      title="File created"
      size="lg"
      footer={<Button onClick={close}>Go to the file</Button>}
    >
      <div className="space-y-5">
        <p className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3.5 text-[16px] text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <span>
            {file.clientName}&apos;s file is ready with <strong>{file.checklist.length} checklist tasks</strong> and{" "}
            <strong>{docs} documents</strong> to collect.
          </span>
        </p>
        <PortalAccessCard file={file} compact />
      </div>
    </Modal>
  );
}
