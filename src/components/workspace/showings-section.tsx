"use client";

import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { v4 as uuid } from "uuid";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import { SoftCompleteNudge, WorkInstructions, WorkStatusChip } from "@/components/workspace/work-ui";
import { formatDate } from "@/lib/utils/dates";
import { showingsReadiness } from "@/lib/work/readiness";
import type { ShowingAppointment, ShowingFeedbackSentiment, TransactionFile } from "@/types";

export function ShowingsSection({ file }: { file: TransactionFile }) {
  const updateShowings = useTransactionsStore((s) => s.updateShowings);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const [draft, setDraft] = useState(file.showings);
  const [appt, setAppt] = useState({
    agentOrBuyer: "",
    propertyAddress: "",
    feedback: "",
    sentiment: "warm" as ShowingFeedbackSentiment,
    scheduledAt: new Date().toISOString().slice(0, 16),
  });

  const readiness = showingsReadiness(draft, file.side);
  const task = file.checklist.find((t) =>
    file.side === "listing" ? t.id === "showing_instructions" : t.id === "showings_buyer"
  );

  const logShowing = () => {
    if (!appt.agentOrBuyer.trim()) return;
    const next: ShowingAppointment = {
      id: uuid(),
      scheduledAt: new Date(appt.scheduledAt).toISOString(),
      agentOrBuyer: appt.agentOrBuyer.trim(),
      feedback: appt.feedback,
      sentiment: appt.sentiment,
      propertyAddress: file.side === "buying" ? appt.propertyAddress : undefined,
    };
    const appointments = [next, ...draft.appointments];
    setDraft({ ...draft, appointments });
    setAppt({
      agentOrBuyer: "",
      propertyAddress: "",
      feedback: "",
      sentiment: "warm",
      scheduledAt: new Date().toISOString().slice(0, 16),
    });
  };

  const save = () => updateShowings(file.id, draft);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel icon={ClipboardList}>
          {file.side === "listing" ? "Showing instructions" : "Buyer showings"}
        </SectionLabel>
        <WorkStatusChip status={readiness} />
      </div>

      <WorkInstructions
        title={
          file.side === "listing"
            ? "Set up showing access on the file"
            : "Log tours and feedback for the buyer"
        }
        steps={
          file.side === "listing"
            ? [
                "Install the lockbox and record the code",
                "Set showing windows and notice requirements",
                "Confirm pet and alarm instructions with the seller",
              ]
            : [
                "Shortlist properties with the client",
                "Book showing appointments",
                "Record feedback on each property after the tour",
              ]
        }
      />

      {file.side === "listing" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="lockbox"
            label="Lockbox code"
            value={draft.lockboxCode}
            onChange={(e) => setDraft({ ...draft, lockboxCode: e.target.value })}
          />
          <Input
            id="notice"
            label="Notice (hours)"
            type="number"
            value={draft.noticeHours}
            onChange={(e) => setDraft({ ...draft, noticeHours: Number(e.target.value) })}
          />
          <Input
            id="windows"
            label="Showing windows"
            className="sm:col-span-2"
            value={draft.showingWindows}
            onChange={(e) => setDraft({ ...draft, showingWindows: e.target.value })}
          />
          <Textarea
            id="pets"
            label="Pet instructions"
            rows={2}
            value={draft.petInstructions}
            onChange={(e) => setDraft({ ...draft, petInstructions: e.target.value })}
          />
          <Textarea
            id="alarm"
            label="Alarm instructions"
            rows={2}
            value={draft.alarmInstructions}
            onChange={(e) => setDraft({ ...draft, alarmInstructions: e.target.value })}
          />
        </div>
      )}

      <div className="rounded-2xl border border-hairline p-4">
        <p className="mb-3 text-[14px] font-semibold text-ink-900">Log a showing</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="who"
            label={file.side === "listing" ? "Agent / buyer" : "Attendee"}
            value={appt.agentOrBuyer}
            onChange={(e) => setAppt({ ...appt, agentOrBuyer: e.target.value })}
          />
          <Input
            id="when"
            label="When"
            type="datetime-local"
            value={appt.scheduledAt}
            onChange={(e) => setAppt({ ...appt, scheduledAt: e.target.value })}
          />
          {file.side === "buying" && (
            <Input
              id="prop"
              label="Property address"
              className="sm:col-span-2"
              value={appt.propertyAddress}
              onChange={(e) => setAppt({ ...appt, propertyAddress: e.target.value })}
            />
          )}
          <Select
            id="sentiment"
            label="Sentiment"
            value={appt.sentiment}
            onChange={(e) =>
              setAppt({ ...appt, sentiment: e.target.value as ShowingFeedbackSentiment })
            }
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
            <option value="pass">Pass</option>
          </Select>
          <Textarea
            id="feedback"
            label="Feedback"
            rows={2}
            className="sm:col-span-2"
            value={appt.feedback}
            onChange={(e) => setAppt({ ...appt, feedback: e.target.value })}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" onClick={logShowing}>
            <Plus className="h-4 w-4" />
            Add showing
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {draft.appointments.length === 0 ? (
          <p className="text-[14px] text-ink-500">No showings logged yet.</p>
        ) : (
          draft.appointments.map((a) => (
            <div key={a.id} className="rounded-xl border border-hairline px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[14px] font-semibold text-ink-900">
                  {a.agentOrBuyer}
                  {a.propertyAddress ? ` · ${a.propertyAddress}` : ""}
                </p>
                <span className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                  {a.sentiment}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] text-ink-500">{formatDate(a.scheduledAt)}</p>
              {a.feedback && <p className="mt-1.5 text-[14px] text-ink-700">{a.feedback}</p>}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={save}>Save showings</Button>
      </div>

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
