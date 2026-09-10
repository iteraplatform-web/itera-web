"use client";

import Link from "next/link";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileText,
  Images,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import { BlobImage } from "@/components/ui/blob-image";
import { Avatar } from "@/components/ui/misc";
import {
  daysToClosing,
  getClientMilestones,
  getClientStage,
  getClientUpdates,
  getOverallProgress,
  STAGE_INFO,
  STAGE_ORDER,
} from "@/lib/client/portal";
import { cn } from "@/lib/utils/cn";
import { clientTabHref, PCard } from "./client-shell";
import type { TransactionFile } from "@/types";

export function ClientHome({ file, unread, readOnly }: { file: TransactionFile; unread: number; readOnly?: boolean }) {
  const agent = useAuthStore((s) => s.user);
  const firstName = file.clientName.replace(/&.*$/, "").trim().split(" ")[0];
  const stage = getClientStage(file);
  const stageIdx = STAGE_ORDER.indexOf(stage);
  const progress = getOverallProgress(file);
  const days = daysToClosing(file);
  const milestones = getClientMilestones(file);
  const upcoming = milestones.filter((m) => m.state !== "done").slice(0, 3);
  const updates = getClientUpdates(file, 5);
  const cover = file.photos?.find((p) => p.id === file.coverPhotoId);
  const needed = file.documents.filter((d) => d.status === "needed" && d.expectedFrom === "Client");
  const lastMsg = file.messages[file.messages.length - 1];
  const agentWaiting = lastMsg?.sender === "agent" && unread > 0;
  const closed = ["closed", "dropped", "terminated"].includes(file.status);
  const side = file.side;

  return (
    <div className="space-y-6">
      {/* ── Hero: where things stand ─────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-hairline bg-surface shadow-sm">
        <div className="relative">
          {cover ? (
            <BlobImage blobKey={cover.blobId} alt="Your home" className="aspect-[21/8] w-full" />
          ) : (
            <div className="aspect-[21/8] w-full bg-gradient-to-br from-itera-600 via-itera-700 to-ink-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
            <p className="text-[16px] font-medium text-white/85">Hi {firstName},</p>
            <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px]">
              {closed && file.status === "closed"
                ? side === "listing"
                  ? "Your home is sold. Congratulations!"
                  : "Welcome home. Congratulations!"
                : side === "listing"
                ? `Your home is ${STAGE_INFO[stage].listing.toLowerCase()}`
                : `You're ${stage === "market" ? "finding your home" : STAGE_INFO[stage].buying.toLowerCase()}`}
            </h1>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="text-[16px] leading-relaxed text-ink-600">{STAGE_INFO[stage].blurb[side]}</p>
            <div className="mt-5 flex items-center justify-between text-[14px]">
              <span className="font-medium text-ink-700">Overall progress</span>
              <span className="tnum font-bold text-ink-950">{progress}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full rounded-full bg-gradient-to-r from-itera-500 to-emerald-500 transition-[width] duration-700" style={{ width: `${progress}%` }} />
            </div>
            <ol className="mt-4 grid grid-cols-4 gap-2">
              {STAGE_ORDER.map((s, i) => (
                <li key={s} className="text-center">
                  <span
                    className={cn(
                      "mx-auto block h-1.5 rounded-full",
                      i < stageIdx || closed ? "bg-emerald-500" : i === stageIdx ? "bg-itera-600" : "bg-ink-200"
                    )}
                  />
                  <span className={cn("mt-1.5 block text-[13px] font-medium", i === stageIdx ? "text-ink-950" : "text-ink-500")}>
                    {STAGE_INFO[s][side]}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {days !== null && !closed && (
            <div className="rounded-2xl bg-ink-950 px-6 py-5 text-center text-white md:min-w-[170px]">
              <p className="tnum text-[44px] font-bold leading-none">{Math.max(days, 0)}</p>
              <p className="mt-2 text-[14px] text-ink-300">{days === 0 ? "Closing is today" : `day${days === 1 ? "" : "s"} to closing`}</p>
              <p className="mt-1 text-[13px] text-ink-400">{format(parseISO(file.closingDate!), "EEE, MMM d")}</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Needed from you ────────────────────────────────────── */}
        <PCard title="Needed from you" icon={Bell}>
          {needed.length === 0 && !agentWaiting ? (
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-4">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <p className="text-[16px] text-emerald-900">
                Nothing right now. We&apos;ll let you know here the moment something needs you.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {agentWaiting && (
                <ActionRow
                  icon={MessageSquare}
                  title={`${agent?.name?.split(" ")[0] ?? "Your agent"} sent you a message`}
                  detail={lastMsg.content}
                  href={clientTabHref(file.id, "messages")}
                  cta="Read and reply"
                  disabled={readOnly}
                />
              )}
              {needed.map((d) => (
                <ActionRow
                  key={d.id}
                  icon={FileText}
                  title={`Upload your ${d.name}`}
                  detail="A photo of each page is fine, or a PDF."
                  href={`${clientTabHref(file.id, "documents")}${clientTabHref(file.id, "documents").includes("?") ? "&" : "?"}focus=${encodeURIComponent(d.name)}`}
                  cta="Upload"
                  disabled={readOnly}
                />
              ))}
            </ul>
          )}
        </PCard>

        {/* ── Coming up ──────────────────────────────────────────── */}
        <PCard
          title="Coming up"
          icon={CalendarDays}
          action={
            <Link href={clientTabHref(file.id, "progress")} className="text-[15px] font-semibold text-itera-700 hover:underline">
              Full timeline
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <p className="text-[16px] text-ink-600">Every milestone is complete.</p>
          ) : (
            <ol className="space-y-4">
              {upcoming.map((m) => (
                <li key={m.taskId} className="flex gap-3.5">
                  <span
                    className={cn(
                      "mt-1 h-3 w-3 shrink-0 rounded-full",
                      m.state === "now" ? "bg-itera-600 ring-4 ring-itera-100" : "bg-ink-200"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-[16px] font-semibold text-ink-950">{m.label}</p>
                      {m.date && (
                        <p className="text-[14px] text-ink-500">
                          {m.state === "now" ? "Expected " : "Around "}
                          {format(parseISO(m.date), "MMM d")}
                        </p>
                      )}
                    </div>
                    <p className="mt-0.5 text-[15px] leading-snug text-ink-600">{m.meaning}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </PCard>

        {/* ── Latest updates ─────────────────────────────────────── */}
        <PCard title="Latest updates" icon={Sparkles}>
          {updates.length === 0 ? (
            <p className="text-[16px] text-ink-600">Updates from your agent will appear here.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {updates.map((u) => (
                <li key={u.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <p className="text-[16px] text-ink-800">{u.text}</p>
                  <p className="shrink-0 text-[14px] text-ink-500">{formatDistanceToNow(parseISO(u.at), { addSuffix: true })}</p>
                </li>
              ))}
            </ul>
          )}
        </PCard>

        {/* ── Quick links ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <QuickLink
            href={clientTabHref(file.id, "messages")}
            icon={MessageSquare}
            title="Messages"
            detail={unread > 0 ? `${unread} new` : "Talk to your agent"}
            highlight={unread > 0}
          />
          <QuickLink
            href={clientTabHref(file.id, "documents")}
            icon={FileText}
            title="Documents"
            detail={needed.length ? `${needed.length} needed from you` : "All caught up"}
            highlight={needed.length > 0}
          />
          <QuickLink
            href={clientTabHref(file.id, "property")}
            icon={side === "listing" ? Images : Search}
            title={side === "listing" ? "Your Home" : "Your Search"}
            detail={
              side === "listing"
                ? `${file.showings?.appointments?.length ?? 0} showings · ${file.photos?.length ?? 0} photos`
                : `${file.buyerSearch?.shortlist?.length ?? 0} homes shortlisted`
            }
          />
          <QuickLink
            href={clientTabHref(file.id, "money")}
            icon={Wallet}
            title="Money"
            detail={side === "listing" ? "What you'll walk away with" : "Cash to close & payments"}
          />
        </div>
      </div>

      {/* ── Your agent (the sidebar shows this on large screens) ─── */}
      <div className="lg:hidden">
        <PCard title="Your agent">
          <div className="flex items-center gap-3">
            <Avatar name={agent?.name ?? "Agent"} size="lg" />
            <div>
              <p className="text-[17px] font-semibold text-ink-950">{agent?.name ?? "Your agent"}</p>
              <p className="text-[15px] text-ink-500">{agent?.brokerage}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <a href="tel:5551234567" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-canvas text-[15px] font-semibold text-ink-800 ring-1 ring-inset ring-hairline">
              <Phone className="h-4 w-4" />
              Call
            </a>
            <a href={`mailto:${agent?.email ?? ""}`} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-canvas text-[15px] font-semibold text-ink-800 ring-1 ring-inset ring-hairline">
              <Mail className="h-4 w-4" />
              Email
            </a>
            <Link href={clientTabHref(file.id, "messages")} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-ink-950 text-[15px] font-semibold text-white">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
          </div>
        </PCard>
      </div>
    </div>
  );
}

function ActionRow({
  icon: Icon,
  title,
  detail,
  href,
  cta,
  disabled,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
  href: string;
  cta: string;
  disabled?: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center">
      <Icon className="hidden h-6 w-6 shrink-0 text-amber-700 sm:block" />
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold text-ink-950">{title}</p>
        <p className="line-clamp-2 text-[15px] text-ink-600">{detail}</p>
      </div>
      {disabled ? (
        <span className="text-[14px] font-medium text-ink-500">{cta}</span>
      ) : (
        <Link href={href} className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ink-950 px-4 text-[15px] font-semibold text-white hover:bg-ink-800">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </li>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  detail,
  highlight,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        highlight ? "border-amber-200 bg-amber-50" : "border-hairline bg-surface"
      )}
    >
      <Icon className={cn("h-6 w-6", highlight ? "text-amber-700" : "text-itera-600")} />
      <div className="mt-4">
        <p className="text-[17px] font-semibold text-ink-950">{title}</p>
        <p className="mt-0.5 text-[14px] text-ink-600">{detail}</p>
      </div>
    </Link>
  );
}
