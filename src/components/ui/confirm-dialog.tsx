"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/** A yes-or-no question before an important money change. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-ink-700">{message}</p>
    </Modal>
  );
}
