"use client";

import Link from "next/link";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ArrowRight, CheckCircle2, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/stores";
import {
  daysToClosing,
  getClientMilestones,
  getClientStage,
  getClientUpdates,
  STAGE_INFO,
  STAGE_ORDER,
} from "@/lib/client/portal";
import { cn } from "@/lib/utils/cn";
import { BlobImage } from "@/components/ui/blob-image";
import { PropertyPlaceholder } from "@/components/ui/property-placeholder";
import { samplePhotoFor } from "@/lib/work/sample-photos";
import { clientTabHref } from "./client-shell";
import type { TransactionFile } from "@/types";

/**
 * The scope's client view, and no more: where things stand on a four-step
 * timeline, the one thing needed from the client right now, what happens
 * next, and the latest change. Everything else is one tap away.
 */
export function ClientHome({ file, unread, readOnly }: { file: TransactionFile; unread: number; readOnly?: boolean }) {
  const agent = useAuthStore((s) => s.user);
  const firstName = file.clientName.replace(/&.*$/, "").trim().split(" ")[0];
  const stage = getClientStage(file);
  const stageIdx = STAGE_ORDER.indexOf(stage);
  const closed = file.status === "closed";
  const days = daysToClosing(file);
  const next = getClientMilestones(file).find((m) => m.state !== "done");
  const latest = getClientUpdates(file, 1)[0];
  const side = file.side;
  const agentFirst = agent?.name?.split(" ")[0] ?? "your agent";
  const cover = file.coverPhotoId ? file.photos?.find((p) => p.id === file.coverPhotoId) : undefined;

  const needed = file.documents.filter((d) => d.status === "needed" && d.expectedFrom === "Client");
  const lastMsg = file.messages[file.messages.length - 1];

  // The single most important thing for the client to do, if anything.
  const action =
    unread > 0 && lastMsg?.sender === "agent"
      ? { title: `${agentFirst} sent you a message`, detail: lastMsg.content, cta: "Read and reply", href: clientTabHref(file.id, "messages") }
      : needed.length > 0
      ? {
          title: `Please upload your ${needed[0].name}`,
          detail: needed.length > 1 ? `${needed.length - 1} more document${needed.length > 2 ? "s" : ""} after this one.` : "A clear photo of each page is fine.",
          cta: "Upload",
          href: `/client/${file.id}?tab=documents&focus=${encodeURIComponent(needed[0].name)}`,
        }
      : null;

  const headline = closed
    ? side === "listing"
      ? "Your home is sold. Congratulations!"
      : "Welcome home. Congratulations!"
    : side === "listing"
    ? `Your home is ${STAGE_INFO[stage].listing.toLowerCase()}`
    : stage === "market"
    ? "We're finding your home"
    : `Your purchase is ${STAGE_INFO[stage].buying.toLowerCase()}`;

  return (
    <div className="space-y-5">
      {/* ── Where things stand ─────────────────────────────── */}
      <section className="grid items-center gap-6 rounded-3xl bg-ink-950 p-6 text-white sm:p-8 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
        <p className="text-[17px] text-ink-300">Hi {firstName},</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.02em] sm:text-[34px]">{headline}</h1>
        {!closed && <p className="mt-2 max-w-xl text-[17px] leading-relaxed text-ink-200">{STAGE_INFO[stage].blurb[side]}</p>}

        <ol className="mt-7 grid grid-cols-4 gap-2">
          {STAGE_ORDER.map((s, i) => {
            const done = i < stageIdx || closed;
            const now = i === stageIdx && !closed;
            return (
              <li key={s}>
                <span className={cn("block h-2 rounded-full", done ? "bg-emerald-400" : now ? "bg-white" : "bg-white/20")} />
                <span className={cn("mt-2 block text-[14px] font-medium leading-tight", now ? "text-white" : done ? "text-ink-300" : "text-ink-400")}>
                  {STAGE_INFO[s][side]}
                </span>
              </li>
            );
          })}
        </ol>

        {days !== null && !closed && days >= 0 && (
          <p className="mt-6 text-[17px] text-ink-200">
            <span className="tnum text-[22px] font-bold text-white">{days}</span> day{days === 1 ? "" : "s"} until closing on{" "}
            {format(parseISO(file.closingDate!), "EEEE, MMMM d")}
          </p>
        )}
        </div>

        {/* Their home, or the illustration until photos are added */}
        <div className="hidden aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/10 md:block">
          {cover ? (
            <BlobImage blobKey={cover.thumbBlobId} alt="Your home" className="h-full w-full" />
          ) : samplePhotoFor(file) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={samplePhotoFor(file)} alt="Your home" className="h-full w-full object-cover" />
          ) : (
            <PropertyPlaceholder variant={file.side} showLabel={false} />
          )}
        </div>
      </section>

      {/* ── The one thing needed from you ──────────────────── */}
      {action ? (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-6">
          <p className="text-[14px] font-bold uppercase tracking-[0.06em] text-amber-800">Needed from you</p>
          <p className="mt-1.5 text-[20px] font-semibold text-ink-950">{action.title}</p>
          <p className="mt-1 line-clamp-2 text-[16px] text-ink-700">{action.detail}</p>
          {!readOnly && (
            <Link
              href={action.href}
              className="mt-4 inline-flex h-12 items-center gap-2 rounded-xl bg-ink-950 px-6 text-[17px] font-semibold text-white hover:bg-ink-800"
            >
              {action.cta}
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </section>
      ) : (
        <section className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-600" />
          <div>
            <p className="text-[19px] font-semibold text-ink-950">Nothing is needed from you right now</p>
            <p className="mt-1 text-[16px] text-ink-700">We&apos;ll show it here the moment something is.</p>
          </div>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* ── What happens next ────────────────────────────── */}
        {next && (
          <section className="rounded-2xl border border-hairline bg-surface p-5 shadow-sm sm:p-6">
            <p className="text-[14px] font-bold uppercase tracking-[0.06em] text-ink-500">What happens next</p>
            <p className="mt-1.5 text-[19px] font-semibold text-ink-950">{next.label}</p>
            <p className="mt-1 text-[16px] leading-relaxed text-ink-600">{next.meaning}</p>
            {next.date && <p className="mt-2 text-[16px] font-medium text-ink-800">Expected around {format(parseISO(next.date), "MMMM d")}</p>}
            <Link href={clientTabHref(file.id, "progress")} className="mt-3 inline-block text-[16px] font-semibold text-itera-700 hover:underline">
              See every step
            </Link>
          </section>
        )}

        {/* ── Latest update ────────────────────────────────── */}
        <section className="rounded-2xl border border-hairline bg-surface p-5 shadow-sm sm:p-6">
          <p className="text-[14px] font-bold uppercase tracking-[0.06em] text-ink-500">Latest update</p>
          {latest ? (
            <>
              <p className="mt-1.5 text-[19px] font-semibold text-ink-950">{latest.text}</p>
              <p className="mt-1 text-[16px] text-ink-600">{formatDistanceToNow(parseISO(latest.at), { addSuffix: true })}</p>
            </>
          ) : (
            <p className="mt-1.5 text-[17px] text-ink-700">Updates from {agentFirst} will appear here.</p>
          )}
          {!readOnly && (
            <Link
              href={clientTabHref(file.id, "messages")}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-canvas px-4 text-[16px] font-semibold text-ink-900 ring-1 ring-inset ring-hairline-strong hover:bg-ink-100"
            >
              <MessageSquare className="h-5 w-5" />
              Message {agentFirst}
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
