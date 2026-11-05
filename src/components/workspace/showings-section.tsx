"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import { SoftCompleteNudge, WorkInstructions, WorkStatusChip } from "@/components/workspace/work-ui";
import { VisitsBoard } from "@/components/visits/visits-board";
import { GuidelineListEditor } from "@/components/workspace/listing-guidelines";
import { VisitorAlertsEditor } from "@/components/workspace/visitor-alerts";
import { ensureWorkFields } from "@/lib/work/defaults";
import { alertsFromShowings } from "@/lib/work/visitor-alerts";
import { showingsReadiness } from "@/lib/work/readiness";
import type { ListingGuideline, TransactionFile, VisitorAlertFields } from "@/types";

export function ShowingsSection({ file }: { file: TransactionFile }) {
  const updateShowings = useTransactionsStore((s) => s.updateShowings);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const allFiles = useTransactionsStore((s) => s.files);
  const catalog = useMemo(() => allFiles.map(ensureWorkFields), [allFiles]);
  const [access, setAccess] = useState({
    lockboxCode: file.showings.lockboxCode,
    showingWindows: file.showings.showingWindows,
    noticeHours: file.showings.noticeHours,
    alarmInstructions: file.showings.alarmInstructions,
  });
  const [guidelines, setGuidelines] = useState<ListingGuideline[]>(file.showings.guidelines ?? []);
  const [alerts, setAlerts] = useState<VisitorAlertFields>(() => alertsFromShowings(file.showings));

  const readiness = showingsReadiness({ ...file.showings, ...access }, file.side);
  const task = file.checklist.find((t) =>
    file.side === "listing" ? t.id === "showing_instructions" : t.id === "showings_buyer"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel icon={ClipboardList}>
          {file.side === "listing" ? "Visits on this house" : "Visits for this buyer"}
        </SectionLabel>
        <WorkStatusChip status={readiness} />
      </div>

      <WorkInstructions
        title={
          file.side === "listing"
            ? "Keep one visit per booking, then add feedback"
            : "Log each tour once, then add feedback"
        }
        steps={
          file.side === "listing"
            ? [
                "Check cameras or a pet only if a visitor could be surprised at the door",
                "Add everyday rules in Visit guidelines, then book the visit",
                "Add feedback after the visit if it did not come in with the booking",
              ]
            : [
                "Fetch tours when ShowingTime email is connected, or add one by hand",
                "Use the house address. If it matches a listing, camera and pet warnings show here",
                "Add feedback after the tour",
              ]
        }
      />

      {file.side === "listing" && (
        <div className="space-y-4">
          <VisitorAlertsEditor value={alerts} onChange={setAlerts} idPrefix="visit-alert" />
          <div className="space-y-3 rounded-2xl border border-hairline p-4">
            <p className="text-[14px] font-semibold text-ink-900">Visit guidelines</p>
            <p className="text-[14px] leading-relaxed text-ink-500">
              Ordinary rules for this house. They sit under the bright warning box, and they are copied into the demo email.
            </p>
            <GuidelineListEditor guidelines={guidelines} onChange={setGuidelines} inputId="visit-guideline" />
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => updateShowings(file.id, { guidelines, ...alerts })}>
              Save visit rules
            </Button>
          </div>
        </div>
      )}

      <VisitsBoard files={[file]} lockedFileId={file.id} listings={catalog} />

      <p className="text-[14px] text-ink-500">
        All of your folders are on the{" "}
        <Link href="/visits" className="font-semibold text-ink-800 underline-offset-2 hover:underline">
          Visits
        </Link>{" "}
        page.
      </p>

      {file.side === "listing" && (
        <div className="space-y-3 border-t border-hairline pt-5">
          <p className="text-[14px] font-semibold text-ink-900">How buyers get in</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="lockbox"
              label="Lockbox code"
              value={access.lockboxCode}
              onChange={(e) => setAccess({ ...access, lockboxCode: e.target.value })}
            />
            <Input
              id="notice"
              label="Notice (hours)"
              type="number"
              value={access.noticeHours}
              onChange={(e) => setAccess({ ...access, noticeHours: Number(e.target.value) })}
            />
            <Input
              id="windows"
              label="Showing windows"
              className="sm:col-span-2"
              value={access.showingWindows}
              onChange={(e) => setAccess({ ...access, showingWindows: e.target.value })}
            />
            <Textarea
              id="alarm"
              label="Alarm instructions"
              rows={2}
              className="sm:col-span-2"
              value={access.alarmInstructions}
              onChange={(e) => setAccess({ ...access, alarmInstructions: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => updateShowings(file.id, access)}>Save access instructions</Button>
          </div>
        </div>
      )}

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
