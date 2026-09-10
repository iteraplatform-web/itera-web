"use client";

import { useState } from "react";
import { Camera, Hammer, Plus, Trash2 } from "lucide-react";
import { v4 as uuid } from "uuid";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/card";
import { SoftCompleteNudge, WorkInstructions, WorkStatusChip } from "@/components/workspace/work-ui";
import { mediaReadiness, propertyPrepReadiness } from "@/lib/work/readiness";
import type { PrepItem, PrepItemStatus, TransactionFile } from "@/types";

export function PropertyWorkSection({ file }: { file: TransactionFile }) {
  const updatePropertyPrep = useTransactionsStore((s) => s.updatePropertyPrep);
  const updateMedia = useTransactionsStore((s) => s.updateMedia);
  const toggleTask = useTransactionsStore((s) => s.toggleTask);
  const [prep, setPrep] = useState(file.propertyPrep);
  const [media, setMedia] = useState(file.media);
  const [newItem, setNewItem] = useState("");

  const prepReady = propertyPrepReadiness(prep);
  const mediaReady = mediaReadiness(media);
  const prepTask = file.checklist.find((t) => t.id === "property_prep");
  const photoTask = file.checklist.find((t) => t.id === "property_photos");

  const addItem = () => {
    if (!newItem.trim()) return;
    const item: PrepItem = {
      id: uuid(),
      title: newItem.trim(),
      category: "repair",
      status: "recommended",
    };
    setPrep({ ...prep, items: [...prep.items, item] });
    setNewItem("");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel icon={Hammer}>Property prep</SectionLabel>
          <WorkStatusChip status={prepReady} />
        </div>
        <WorkInstructions
          title="Prepare the property for market"
          steps={[
            "Walk the property and list recommended repairs",
            "Agree the staging plan with the seller",
            "Confirm the property is photo-ready",
          ]}
        />
        <Textarea
          id="staging"
          label="Staging plan"
          rows={2}
          value={prep.stagingPlan}
          onChange={(e) => setPrep({ ...prep, stagingPlan: e.target.value })}
        />
        <label className="flex items-center gap-2 text-[14px] text-ink-700">
          <input
            type="checkbox"
            checked={prep.photoReady}
            onChange={(e) => setPrep({ ...prep, photoReady: e.target.checked })}
            className="rounded border-hairline"
          />
          Property is photo-ready
        </label>
        <div className="space-y-2">
          {prep.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-canvas/50 px-3 py-2"
            >
              <span className="min-w-0 flex-1 text-[14px] font-medium text-ink-800">{item.title}</span>
              <Select
                value={item.status}
                onChange={(e) =>
                  setPrep({
                    ...prep,
                    items: prep.items.map((i) =>
                      i.id === item.id ? { ...i, status: e.target.value as PrepItemStatus } : i
                    ),
                  })
                }
                className="w-36"
              >
                <option value="recommended">Recommended</option>
                <option value="agreed">Agreed</option>
                <option value="done">Done</option>
                <option value="deferred">Deferred</option>
              </Select>
              <button
                type="button"
                onClick={() => setPrep({ ...prep, items: prep.items.filter((i) => i.id !== item.id) })}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="new-prep"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add repair or staging item…"
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <Button variant="secondary" onClick={addItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => updatePropertyPrep(file.id, prep)}>Save prep</Button>
        </div>
        {prepTask && (
          <SoftCompleteNudge
            ready={prepReady === "ready"}
            taskTitle={prepTask.title}
            taskCompleted={prepTask.status === "completed"}
            onComplete={() => toggleTask(file.id, prepTask.id)}
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel icon={Camera}>Photography</SectionLabel>
          <WorkStatusChip status={mediaReady} />
        </div>
        <WorkInstructions
          title="Schedule and select professional photos"
          steps={[
            "Book the photographer and confirm access",
            "Confirm the shot list including twilight and drone",
            "Review and select the final images",
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="photographer"
            label="Photographer"
            value={media.photographerName}
            onChange={(e) => setMedia({ ...media, photographerName: e.target.value })}
          />
          <Input
            id="shoot-date"
            label="Shoot date"
            type="date"
            value={media.shootDate ? media.shootDate.slice(0, 10) : ""}
            onChange={(e) =>
              setMedia({
                ...media,
                shootDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              })
            }
          />
        </div>
        <Textarea
          id="access"
          label="Access notes"
          rows={2}
          value={media.accessNotes}
          onChange={(e) => setMedia({ ...media, accessNotes: e.target.value })}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {media.shots.map((shot) => (
            <label
              key={shot.id}
              className="flex items-center gap-2 rounded-xl border border-hairline px-3 py-2.5 text-[14px]"
            >
              <input
                type="checkbox"
                checked={shot.selected}
                onChange={(e) =>
                  setMedia({
                    ...media,
                    shots: media.shots.map((s) =>
                      s.id === shot.id ? { ...s, selected: e.target.checked } : s
                    ),
                  })
                }
              />
              {shot.label}
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => updateMedia(file.id, media)}>Save media plan</Button>
        </div>
        {photoTask && (
          <SoftCompleteNudge
            ready={mediaReady === "ready"}
            taskTitle={photoTask.title}
            taskCompleted={photoTask.status === "completed"}
            onComplete={() => toggleTask(file.id, photoTask.id)}
          />
        )}
      </section>
    </div>
  );
}
