"use client";

import { useState } from "react";
import { LineChart, Plus, Trash2 } from "lucide-react";
import { v4 as uuid } from "uuid";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import {
  DeepLinkBanner,
  SoftCompleteNudge,
  WorkInstructions,
  WorkStatusChip,
} from "@/components/workspace/work-ui";
import { cmaReadiness } from "@/lib/work/readiness";
import type { CmaComp, TransactionFile } from "@/types";

export function PricingSection({
  file,
  full = false,
}: {
  file: TransactionFile;
  full?: boolean;
}) {
  const updateCma = useTransactionsStore((s) => s.updateCma);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const [draft, setDraft] = useState(file.cma);
  const readiness = cmaReadiness(draft);
  const task = file.checklist.find((t) => t.id === "cma");

  const adjustedAvg =
    draft.comps.length > 0
      ? Math.round(
          draft.comps.reduce((sum, c) => sum + c.salePrice + c.adjustment, 0) / draft.comps.length
        )
      : null;

  const addComp = () => {
    const comp: CmaComp = {
      id: uuid(),
      address: "",
      salePrice: 0,
      soldDate: new Date().toISOString(),
      beds: 0,
      baths: 0,
      sqft: 0,
      adjustment: 0,
    };
    setDraft({ ...draft, comps: [...draft.comps, comp] });
  };

  const body = (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel icon={LineChart}>Comparative market analysis</SectionLabel>
        <WorkStatusChip status={readiness} />
      </div>

      {!full && (
        <DeepLinkBanner
          href={`/files/${file.id}/pricing`}
          label="Open full CMA workspace"
          description="Add comps, adjust, and present pricing in a dedicated view."
        />
      )}

      <WorkInstructions
        title="Complete the CMA inside ITERA"
        steps={[
          "Pull comparable sales from the last six months",
          "Adjust for condition, lot, and square footage",
          "Present the pricing recommendation to the seller",
        ]}
      />

      <div className="space-y-3">
        {draft.comps.map((comp, idx) => (
          <div key={comp.id} className="rounded-2xl border border-hairline p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                Comp {idx + 1}
              </p>
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...draft, comps: draft.comps.filter((c) => c.id !== comp.id) })
                }
                className="rounded-lg p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                id={`${comp.id}-addr`}
                label="Address"
                className="sm:col-span-2 lg:col-span-3"
                value={comp.address}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    comps: draft.comps.map((c) =>
                      c.id === comp.id ? { ...c, address: e.target.value } : c
                    ),
                  })
                }
              />
              <Input
                id={`${comp.id}-price`}
                label="Sale price"
                type="number"
                leading="$"
                value={comp.salePrice || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    comps: draft.comps.map((c) =>
                      c.id === comp.id ? { ...c, salePrice: Number(e.target.value) } : c
                    ),
                  })
                }
              />
              <Input
                id={`${comp.id}-adj`}
                label="Adjustment"
                type="number"
                leading="$"
                value={comp.adjustment || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    comps: draft.comps.map((c) =>
                      c.id === comp.id ? { ...c, adjustment: Number(e.target.value) } : c
                    ),
                  })
                }
              />
              <Input
                id={`${comp.id}-sqft`}
                label="Sqft"
                type="number"
                value={comp.sqft || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    comps: draft.comps.map((c) =>
                      c.id === comp.id ? { ...c, sqft: Number(e.target.value) } : c
                    ),
                  })
                }
              />
              <Input
                id={`${comp.id}-beds`}
                label="Beds"
                type="number"
                value={comp.beds || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    comps: draft.comps.map((c) =>
                      c.id === comp.id ? { ...c, beds: Number(e.target.value) } : c
                    ),
                  })
                }
              />
              <Input
                id={`${comp.id}-baths`}
                label="Baths"
                type="number"
                value={comp.baths || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    comps: draft.comps.map((c) =>
                      c.id === comp.id ? { ...c, baths: Number(e.target.value) } : c
                    ),
                  })
                }
              />
              <Input
                id={`${comp.id}-notes`}
                label="Notes"
                value={comp.notes || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    comps: draft.comps.map((c) =>
                      c.id === comp.id ? { ...c, notes: e.target.value } : c
                    ),
                  })
                }
              />
            </div>
          </div>
        ))}
        <Button variant="secondary" onClick={addComp}>
          <Plus className="h-4 w-4" />
          Add comparable
        </Button>
      </div>

      {adjustedAvg !== null && (
        <p className="text-[14px] text-ink-600">
          Adjusted average of comps:{" "}
          <span className="tnum font-semibold text-ink-900">${adjustedAvg.toLocaleString()}</span>
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          id="rec-price"
          label="Recommended list price"
          type="number"
          leading="$"
          value={draft.recommendedPrice || ""}
          onChange={(e) => setDraft({ ...draft, recommendedPrice: Number(e.target.value) })}
        />
        <Input
          id="presented"
          label="Presented to seller"
          type="date"
          value={draft.presentedAt ? draft.presentedAt.slice(0, 10) : ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              presentedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
            })
          }
        />
      </div>
      <Textarea
        id="pricing-notes"
        label="Pricing notes"
        rows={3}
        value={draft.pricingNotes}
        onChange={(e) => setDraft({ ...draft, pricingNotes: e.target.value })}
      />
      <Input
        id="seller-response"
        label="Seller response"
        value={draft.sellerResponse || ""}
        onChange={(e) => setDraft({ ...draft, sellerResponse: e.target.value })}
      />

      <div className="flex justify-end">
        <Button onClick={() => updateCma(file.id, draft)}>Save CMA</Button>
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

  return body;
}
