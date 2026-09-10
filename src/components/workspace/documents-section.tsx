"use client";

import { useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { Check, CircleDashed, Download, Eye, FileText, FolderOpen, Paperclip, Upload } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { useUploader } from "@/hooks/use-uploader";
import { useFocusTarget } from "@/hooks/use-focus-target";
import { putBlob } from "@/lib/files/blob-store";
import { formatBytes } from "@/lib/files/upload";
import {
  DOCUMENT_ACCEPT,
  downloadDocument,
  openDocument,
  rejectNonDocument,
  suggestDocumentMatch,
} from "@/lib/files/open-document";
import { formatDate } from "@/lib/utils/dates";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { UploadProgressList } from "@/components/ui/upload-progress";
import { DropZone } from "@/components/workspace/photos-section";
import { cn } from "@/lib/utils/cn";
import type { Document, DocumentCategory, TransactionFile } from "@/types";
import type { UploadMeta } from "@/stores/transactions-store";

/** The same categories the brokerage already files paperwork under. */
const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  disclosures: "Disclosures & Agreements",
  hoa: "HOA Paperwork",
  permits: "Permits & Survey",
  receipts: "Receipts & Reports",
  closing: "Closing Documents",
};
const CATEGORY_ORDER: DocumentCategory[] = ["disclosures", "hoa", "permits", "receipts", "closing"];

async function storeDocument(f: File): Promise<UploadMeta> {
  const blobId = `doc-${uuid()}`;
  await putBlob(blobId, f);
  return {
    blobId,
    sizeKb: Math.max(1, Math.round(f.size / 1024)),
    originalName: f.name,
    mimeType: f.type || "application/octet-stream",
  };
}

export function DocumentsSection({ file, focus }: { file: TransactionFile; focus?: string }) {
  const markReceived = useTransactionsStore((s) => s.markDocumentReceived);
  const uploadDocument = useTransactionsStore((s) => s.uploadDocument);
  const addUploadedDocument = useTransactionsStore((s) => s.addUploadedDocument);
  useFocusTarget(focus);

  const [filter, setFilter] = useState<"all" | "needed" | "received">("all");
  /** Files dropped on the general upload area wait here to be labelled. */
  const [pending, setPending] = useState<File[]>([]);

  const outstanding = file.documents.filter((d) => d.status === "needed");
  const received = file.documents.length - outstanding.length;

  const categories = useMemo(
    () => CATEGORY_ORDER.filter((c) => file.documents.some((d) => d.category === c)),
    [file.documents]
  );

  // General uploads: the agent labels each file first; the label rides along
  // with the file and is applied once its upload has actually finished.
  const labels = useRef(new Map<File, { docId?: string; name: string; category: DocumentCategory }>());
  const general = useUploader<UploadMeta>({
    kind: "document",
    accept: rejectNonDocument,
    store: async (f) => {
      const meta = await storeDocument(f);
      const choice = labels.current.get(f);
      labels.current.delete(f);
      if (choice?.docId) uploadDocument(file.id, choice.docId, meta);
      else addUploadedDocument(file.id, choice?.name || f.name, choice?.category ?? "disclosures", meta);
      return meta;
    },
  });

  return (
    <div className="space-y-6">
      {/* ── Summary ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-2xl bg-canvas p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold text-ink-900">
            <span className="tnum">{received}</span> of <span className="tnum">{file.documents.length}</span> documents in
            {outstanding.length > 0 && <span className="font-normal text-ink-500"> · {outstanding.length} still needed</span>}
          </p>
          <Progress
            value={file.documents.length ? (received / file.documents.length) * 100 : 0}
            className="mt-2.5 max-w-sm"
            barClassName={outstanding.length === 0 ? "from-emerald-400 to-emerald-500" : undefined}
          />
        </div>
        <div className="inline-flex shrink-0 rounded-xl bg-ink-100 p-1" role="tablist" aria-label="Filter documents">
          {(
            [
              ["all", "All"],
              ["needed", "Still needed"],
              ["received", "Received"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-[14px] font-semibold transition-all",
                filter === key ? "bg-surface text-ink-950 shadow-xs" : "text-ink-600 hover:text-ink-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <DropZone
        onFiles={(files) => setPending((p) => [...p, ...files])}
        busy={general.busy}
        accept={DOCUMENT_ACCEPT}
        title="Upload paperwork"
        hint="Drop any PDF, Word file, or photo of a page. ITERA suggests which document it is and renames it to your standard pattern."
      />
      <UploadProgressList items={general.items} onCancel={general.cancel} />

      {/* ── Category groups ─────────────────────────────────── */}
      {categories.map((category) => {
        const docs = file.documents
          .filter((d) => d.category === category && (filter === "all" || d.status === filter))
          // Outstanding first — that is what the agent needs to act on.
          .sort((a, b) => (a.status === b.status ? 0 : a.status === "needed" ? -1 : 1));
        if (docs.length === 0) return null;
        const catIn = file.documents.filter((d) => d.category === category && d.status === "received").length;
        const catTotal = file.documents.filter((d) => d.category === category).length;

        return (
          <section key={category}>
            <div className="mb-3 flex items-center gap-2.5">
              <FolderOpen className="h-5 w-5 text-ink-500" />
              <h3 className="text-[16px] font-semibold text-ink-900">{CATEGORY_LABELS[category]}</h3>
              <span className="tnum rounded-full bg-ink-100 px-2.5 py-0.5 text-[13px] font-semibold text-ink-600">
                {catIn} of {catTotal}
              </span>
            </div>
            <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline">
              {docs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  file={file}
                  focused={focus === doc.name}
                  onPaperCopy={() => markReceived(file.id, doc.id)}
                  onUploaded={(meta) => uploadDocument(file.id, doc.id, meta)}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {pending.length > 0 && (
        <LabelUploadModal
          key={pending[0].name + pending.length}
          upload={pending[0]}
          remaining={pending.length - 1}
          outstanding={outstanding}
          onCancel={() => setPending((p) => p.slice(1))}
          onConfirm={(choice) => {
            const f = pending[0];
            setPending((p) => p.slice(1));
            labels.current.set(f, choice);
            general.upload([f]);
          }}
        />
      )}
    </div>
  );
}

function DocumentRow({
  doc,
  file,
  focused,
  onPaperCopy,
  onUploaded,
}: {
  doc: Document;
  file: TransactionFile;
  focused: boolean;
  onPaperCopy: () => void;
  onUploaded: (meta: UploadMeta) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { items, upload, cancel, busy } = useUploader<UploadMeta>({
    kind: "document",
    accept: rejectNonDocument,
    store: storeDocument,
    onBatchDone: ([meta]) => meta && onUploaded(meta),
  });
  const isReceived = doc.status === "received";

  return (
    <li data-focus={doc.name} className={cn("px-5 py-4", isReceived ? "bg-emerald-50/30" : "bg-surface")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            isReceived ? "bg-emerald-100 text-emerald-700" : "bg-ink-100 text-ink-500"
          )}
        >
          {isReceived ? <FileText className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold text-ink-950">{doc.name}</p>
          {isReceived ? (
            <>
              <p className="mt-0.5 truncate font-mono text-[13px] text-ink-500" title={doc.fileName}>
                {doc.fileName}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-500">
                {doc.blobId ? "Uploaded" : "Paper copy"} {doc.receivedAt ? formatDate(doc.receivedAt) : ""}
                {doc.receivedBy ? ` by ${doc.receivedBy}` : ""}
                {doc.sizeKb ? ` · ${formatBytes(doc.sizeKb * 1024)}` : ""}
                {doc.originalName && doc.originalName !== doc.fileName ? ` · was "${doc.originalName}"` : ""}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-[14px] text-ink-500">
              Still needed{doc.expectedFrom ? ` — expected from ${doc.expectedFrom === "Client" ? "the client" : doc.expectedFrom}` : ""}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {isReceived ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[13px] font-semibold text-emerald-800">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                Received
              </span>
              <Button size="sm" variant="secondary" onClick={() => openDocument(doc, file)}>
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button size="sm" variant="ghost" onClick={() => downloadDocument(doc, file)} aria-label={`Download ${doc.name}`}>
                <Download className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant={focused ? "primary" : "secondary"} onClick={() => inputRef.current?.click()} disabled={busy}>
                <Upload className="h-4 w-4" />
                {busy ? "Uploading…" : "Upload"}
              </Button>
              <Button size="sm" variant="ghost" onClick={onPaperCopy} title="Received on paper — no file to upload">
                <Paperclip className="h-4 w-4" />
                Have paper copy
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept={DOCUMENT_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload([f]);
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>
      </div>
      {items.length > 0 && (
        <div className="mt-3">
          <UploadProgressList items={items} onCancel={cancel} />
        </div>
      )}
    </li>
  );
}

function LabelUploadModal({
  upload,
  remaining,
  outstanding,
  onCancel,
  onConfirm,
}: {
  upload: File;
  remaining: number;
  outstanding: Document[];
  onCancel: () => void;
  onConfirm: (choice: { docId?: string; name: string; category: DocumentCategory }) => void;
}) {
  const suggestion = suggestDocumentMatch(upload.name, outstanding);
  const [docId, setDocId] = useState<string>(suggestion?.id ?? "new");
  const [name, setName] = useState(upload.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " "));
  const [category, setCategory] = useState<DocumentCategory>("disclosures");

  return (
    <Modal
      open
      onClose={onCancel}
      title="Which document is this?"
      description={`${upload.name} · ${formatBytes(upload.size)}${remaining > 0 ? ` · ${remaining} more after this` : ""}`}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Skip this file
          </Button>
          <Button
            onClick={() => onConfirm(docId === "new" ? { name: name.trim() || upload.name, category } : { docId, name: "", category })}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {suggestion && (
          <p className="rounded-xl bg-itera-50 px-4 py-3 text-[15px] text-itera-900">
            This looks like the <strong>{suggestion.name}</strong>. Change it below if that is wrong.
          </p>
        )}
        <Select id="docMatch" label="File it as" value={docId} onChange={(e) => setDocId(e.target.value)}>
          {outstanding.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} (still needed)
            </option>
          ))}
          <option value="new">Something else — a new document</option>
        </Select>
        {docId === "new" && (
          <>
            <Input id="docName" label="Document name" value={name} onChange={(e) => setName(e.target.value)} />
            <Select id="docCategory" label="Category" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </>
        )}
      </div>
    </Modal>
  );
}
