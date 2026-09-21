"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Sparkles,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useTransactionsStore } from "@/stores";
import { toast } from "@/stores/toast-store";
import {
  buildSampleSpreadsheet,
  checkRows,
  COLUMNS,
  downloadTemplate,
  matchColumns,
  readSpreadsheet,
  type CheckedRow,
  type ColumnMapping,
  type SheetData,
} from "@/lib/import/spreadsheet";
import { formatBytes } from "@/lib/files/upload";
import { cn } from "@/lib/utils/cn";

type Stage = "choose" | "checking" | "review" | "importing" | "done";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ImportPage() {
  const files = useTransactionsStore((s) => s.files);
  const importFiles = useTransactionsStore((s) => s.importFiles);

  const [stage, setStage] = useState<Stage>("choose");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<{ name: string; size: number } | null>(null);
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [rows, setRows] = useState<CheckedRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState({ done: 0, total: 0, label: "" });
  const [created, setCreated] = useState<{ id: string; label: string }[]>([]);
  const [filter, setFilter] = useState<"all" | "ready" | "attention" | "blocked">("all");

  /* ── 1. Read and check ─────────────────────────────────────────── */

  const analyse = async (file: File) => {
    setError(null);
    setSource({ name: file.name, size: file.size });
    setStage("checking");
    setProgress({ done: 0, total: 1, label: "Opening the spreadsheet" });
    try {
      await sleep(250);
      const data = await readSpreadsheet(file);
      setProgress({ done: 0, total: data.rows.length, label: "Matching your columns" });
      await sleep(350);
      const map = matchColumns(data.headers);

      // Check rows in small batches so progress reflects real work.
      const checked: CheckedRow[] = [];
      const seen = new Map<string, number>();
      for (let i = 0; i < data.rows.length; i += 3) {
        checked.push(...checkRows(data, map, files, i, i + 3, seen));
        setProgress({ done: Math.min(i + 3, data.rows.length), total: data.rows.length, label: `Checking row ${Math.min(i + 3, data.rows.length)} of ${data.rows.length}` });
        await sleep(90);
      }

      setSheet(data);
      setMapping(map);
      setRows(checked);
      // Pre-select everything importable that isn't a duplicate.
      setSelected(new Set(checked.filter((r) => r.result && !r.duplicateOf).map((r) => r.rowNumber)));
      setStage("review");
    } catch (e) {
      setError((e as Error).message || "That file couldn't be read.");
      setStage("choose");
    }
  };

  /* ── 2. Import ─────────────────────────────────────────────────── */

  const runImport = async () => {
    const chosen = rows.filter((r) => r.result && selected.has(r.rowNumber));
    setStage("importing");
    const made: { id: string; label: string }[] = [];
    for (let i = 0; i < chosen.length; i++) {
      const r = chosen[i];
      setProgress({ done: i, total: chosen.length, label: `Building the checklist for ${r.summary.client}` });
      await sleep(260);
      const [id] = importFiles([r.result!]);
      made.push({ id, label: `${r.summary.client} — ${r.summary.address}` });
    }
    setProgress({ done: chosen.length, total: chosen.length, label: "Finished" });
    setCreated(made);
    await sleep(300);
    setStage("done");
    toast.success(`${made.length} file${made.length === 1 ? "" : "s"} imported`, "Each one has its own checklist and documents list");
  };

  const reset = () => {
    setStage("choose");
    setSheet(null);
    setRows([]);
    setCreated([]);
    setSource(null);
  };

  const counts = useMemo(() => {
    const blocked = rows.filter((r) => !r.result).length;
    const dupes = rows.filter((r) => r.result && r.duplicateOf).length;
    const attention = rows.filter((r) => r.result && !r.duplicateOf && r.issues.length > 0).length;
    const ready = rows.length - blocked - dupes - attention;
    return { blocked, dupes, attention, ready };
  }, [rows]);

  return (
    <AppShell crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Import Spreadsheet" }]}>
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-[32px] font-medium leading-tight tracking-[-0.01em] text-ink-950">Import from a spreadsheet</h1>
        <p className="mt-2 max-w-2xl text-[16px] text-ink-500">
          Bring in many listings and buyers at once. Every row becomes a full file with its own checklist, deadlines, and
          documents list — exactly as if you had entered it by hand.
        </p>

        <Steps stage={stage} />

        {stage === "choose" && <ChooseStep onFile={analyse} error={error} />}

        {(stage === "checking" || stage === "importing") && (
          <ProgressPanel
            title={stage === "checking" ? `Checking ${source?.name ?? "your file"}` : "Creating your files"}
            sub={source && stage === "checking" ? formatBytes(source.size) : undefined}
            {...progress}
          />
        )}

        {stage === "review" && sheet && mapping && (
          <div className="mt-8 space-y-6">
            <div className="grid gap-3 sm:grid-cols-4">
              <Count tone="green" value={counts.ready} label="Ready to import" />
              <Count tone="amber" value={counts.attention} label="Can import — worth a look" />
              <Count tone="ink" value={counts.dupes} label="Look like duplicates" />
              <Count tone="red" value={counts.blocked} label="Need fixing first" />
            </div>

            <ColumnsPanel sheet={sheet} mapping={mapping} />

            {mapping.missingRequired.length > 0 ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="flex items-center gap-2 text-[16px] font-semibold text-red-800">
                  <XCircle className="h-5 w-5" />
                  Some required columns are missing
                </p>
                <p className="mt-1 text-[15px] text-red-700">
                  Add {mapping.missingRequired.map((c) => `“${c.header}”`).join(", ")} to your spreadsheet and upload it again. The
                  template has every column already set up.
                </p>
              </div>
            ) : (
              <RowsTable rows={rows} selected={selected} setSelected={setSelected} filter={filter} setFilter={setFilter} />
            )}

            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface/95 p-4 shadow-lg backdrop-blur">
              <p className="text-[15px] text-ink-700">
                <span className="tnum font-semibold text-ink-950">{selected.size}</span> of {rows.length} rows selected from{" "}
                <span className="font-medium">{source?.name}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={reset}>
                  Choose a different file
                </Button>
                <Button onClick={runImport} disabled={selected.size === 0 || mapping.missingRequired.length > 0}>
                  Import {selected.size} file{selected.size === 1 ? "" : "s"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-surface p-6 shadow-sm sm:p-8">
            <p className="flex items-center gap-3 text-[22px] font-bold text-ink-950">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              {created.length} file{created.length === 1 ? "" : "s"} imported
            </p>
            <p className="mt-2 text-[16px] text-ink-500">
              They are on your Home screen now. Each client with an email also has a portal login, shown beside their file.
            </p>
            <ul className="mt-5 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
              {created.map((c) => {
                const access = files.find((f) => f.id === c.id)?.portalAccess;
                return (
                  <li key={c.id}>
                    <Link href={`/files/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-[15px] text-ink-800 hover:bg-canvas">
                      <span className="min-w-0 flex-1 truncate">{c.label}</span>
                      {access && (
                        <span className="font-mono text-[14px] text-ink-600" title="Client portal login">
                          {access.email} · {access.password}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/dashboard">
                <Button>Go to Home</Button>
              </Link>
              <Button variant="secondary" onClick={reset}>
                Import another spreadsheet
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────── */

function Steps({ stage }: { stage: Stage }) {
  const order: { key: Stage[]; label: string }[] = [
    { key: ["choose"], label: "Choose a file" },
    { key: ["checking"], label: "Check" },
    { key: ["review"], label: "Review" },
    { key: ["importing", "done"], label: "Import" },
  ];
  const idx = order.findIndex((o) => o.key.includes(stage));
  return (
    <ol className="mt-7 flex flex-wrap items-center gap-2">
      {order.map((o, i) => (
        <li key={o.label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold",
              i < idx || stage === "done" ? "bg-emerald-100 text-emerald-800" : i === idx ? "bg-ink-950 text-white" : "bg-ink-100 text-ink-500"
            )}
          >
            <span className="tnum">{i + 1}</span>
            {o.label}
          </span>
          {i < order.length - 1 && <span className="h-px w-5 bg-hairline-strong" />}
        </li>
      ))}
    </ol>
  );
}

function ChooseStep({ onFile, error }: { onFile: (f: File) => void; error: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
          }}
          className={cn(
            "flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
            dragging ? "border-itera-500 bg-itera-50" : "border-hairline-strong bg-surface"
          )}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-itera-50 text-itera-600">
            <UploadCloud className="h-7 w-7" />
          </span>
          <p className="mt-4 text-[18px] font-semibold text-ink-950">{dragging ? "Drop to check it" : "Drop your spreadsheet here"}</p>
          <p className="mt-1 text-[15px] text-ink-500">Excel (.xlsx or .xls) or CSV. Nothing is imported until you review it.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button size="lg" onClick={() => input.current?.click()}>
              <FileSpreadsheet className="h-5 w-5" />
              Choose a spreadsheet
            </Button>
            <Button size="lg" variant="secondary" onClick={() => onFile(buildSampleSpreadsheet())}>
              <Sparkles className="h-5 w-5" />
              Try a sample
            </Button>
          </div>
          <input
            ref={input}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-800">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <p className="text-[18px] font-semibold text-ink-950">Start from the template</p>
        <p className="mt-1.5 text-[15px] text-ink-500">
          One row per client. Your own spreadsheet works too — ITERA matches column names like “Client”, “Phone” and “Address”
          automatically, and keeps any extra columns as notes on the file.
        </p>
        <Button className="mt-4 w-full" variant="secondary" onClick={downloadTemplate}>
          <Download className="h-4 w-4" />
          Download the template (.xlsx)
        </Button>
        <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-500">Required columns</p>
        <ul className="mt-2 space-y-1.5">
          {COLUMNS.filter((c) => c.required).map((c) => (
            <li key={c.key} className="flex items-baseline justify-between gap-3 text-[15px]">
              <span className="font-medium text-ink-800">{c.header}</span>
              <span className="text-right text-[14px] text-ink-500">{c.required === "listing" ? "Listings only" : ""}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[14px] text-ink-500">
          Plus {COLUMNS.filter((c) => !c.required).length} optional columns — price, commission, status, closing date, and more.
        </p>
      </div>
    </div>
  );
}

function ProgressPanel({ title, sub, done, total, label }: { title: string; sub?: string; done: number; total: number; label: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mt-8 rounded-2xl border border-hairline bg-surface p-8 shadow-sm" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-itera-600" />
        <div>
          <p className="text-[18px] font-semibold text-ink-950">{title}</p>
          {sub && <p className="text-[14px] text-ink-500">{sub}</p>}
        </div>
      </div>
      <div className="mt-6 h-3 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-itera-600 transition-[width] duration-200 ease-out" style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-[15px]">
        <span className="text-ink-600">{label}</span>
        <span className="tnum font-semibold text-ink-800">{pct}%</span>
      </div>
    </div>
  );
}

function Count({ value, label, tone }: { value: number; label: string; tone: "green" | "amber" | "red" | "ink" }) {
  const styles = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
    ink: "border-hairline bg-canvas text-ink-700",
  }[tone];
  return (
    <div className={cn("rounded-2xl border px-5 py-4", styles)}>
      <p className="tnum text-[28px] font-bold leading-none">{value}</p>
      <p className="mt-2 text-[14px] font-medium">{label}</p>
    </div>
  );
}

function ColumnsPanel({ sheet, mapping }: { sheet: SheetData; mapping: ColumnMapping }) {
  const [open, setOpen] = useState(false);
  const matched = mapping.byIndex.filter(Boolean).length;
  const extras = sheet.headers.filter((h, i) => h && !mapping.byIndex[i]);
  return (
    <div className="rounded-2xl border border-hairline bg-surface">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <span>
          <span className="block text-[16px] font-semibold text-ink-950">
            {matched} of {sheet.headers.filter(Boolean).length} columns matched automatically
          </span>
          <span className="block text-[14px] text-ink-500">
            From the “{sheet.sheetName}” sheet{extras.length ? ` · ${extras.length} kept as extra details: ${extras.join(", ")}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-[14px] font-semibold text-itera-700">{open ? "Hide" : "Show"} matches</span>
      </button>
      {open && (
        <ul className="grid gap-px border-t border-hairline bg-hairline sm:grid-cols-2">
          {sheet.headers.map((h, i) =>
            h ? (
              <li key={i} className="flex items-center justify-between gap-3 bg-surface px-5 py-2.5 text-[15px]">
                <span className="truncate font-medium text-ink-800">“{h}”</span>
                <span className={cn("shrink-0 text-[14px]", mapping.byIndex[i] ? "text-emerald-700" : "text-ink-700")}>
                  {mapping.byIndex[i] ? `→ ${COLUMNS.find((c) => c.key === mapping.byIndex[i])!.header}` : "→ Extra detail"}
                </span>
              </li>
            ) : null
          )}
        </ul>
      )}
    </div>
  );
}

function RowsTable({
  rows,
  selected,
  setSelected,
  filter,
  setFilter,
}: {
  rows: CheckedRow[];
  selected: Set<number>;
  setSelected: (s: Set<number>) => void;
  filter: "all" | "ready" | "attention" | "blocked";
  setFilter: (f: "all" | "ready" | "attention" | "blocked") => void;
}) {
  const visible = rows.filter((r) => {
    if (filter === "blocked") return !r.result;
    if (filter === "attention") return r.result && (r.issues.length > 0 || r.duplicateOf);
    if (filter === "ready") return r.result && r.issues.length === 0 && !r.duplicateOf;
    return true;
  });

  const toggle = (n: number) => {
    const next = new Set(selected);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    setSelected(next);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
      <div className="flex flex-wrap gap-1 border-b border-hairline p-2">
        {(
          [
            ["all", "All rows"],
            ["ready", "Ready"],
            ["attention", "Worth a look"],
            ["blocked", "Need fixing"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn("rounded-lg px-3.5 py-2 text-[14px] font-semibold", filter === k ? "bg-ink-950 text-white" : "text-ink-600 hover:bg-ink-100")}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-canvas text-[13px] font-semibold uppercase tracking-[0.05em] text-ink-500">
            <tr>
              <th className="w-14 px-4 py-3">Import</th>
              <th className="w-16 px-2 py-3">Row</th>
              <th className="px-3 py-3">Client</th>
              <th className="px-3 py-3">Property or search</th>
              <th className="px-3 py-3">What ITERA found</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {visible.map((r) => {
              const blocked = !r.result;
              return (
                <tr key={r.rowNumber} className={cn(blocked ? "bg-red-50/40" : r.duplicateOf ? "bg-canvas" : "")}>
                  <td className="px-4 py-3.5 align-top">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-itera-600 disabled:opacity-40"
                      checked={selected.has(r.rowNumber)}
                      disabled={blocked}
                      onChange={() => toggle(r.rowNumber)}
                      aria-label={`Import row ${r.rowNumber}`}
                    />
                  </td>
                  <td className="tnum px-2 py-3.5 align-top text-[15px] text-ink-500">{r.rowNumber}</td>
                  <td className="px-3 py-3.5 align-top">
                    <p className="text-[15px] font-semibold text-ink-900">{r.summary.client}</p>
                    <p className="text-[14px] text-ink-500">
                      {r.summary.side}
                      {r.summary.price ? ` · $${r.summary.price.toLocaleString()}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 align-top text-[15px] text-ink-700">{r.summary.address}</td>
                  <td className="px-3 py-3.5 align-top">
                    {r.issues.length === 0 && !r.duplicateOf ? (
                      <span className="inline-flex items-center gap-1.5 text-[15px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Ready
                      </span>
                    ) : (
                      <ul className="space-y-1">
                        {r.duplicateOf && (
                          <li className="flex items-start gap-1.5 text-[14px] text-ink-700">
                            <Copy className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
                            {r.duplicateOf} — left unticked
                          </li>
                        )}
                        {r.issues.map((iss, i) => (
                          <li key={i} className={cn("flex items-start gap-1.5 text-[14px]", iss.severity === "error" ? "text-red-700" : "text-amber-800")}>
                            {iss.severity === "error" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                            <span>
                              <strong className="font-semibold">{iss.column}:</strong> {iss.message}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.some((r) => !r.result) && (
        <p className="flex items-start gap-2 border-t border-hairline bg-canvas px-5 py-3.5 text-[14px] text-ink-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Rows marked in red can&apos;t be imported yet. Fix them in your spreadsheet and upload it again — rows already imported
          will be recognised as duplicates.
        </p>
      )}
    </div>
  );
}
