"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import {
  DeepLinkBanner,
  SoftCompleteNudge,
  WorkInstructions,
  WorkStatusChip,
} from "@/components/workspace/work-ui";
import { GuidelineListEditor } from "@/components/workspace/listing-guidelines";
import { VisitorAlertsEditor } from "@/components/workspace/visitor-alerts";
import { alertsFromShowings } from "@/lib/work/visitor-alerts";
import { listingReadiness } from "@/lib/work/readiness";
import type { ListingGuideline, ListingPublishStatus, TransactionFile, VisitorAlertFields } from "@/types";

export function ListingDetailsSection({
  file,
  full = false,
}: {
  file: TransactionFile;
  full?: boolean;
}) {
  const updateListingDetails = useTransactionsStore((s) => s.updateListingDetails);
  const updateShowings = useTransactionsStore((s) => s.updateShowings);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const [draft, setDraft] = useState(file.listingDetails);
  const [guidelines, setGuidelines] = useState<ListingGuideline[]>(file.showings.guidelines ?? []);
  const [alerts, setAlerts] = useState<VisitorAlertFields>(() => alertsFromShowings(file.showings));
  const readiness = listingReadiness(draft);
  const task = file.checklist.find((t) => t.id === "mls_entry");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel icon={Home}>Listing sheet</SectionLabel>
        <WorkStatusChip status={readiness} />
      </div>

      {!full && (
        <DeepLinkBanner
          href={`/files/${file.id}/listing`}
          label="Open full listing sheet"
          description="Edit beds, baths, features, and remarks in a dedicated page."
        />
      )}

      <WorkInstructions
        title="Capture the listing as the system of record"
        steps={[
          "Enter property details, room dimensions, and features",
          "Write public and private remarks",
          "Mark ready, then record when published to MLS externally",
        ]}
        externalNote="ITERA does not push to the MLS board — keep the sheet here and mark publish status after you enter it elsewhere."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          id="beds"
          label="Beds"
          type="number"
          value={draft.beds || ""}
          onChange={(e) => setDraft({ ...draft, beds: Number(e.target.value) })}
        />
        <Input
          id="baths"
          label="Baths"
          type="number"
          step="0.5"
          value={draft.baths || ""}
          onChange={(e) => setDraft({ ...draft, baths: Number(e.target.value) })}
        />
        <Input
          id="sqft"
          label="Sqft"
          type="number"
          value={draft.sqft || ""}
          onChange={(e) => setDraft({ ...draft, sqft: Number(e.target.value) })}
        />
        <Input
          id="year"
          label="Year built"
          type="number"
          value={draft.yearBuilt || ""}
          onChange={(e) => setDraft({ ...draft, yearBuilt: Number(e.target.value) })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="type"
          label="Property type"
          value={draft.propertyType}
          onChange={(e) => setDraft({ ...draft, propertyType: e.target.value })}
        />
        <Input
          id="lot"
          label="Lot size"
          value={draft.lotSize || ""}
          onChange={(e) => setDraft({ ...draft, lotSize: e.target.value })}
        />
      </div>

      <Textarea
        id="features"
        label="Features"
        rows={2}
        value={draft.features}
        onChange={(e) => setDraft({ ...draft, features: e.target.value })}
      />
      <Textarea
        id="public"
        label="Public remarks"
        rows={full ? 5 : 3}
        value={draft.publicRemarks}
        onChange={(e) => setDraft({ ...draft, publicRemarks: e.target.value })}
      />
      <Textarea
        id="private"
        label="Private remarks"
        rows={2}
        value={draft.privateRemarks}
        onChange={(e) => setDraft({ ...draft, privateRemarks: e.target.value })}
      />

      <Select
        id="publish"
        label="Publish status"
        value={draft.publishStatus}
        onChange={(e) =>
          setDraft({ ...draft, publishStatus: e.target.value as ListingPublishStatus })
        }
      >
        <option value="draft">Draft</option>
        <option value="ready">Ready to publish</option>
        <option value="published_external">Published externally (MLS)</option>
      </Select>

      <div className="space-y-4 border-t border-hairline pt-5">
        <VisitorAlertsEditor value={alerts} onChange={setAlerts} idPrefix="listing-alert" />
        <div className="space-y-3">
          <p className="text-[14px] font-semibold text-ink-900">Visit guidelines</p>
          <p className="text-[14px] leading-relaxed text-ink-500">
            Ordinary rules for other agents. For example: ring the doorbell, two people max, no night visits.
          </p>
          <GuidelineListEditor guidelines={guidelines} onChange={setGuidelines} inputId="listing-guideline" />
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => updateShowings(file.id, { guidelines, ...alerts })}>
            Save visit rules
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => updateListingDetails(file.id, draft)}>Save listing sheet</Button>
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
