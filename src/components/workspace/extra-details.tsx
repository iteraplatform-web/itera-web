"use client";

import { useState } from "react";
import { Check, Pencil, Pin, PinOff, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";
import type { CustomField, CustomFieldType, TransactionFile } from "@/types";

const TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  yesno: "Yes / No",
};

/** Ideas shown when the list is empty, so a new agent knows what this is for. */
const SUGGESTIONS = ["Gate code", "Kids' names", "Moving truck date", "HOA contact", "Lender name", "Anniversary"];

function display(field: CustomField) {
  if (field.type === "yesno") return field.value === "yes" ? "Yes" : "No";
  if (field.type === "date" && field.value) {
    const d = new Date(`${field.value}T12:00:00`);
    return isNaN(d.getTime()) ? field.value : d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  }
  return field.value || "—";
}

/**
 * Anything about a client the standard form has no box for. Each detail can be
 * pinned to the file's Overview so it is seen before the next call.
 */
export function ExtraDetails({ file }: { file: TransactionFile }) {
  const addCustomField = useTransactionsStore((s) => s.addCustomField);
  const updateCustomField = useTransactionsStore((s) => s.updateCustomField);
  const removeCustomField = useTransactionsStore((s) => s.removeCustomField);

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomFieldType>("text");
  const [value, setValue] = useState("");
  const [pinned, setPinned] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const fields = file.customFields ?? [];

  const reset = () => {
    setLabel("");
    setType("text");
    setValue("");
    setPinned(true);
  };

  const save = () => {
    if (!label.trim()) return;
    addCustomField(file.id, {
      label: label.trim(),
      type,
      value: type === "yesno" ? value || "no" : value.trim(),
      pinned,
      source: "manual",
    });
    reset();
    setAdding(false);
  };

  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-semibold text-ink-950">Extra details</h3>
          <p className="mt-1 max-w-xl text-[15px] text-ink-500">
            Anything worth remembering that doesn&apos;t have its own box. Pin a detail to show it on the Overview.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Add a detail
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="mt-5 rounded-xl bg-canvas px-4 py-4">
          <p className="text-[15px] text-ink-600">Nothing added yet. For example:</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setLabel(s);
                  setAdding(true);
                }}
                className="rounded-full bg-surface px-3.5 py-1.5 text-[14px] font-medium text-ink-700 ring-1 ring-inset ring-hairline-strong hover:ring-itera-400"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
          {fields.map((f) => (
            <li key={f.id} className="flex flex-col gap-2 bg-surface px-4 py-3.5 sm:flex-row sm:items-center">
              <div className="min-w-0 sm:w-56 sm:shrink-0">
                <p className="text-[15px] font-semibold text-ink-900">{f.label}</p>
                <p className="text-[13px] text-ink-500">
                  {TYPE_LABELS[f.type]}
                  {f.source === "import" && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-violet-700">
                      <Sparkles className="h-3 w-3" />
                      from spreadsheet
                    </span>
                  )}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                {editingId === f.id ? (
                  <div className="flex items-center gap-2">
                    <FieldInput id={`edit-${f.id}`} type={f.type} value={editValue} onChange={setEditValue} />
                    <Button
                      size="sm"
                      onClick={() => {
                        updateCustomField(file.id, f.id, { value: editValue });
                        setEditingId(null);
                      }}
                      aria-label="Save"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} aria-label="Cancel">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-[16px] text-ink-800">{display(f)}</p>
                )}
              </div>

              {editingId !== f.id && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="xs"
                    variant={f.pinned ? "subtle" : "ghost"}
                    onClick={() => updateCustomField(file.id, f.id, { pinned: !f.pinned })}
                    title={f.pinned ? "Shown on Overview — click to unpin" : "Pin to Overview"}
                  >
                    {f.pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                    {f.pinned ? "Pinned" : "Pin"}
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(f.id);
                      setEditValue(f.value);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => removeCustomField(file.id, f.id)} aria-label={`Remove ${f.label}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={adding}
        onClose={() => {
          setAdding(false);
          reset();
        }}
        title="Add a detail"
        description="Saved on this file only. You can change or remove it any time."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={!label.trim()}>
              Save detail
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input id="cf-label" label="What is it called?" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Gate code" autoFocus />
          <Select id="cf-type" label="What kind of answer?" value={type} onChange={(e) => setType(e.target.value as CustomFieldType)}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <div className="space-y-1.5">
            <label htmlFor="cf-value" className="block text-[14px] font-medium text-ink-700">
              Value
            </label>
            <FieldInput id="cf-value" type={type} value={value} onChange={setValue} />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-canvas px-4 py-3">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-5 w-5 accent-itera-600" />
            <span className="text-[15px] text-ink-800">Show it on the file&apos;s Overview</span>
          </label>
        </div>
      </Modal>
    </section>
  );
}

function FieldInput({
  id,
  type,
  value,
  onChange,
}: {
  id: string;
  type: CustomFieldType;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    "block w-full rounded-xl border-0 bg-surface px-3.5 py-2.5 text-[15px] text-ink-950 ring-1 ring-inset ring-hairline-strong focus:outline-none focus:ring-2 focus:ring-itera-500";
  if (type === "yesno") {
    return (
      <div className="inline-flex rounded-xl bg-ink-100 p-1">
        {["yes", "no"].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "rounded-lg px-5 py-2 text-[15px] font-semibold capitalize",
              (value || "no") === v ? "bg-surface text-ink-950 shadow-xs" : "text-ink-600"
            )}
          >
            {v}
          </button>
        ))}
      </div>
    );
  }
  return (
    <input
      id={id}
      type={type === "number" ? "number" : type === "date" ? "date" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={base}
    />
  );
}
