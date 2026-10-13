"use client";

import { useMemo, useState } from "react";
import { Download, Send, Share2 } from "lucide-react";
import { useAuthStore, useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import {
  buildReferralPdf,
  referralFileName,
  referralFormLines,
  type ReferralForm,
} from "@/lib/referral/form";
import type { TransactionFile } from "@/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReferralFormCard({ file }: { file: TransactionFile }) {
  const user = useAuthStore((s) => s.user);
  const recordReferralSent = useTransactionsStore((s) => s.recordReferralSent);

  const [receivingAgent, setReceivingAgent] = useState("");
  const [receivingEmail, setReceivingEmail] = useState("");
  const [referralPercentage, setReferralPercentage] = useState(
    file.referralPercentage ? String(file.referralPercentage) : "25"
  );
  const [situation, setSituation] = useState(file.clientProfile?.relationshipHistory ?? "");
  const [previewing, setPreviewing] = useState(false);

  const form: ReferralForm = useMemo(
    () => ({
      clientName: file.clientName,
      phone: file.phone,
      email: file.email,
      side: file.side,
      propertyAddress: file.propertyAddress,
      referringAgent: user?.name ?? "Your name",
      referringBrokerage: user?.brokerage ?? "",
      receivingAgent: receivingAgent.trim(),
      receivingEmail: receivingEmail.trim(),
      referralPercentage: Number(referralPercentage) || 0,
      goals: file.clientProfile?.goals ?? "",
      timeline: file.clientProfile?.timeline ?? "",
      preferredContact: file.clientProfile?.preferredContact || file.preferredContact || "",
      preferredContactTime: file.clientProfile?.preferredContactTime || file.preferredContactTime || "",
      situation: situation.trim(),
    }),
    [file, user, receivingAgent, receivingEmail, referralPercentage, situation]
  );

  const ready = Boolean(form.receivingAgent && form.receivingEmail);
  const lines = referralFormLines(form);

  const download = () => {
    downloadBlob(buildReferralPdf(form), referralFileName(file.clientName));
  };

  const send = () => {
    if (!ready) return;
    download();
    recordReferralSent(file.id, form.receivingAgent, form.receivingEmail, user?.name);
    setPreviewing(true);
  };

  return (
    <section className="rounded-2xl border border-itera-200 bg-itera-50/40 p-4 sm:p-5">
      <SectionLabel icon={Share2}>Referral form for another agent</SectionLabel>
      <p className="-mt-1 mb-4 text-[14px] leading-relaxed text-ink-500">
        Fills a one-page form from this client. Send it to the agent who will take the
        client. They can upload that same PDF on New file, and ITERA will build the profile.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="referral-to-name"
          label="Other agent's name *"
          value={receivingAgent}
          onChange={(e) => setReceivingAgent(e.target.value)}
          placeholder="Helen Cho"
        />
        <Input
          id="referral-to-email"
          label="Other agent's email *"
          type="email"
          value={receivingEmail}
          onChange={(e) => setReceivingEmail(e.target.value)}
          placeholder="helen@northline.com"
        />
        <Input
          id="referral-fee"
          label="Referral fee"
          type="number"
          trailing="%"
          value={referralPercentage}
          onChange={(e) => setReferralPercentage(e.target.value)}
          placeholder="25"
        />
      </div>

      <div className="mt-3">
        <Textarea
          id="referral-situation"
          label="Note for the other agent"
          rows={3}
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="Why you are referring them, and anything the other agent should know."
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPreviewing((v) => !v)}>
          {previewing ? "Hide form" : "Preview form"}
        </Button>
        <Button size="sm" variant="secondary" onClick={download}>
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </Button>
        <Button size="sm" onClick={send} disabled={!ready}>
          <Send className="h-3.5 w-3.5" />
          Send form
        </Button>
      </div>
      {!ready && (
        <p className="mt-2 text-[13px] text-ink-500">
          Add the other agent&apos;s name and email before sending.
        </p>
      )}

      {previewing && (
        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-hairline bg-surface p-4 font-sans text-[13px] leading-relaxed text-ink-800">
          {lines.join("\n")}
        </pre>
      )}
    </section>
  );
}
