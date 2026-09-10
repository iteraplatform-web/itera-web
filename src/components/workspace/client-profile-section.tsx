"use client";

import { ExtraDetails } from "@/components/workspace/extra-details";
import { IntakeFlags } from "@/components/workspace/intake-flags";
import { useState } from "react";
import { UserRound } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import { SoftCompleteNudge, WorkInstructions, WorkStatusChip } from "@/components/workspace/work-ui";
import { clientProfileReadiness } from "@/lib/work/readiness";
import type { TransactionFile } from "@/types";

export function ClientProfileSection({ file }: { file: TransactionFile }) {
  const updateClientProfile = useTransactionsStore((s) => s.updateClientProfile);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const [draft, setDraft] = useState(file.clientProfile);
  const readiness = clientProfileReadiness(draft);
  const task = file.checklist.find((t) => t.id === "crm_profile");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel icon={UserRound}>Client on file</SectionLabel>
        <WorkStatusChip status={readiness} />
      </div>

      <WorkInstructions
        title="Complete the client profile in ITERA"
        steps={[
          "Confirm name, phone, email, and property address on the header",
          "Capture how the relationship started",
          "Record goals, timeline, and preferred contact",
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input id="cp-name" label="Client name" value={file.clientName} disabled />
        <Input id="cp-phone" label="Phone" value={file.phone} disabled />
        <Input id="cp-email" label="Email" value={file.email} disabled className="sm:col-span-2" />
      </div>

      <Textarea
        id="cp-history"
        label="Relationship history"
        rows={3}
        value={draft.relationshipHistory}
        onChange={(e) => setDraft({ ...draft, relationshipHistory: e.target.value })}
        placeholder="Where you met, what was discussed…"
      />
      <Textarea
        id="cp-goals"
        label="Real estate goals"
        rows={2}
        value={draft.goals}
        onChange={(e) => setDraft({ ...draft, goals: e.target.value })}
      />
      <Input
        id="cp-timeline"
        label="Timeline"
        value={draft.timeline}
        onChange={(e) => setDraft({ ...draft, timeline: e.target.value })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          id="cp-contact"
          label="Preferred contact"
          value={draft.preferredContact}
          onChange={(e) => setDraft({ ...draft, preferredContact: e.target.value })}
        >
          <option value="">Select…</option>
          <option value="Email">Email</option>
          <option value="Phone">Phone</option>
          <option value="Text">Text</option>
        </Select>
        <Input
          id="cp-time"
          label="Best time to reach"
          value={draft.preferredContactTime}
          onChange={(e) => setDraft({ ...draft, preferredContactTime: e.target.value })}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => updateClientProfile(file.id, draft)}>Save profile</Button>
      </div>

      <ExtraDetails file={file} />
      <IntakeFlags file={file} />

      {task && (
        <SoftCompleteNudge
          ready={readiness === "ready"}
          taskTitle={task.title}
          taskCompleted={task.status === "completed"}
          onComplete={() => toggleTask(file.id, task.id)}
        />
      )}
    </div>
  );
}
