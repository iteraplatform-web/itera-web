"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Mail, Plus, RefreshCw } from "lucide-react";
import { v4 as uuid } from "uuid";
import { sectionHref } from "@/components/workspace/workspace-sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { EmptyState, Segmented } from "@/components/ui/misc";
import { useTransactionsStore } from "@/stores";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";
import {
  folderLabel,
  listVisits,
  sameVisitSlot,
  toDateTimeLocal,
  visitPlace,
  type VisitBucket,
  type VisitRow,
} from "@/lib/work/visits";
import type { ShowingAppointment, ShowingFeedbackSentiment, TransactionFile } from "@/types";

type Filter = "all" | VisitBucket;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Coming up" },
  { value: "feedback", label: "Needs feedback" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const BUCKET_TITLE: Record<VisitBucket, string> = {
  upcoming: "Coming up",
  feedback: "Waiting for feedback",
  done: "Already happened",
  cancelled: "Cancelled",
};

const SENTIMENT_LABEL: Record<ShowingFeedbackSentiment, string> = {
  hot: "Hot",
  warm: "Warm",
  cool: "Cool",
  pass: "Pass",
};

export function VisitsBoard({
  files,
  lockedFileId,
}: {
  files: TransactionFile[];
  /** When set, every new visit is saved on this one house folder. */
  lockedFileId?: string;
}) {
  const updateShowings = useTransactionsStore((s) => s.updateShowings);
  const [filter, setFilter] = useState<Filter>("all");
  const [fetching, setFetching] = useState(false);
  const [showFetch, setShowFetch] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addKey, setAddKey] = useState(0);
  const [feedbackFor, setFeedbackFor] = useState<VisitRow | null>(null);
  const [timeFor, setTimeFor] = useState<VisitRow | null>(null);
  const [cancelFor, setCancelFor] = useState<VisitRow | null>(null);

  const rows = useMemo(() => listVisits(files), [files]);
  const visible = filter === "all" ? rows : rows.filter((r) => r.bucket === filter);
  const counts = {
    upcoming: rows.filter((r) => r.bucket === "upcoming").length,
    feedback: rows.filter((r) => r.bucket === "feedback").length,
    done: rows.filter((r) => r.bucket === "done").length,
    cancelled: rows.filter((r) => r.bucket === "cancelled").length,
  };

  const fetchVisits = () => {
    if (fetching) return;
    setFetching(true);
    window.setTimeout(() => {
      setFetching(false);
      setShowFetch(true);
    }, 700);
  };

  const write = (file: TransactionFile, appointments: ShowingAppointment[]) => {
    updateShowings(file.id, { appointments });
  };

  const addVisit = (draft: {
    fileId: string;
    agentOrBuyer: string;
    scheduledAt: string;
    propertyAddress: string;
  }) => {
    const file = files.find((f) => f.id === draft.fileId);
    if (!file) return;
    const when = new Date(draft.scheduledAt);
    if (!draft.agentOrBuyer.trim() || Number.isNaN(when.getTime())) {
      toast.warning("Add the name and the time", "A visit needs both before it can be saved.");
      return;
    }
    if (file.side === "buying" && !draft.propertyAddress.trim()) {
      toast.warning("Add the house address", "Buyer visits need the address of the home being toured.");
      return;
    }
    const next: ShowingAppointment = {
      id: uuid(),
      scheduledAt: when.toISOString(),
      agentOrBuyer: draft.agentOrBuyer.trim(),
      feedback: "",
      sentiment: "warm",
      propertyAddress: file.side === "buying" ? draft.propertyAddress.trim() : undefined,
      status: "booked",
    };
    const clash = file.showings.appointments.some((a) => sameVisitSlot(a, next));
    if (clash) {
      toast.warning(
        "This visit is already on the folder",
        "Change the time on the existing visit. A second copy is not added."
      );
      return;
    }
    write(file, [next, ...file.showings.appointments.map((a) => ({ ...a }))]);
    setShowAdd(false);
  };

  const saveFeedback = (row: VisitRow, feedback: string, sentiment: ShowingFeedbackSentiment) => {
    if (!feedback.trim()) {
      toast.warning("Write the feedback", "Leave it blank only if you are not ready to save it yet.");
      return;
    }
    write(
      row.file,
      row.file.showings.appointments.map((a) =>
        a.id === row.appointment.id ? { ...a, feedback: feedback.trim(), sentiment } : { ...a }
      )
    );
    setFeedbackFor(null);
  };

  const saveTime = (row: VisitRow, scheduledAt: string) => {
    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) return;
    const next = { ...row.appointment, scheduledAt: when.toISOString(), status: "booked" as const };
    const clash = row.file.showings.appointments.some(
      (a) => a.id !== row.appointment.id && sameVisitSlot(a, next)
    );
    if (clash) {
      toast.warning(
        "That time is already used",
        "Another visit with the same person is already on this folder at that time."
      );
      return;
    }
    write(
      row.file,
      row.file.showings.appointments.map((a) => (a.id === row.appointment.id ? next : { ...a }))
    );
    setTimeFor(null);
  };

  const cancelVisit = (row: VisitRow) => {
    write(
      row.file,
      row.file.showings.appointments.map((a) =>
        a.id === row.appointment.id ? { ...a, status: "cancelled" as const } : { ...a }
      )
    );
    setCancelFor(null);
  };

  const groups: VisitBucket[] =
    filter === "all" ? ["upcoming", "feedback", "done", "cancelled"] : [filter];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-hairline bg-canvas px-4 py-3">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
        <p className="text-[14px] leading-relaxed text-ink-600">
          Gmail is not connected, so ShowingTime emails are not read. Fetch visits checks
          that and stops. Add a visit by hand and it is saved on the house folder.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          size="sm"
          options={FILTERS.map((f) => ({
            value: f.value,
            label: f.value === "all" ? "All" : `${f.label}`,
          }))}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={fetchVisits} disabled={fetching}>
            <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            {fetching ? "Checking email…" : "Fetch visits"}
          </Button>
          <Button
            onClick={() => {
              setAddKey((k) => k + 1);
              setShowAdd(true);
            }}
            disabled={files.length === 0}
          >
            <Plus className="h-4 w-4" />
            Add visit
          </Button>
        </div>
      </div>

      {!lockedFileId && (
        <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
          <MiniStat label="Coming up" value={counts.upcoming} />
          <MiniStat label="Needs feedback" value={counts.feedback} alert={counts.feedback > 0} />
          <MiniStat label="Finished" value={counts.done} />
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No visits yet"
          description="Fetch does not pull ShowingTime email in this demo. Add a visit by hand and it lands on the house folder."
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Nothing in this list" description="Try another filter." />
      ) : (
        <div className="space-y-5">
          {groups.map((bucket) => {
            const items = visible.filter((r) => r.bucket === bucket);
            if (items.length === 0) return null;
            return (
              <div key={bucket}>
                {filter === "all" && (
                  <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-500">
                    {BUCKET_TITLE[bucket]} <span className="tnum text-ink-400">· {items.length}</span>
                  </h3>
                )}
                <div className="overflow-hidden rounded-2xl border border-hairline bg-surface">
                  {items.map((row, i) => (
                    <VisitCard
                      key={row.appointment.id}
                      row={row}
                      showFolder={!lockedFileId}
                      divider={i > 0}
                      onFeedback={() => setFeedbackFor(row)}
                      onTime={() => setTimeFor(row)}
                      onCancel={() => setCancelFor(row)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showFetch}
        onClose={() => setShowFetch(false)}
        title="ShowingTime is not connected"
        description="Nothing was fetched. No visit was added or changed."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowFetch(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowFetch(false);
                setAddKey((k) => k + 1);
                setShowAdd(true);
              }}
            >
              Add a visit by hand
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[15px] leading-relaxed text-ink-700">
          <p>
            ShowingTime is the other website where house visits get booked. It emails the
            agent when a visit is booked, moved, or cancelled.
          </p>
          <p>
            This demo cannot read Gmail, so ITERA cannot see those emails. When that
            connection exists later, a booking will land in the matching house folder by
            itself. A new time will update the same visit. A cancellation will mark it
            cancelled instead of making a second copy. Feedback is saved only when the
            email actually includes it.
          </p>
          <p>Until then, type the visit yourself. You can add the feedback after the visit.</p>
        </div>
      </Modal>

      <AddVisitModal
        key={addKey}
        open={showAdd}
        files={files}
        lockedFileId={lockedFileId}
        onClose={() => setShowAdd(false)}
        onSave={addVisit}
      />

      {feedbackFor && (
        <FeedbackModal
          key={feedbackFor.appointment.id}
          row={feedbackFor}
          onClose={() => setFeedbackFor(null)}
          onSave={saveFeedback}
        />
      )}

      {timeFor && (
        <TimeModal
          key={timeFor.appointment.id}
          row={timeFor}
          onClose={() => setTimeFor(null)}
          onSave={saveTime}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelFor)}
        title="Cancel this visit?"
        message="The visit stays on the folder and is marked cancelled, so you do not add it again by mistake."
        confirmLabel="Mark cancelled"
        onClose={() => setCancelFor(null)}
        onConfirm={() => cancelFor && cancelVisit(cancelFor)}
      />
    </div>
  );
}

function MiniStat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={cn("px-4 py-3", alert ? "bg-amber-50/70" : "bg-surface")}>
      <p className="section-title">{label}</p>
      <p className={`tnum mt-1 text-[24px] font-bold leading-none ${alert ? "text-amber-800" : "text-ink-950"}`}>
        {value}
      </p>
    </div>
  );
}

function VisitCard({
  row,
  showFolder,
  divider,
  onFeedback,
  onTime,
  onCancel,
}: {
  row: VisitRow;
  showFolder: boolean;
  divider: boolean;
  onFeedback: () => void;
  onTime: () => void;
  onCancel: () => void;
}) {
  const { file, appointment, bucket } = row;
  const cancelled = bucket === "cancelled";
  return (
    <div className={`px-4 py-3.5 ${divider ? "border-t border-hairline" : ""} ${cancelled ? "bg-canvas/70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[15px] font-semibold text-ink-950 ${cancelled ? "line-through text-ink-500" : ""}`}>
            {appointment.agentOrBuyer}
          </p>
          <p className="mt-0.5 text-[13px] text-ink-500">
            {formatDate(appointment.scheduledAt, "EEE, MMM d, yyyy · h:mm a")}
          </p>
          {showFolder ? (
            <Link
              href={sectionHref(file.id, "showings")}
              className="mt-1 block truncate text-[14px] font-medium text-ink-700 hover:text-itera-700"
            >
              {visitPlace(file, appointment)}
              <span className="font-normal text-ink-400"> · {file.clientName}</span>
            </Link>
          ) : (
            file.side === "buying" &&
            appointment.propertyAddress && (
              <p className="mt-1 text-[14px] text-ink-700">{appointment.propertyAddress}</p>
            )
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {bucket === "upcoming" && <Badge size="xs">Coming up</Badge>}
          {bucket === "feedback" && (
            <Badge size="xs" variant="amber">
              Needs feedback
            </Badge>
          )}
          {bucket === "done" && (
            <Badge size="xs" variant="gray">
              {SENTIMENT_LABEL[appointment.sentiment]}
            </Badge>
          )}
          {cancelled && (
            <Badge size="xs" variant="gray">
              Cancelled
            </Badge>
          )}
        </div>
      </div>
      {appointment.feedback && !cancelled && (
        <p className="mt-2 text-[14px] leading-relaxed text-ink-700">{appointment.feedback}</p>
      )}
      {!cancelled && (
        <div className="mt-2 flex flex-wrap gap-1">
          <Button variant="ghost" size="xs" onClick={onFeedback}>
            {appointment.feedback.trim() ? "Edit feedback" : "Add feedback"}
          </Button>
          <Button variant="ghost" size="xs" onClick={onTime}>
            Change time
          </Button>
          <Button variant="ghost" size="xs" onClick={onCancel}>
            Cancel visit
          </Button>
        </div>
      )}
    </div>
  );
}

function AddVisitModal({
  open,
  files,
  lockedFileId,
  onClose,
  onSave,
}: {
  open: boolean;
  files: TransactionFile[];
  lockedFileId?: string;
  onClose: () => void;
  onSave: (draft: { fileId: string; agentOrBuyer: string; scheduledAt: string; propertyAddress: string }) => void;
}) {
  const [fileId, setFileId] = useState(lockedFileId ?? files[0]?.id ?? "");
  const [agentOrBuyer, setAgentOrBuyer] = useState("");
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocal(new Date().toISOString()));
  const [propertyAddress, setPropertyAddress] = useState("");

  const selectedId = lockedFileId || fileId || files[0]?.id || "";
  const file = files.find((f) => f.id === selectedId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a visit"
      description="This is typed in by hand. It is saved on the house folder you pick."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() =>
              onSave({
                fileId: selectedId,
                agentOrBuyer,
                scheduledAt,
                propertyAddress,
              })
            }
            disabled={!file}
          >
            Save visit
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        {lockedFileId && file ? (
          <p className="text-[14px] text-ink-600">
            This visit goes on <span className="font-semibold text-ink-900">{folderLabel(file)}</span>.
          </p>
        ) : (
          <Select
            id="visit-folder"
            label="House folder"
            value={selectedId}
            onChange={(e) => setFileId(e.target.value)}
          >
            {files.map((f) => (
              <option key={f.id} value={f.id}>
                {folderLabel(f)}
              </option>
            ))}
          </Select>
        )}
        <Input
          id="visit-who"
          label="Other agent or buyer"
          value={agentOrBuyer}
          onChange={(e) => setAgentOrBuyer(e.target.value)}
          placeholder="Name of the person coming"
        />
        <Input
          id="visit-when"
          label="When"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
        {file?.side === "buying" && (
          <Input
            id="visit-address"
            label="House being toured"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            placeholder="Street address"
          />
        )}
        <p className="text-[13px] text-ink-500">Feedback can wait until after the visit.</p>
      </div>
    </Modal>
  );
}

function FeedbackModal({
  row,
  onClose,
  onSave,
}: {
  row: VisitRow;
  onClose: () => void;
  onSave: (row: VisitRow, feedback: string, sentiment: ShowingFeedbackSentiment) => void;
}) {
  const [feedback, setFeedback] = useState(row.appointment.feedback);
  const [sentiment, setSentiment] = useState<ShowingFeedbackSentiment>(row.appointment.sentiment);

  return (
    <Modal
      open
      onClose={onClose}
      title="Feedback from the visit"
      description={`${row.appointment.agentOrBuyer} · ${visitPlace(row.file, row.appointment)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => row && onSave(row, feedback, sentiment)}>Save feedback</Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Select
          id="visit-sentiment"
          label="How it went"
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value as ShowingFeedbackSentiment)}
        >
          <option value="hot">Hot — ready to write</option>
          <option value="warm">Warm — still interested</option>
          <option value="cool">Cool — unsure</option>
          <option value="pass">Pass — not for them</option>
        </Select>
        <Textarea
          id="visit-feedback"
          label="What they said"
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Liked the kitchen. Worried about the roof."
        />
      </div>
    </Modal>
  );
}

function TimeModal({
  row,
  onClose,
  onSave,
}: {
  row: VisitRow;
  onClose: () => void;
  onSave: (row: VisitRow, scheduledAt: string) => void;
}) {
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocal(row.appointment.scheduledAt));

  return (
    <Modal
      open
      onClose={onClose}
      title="Change the time"
      description="The same visit is updated. A second visit is not created."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => row && onSave(row, scheduledAt)}>Save time</Button>
        </>
      }
    >
      <Input
        id="visit-new-time"
        label="New time"
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
      />
    </Modal>
  );
}
