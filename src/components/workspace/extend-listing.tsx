"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  currentListingAgreement,
  earliestExtendDay,
  fromDateInput,
  listingExtendError,
  toDateInput,
} from "@/lib/work/listing-expiry";
import type { TransactionFile } from "@/types";

/** Asks for a later listing end date and keeps the file active. */
export function ExtendListingButton({ file }: { file: TransactionFile }) {
  const extendListing = useTransactionsStore((s) => s.extendListing);
  const agreement = currentListingAgreement(file);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  if (!agreement?.termEnd) return null;

  const earliest = toDateInput(earliestExtendDay(agreement.termEnd).toISOString());

  const close = () => {
    setOpen(false);
    setDate("");
    setError("");
  };

  const save = () => {
    const iso = fromDateInput(date);
    if (!iso || !agreement.termEnd) {
      setError("Enter the new end date.");
      return;
    }
    const problem = listingExtendError(agreement.termEnd, iso);
    if (problem) {
      setError(problem);
      return;
    }
    extendListing(file.id, iso);
    close();
  };

  return (
    <>
      <Button size="xs" variant="secondary" onClick={() => setOpen(true)}>
        Extend
      </Button>
      <Modal
        open={open}
        onClose={close}
        title="Extend the listing"
        description={`The agreement ends ${format(parseISO(agreement.termEnd), "MMM d, yyyy")}. Pick a later day. The listing stays active.`}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={save}>Save new end date</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            id={`extend-${file.id}`}
            label="New end date"
            type="date"
            min={earliest}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setError("");
            }}
          />
          {error && <p className="text-[14px] text-red-600">{error}</p>}
        </div>
      </Modal>
    </>
  );
}
