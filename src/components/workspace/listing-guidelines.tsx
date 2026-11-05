"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { v4 as uuid } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ListingGuideline } from "@/types";

/** Add and remove visit rules. The parent decides when they are saved. */
export function GuidelineListEditor({
  guidelines,
  onChange,
  inputId = "guideline",
}: {
  guidelines: ListingGuideline[];
  onChange: (next: ListingGuideline[]) => void;
  inputId?: string;
}) {
  const [text, setText] = useState("");

  const add = () => {
    const value = text.trim();
    if (!value) return;
    onChange([...guidelines, { id: uuid(), text: value }]);
    setText("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            id={inputId}
            label="Add a guideline"
            value={text}
            placeholder="Ring the doorbell and wait. Two people max."
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <Button type="button" variant="secondary" onClick={add} disabled={!text.trim()}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {guidelines.length === 0 ? (
        <p className="text-[14px] text-ink-500">No guidelines yet. Add one rule at a time.</p>
      ) : (
        <ul className="space-y-2">
          {guidelines.map((rule, index) => (
            <li
              key={rule.id}
              className="flex items-start gap-3 rounded-xl border border-hairline bg-canvas px-3 py-2.5"
            >
              <span className="tnum mt-0.5 text-[13px] font-semibold text-ink-400">{index + 1}</span>
              <p className="min-w-0 flex-1 text-[14px] leading-relaxed text-ink-800">{rule.text}</p>
              <button
                type="button"
                onClick={() => onChange(guidelines.filter((item) => item.id !== rule.id))}
                className="rounded-lg p-1 text-ink-400 hover:bg-surface hover:text-ink-800"
                aria-label={`Remove guideline ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
