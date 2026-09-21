"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Check, Copy, ExternalLink, Eye, EyeOff, KeyRound, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { PortalVisibility, TransactionFile } from "@/types";

function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(!secret);
  return (
    <div>
      <p className="text-[15px] font-medium text-ink-700">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="flex h-12 min-w-0 flex-1 items-center rounded-xl bg-canvas px-4 font-mono text-[17px] text-ink-950 ring-1 ring-inset ring-hairline">
          <span className="truncate">{shown ? value : "•".repeat(Math.min(value.length, 12))}</span>
        </span>
        {secret && (
          <Button variant="secondary" onClick={() => setShown((v) => !v)} aria-label={shown ? "Hide password" : "Show password"}>
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {shown ? "Hide" : "Show"}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            void navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Everything about the client's sign-in in one place: the login itself, whether
 * it's on, whether they've used it, and what they're allowed to see.
 */
export function PortalAccessCard({ file, compact }: { file: TransactionFile; compact?: boolean }) {
  const resetPortalPassword = useTransactionsStore((s) => s.resetPortalPassword);
  const setPortalEnabled = useTransactionsStore((s) => s.setPortalEnabled);
  const setPortalVisibility = useTransactionsStore((s) => s.setPortalVisibility);
  const sendEmail = useTransactionsStore((s) => s.sendEmail);
  const access = file.portalAccess;

  if (!access) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-[17px] font-semibold text-ink-950">No portal access yet</p>
        <p className="mt-1 text-[16px] text-ink-700">
          Portal access is created from the client&apos;s email address. Add their email to set it up.
        </p>
        <Link href={`/files/new?full=true&complete=${file.id}`} className="mt-3 inline-block">
          <Button>Add the client&apos;s email</Button>
        </Link>
      </div>
    );
  }

  const signInHref = `/client/login?email=${encodeURIComponent(access.email)}`;

  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[19px] font-semibold text-ink-950">
            <KeyRound className="h-5 w-5 text-ink-500" />
            Client portal login
          </h3>
          <p className="mt-1 text-[15px] text-ink-600">
            {!access.enabled
              ? "Access is turned off — the client can't sign in."
              : access.lastSignInAt
              ? `${file.clientName.split(" ")[0]} last signed in ${formatDistanceToNow(parseISO(access.lastSignInAt), { addSuffix: true })}.`
              : `${file.clientName.split(" ")[0]} hasn't signed in yet.`}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[14px] font-semibold",
            access.enabled ? "bg-emerald-100 text-emerald-800" : "bg-ink-100 text-ink-600"
          )}
        >
          {access.enabled ? "On" : "Off"}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <CopyField label="Email" value={access.email} />
        <CopyField label="Temporary password" value={access.password} secret />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={signInHref} target="_blank">
          <Button>
            <ExternalLink className="h-4 w-4" />
            Open client sign-in
          </Button>
        </Link>
        {!compact && (
          <>
            <Button variant="secondary" onClick={() => sendEmail(file.id, "portal_invite")}>
              <Mail className="h-4 w-4" />
              {access.invitedAt ? "Resend invitation" : "Send invitation"}
            </Button>
            <Button variant="ghost" onClick={() => resetPortalPassword(file.id)}>
              <RefreshCw className="h-4 w-4" />
              New password
            </Button>
            <Button variant="ghost" onClick={() => setPortalEnabled(file.id, !access.enabled)}>
              {access.enabled ? "Turn off access" : "Turn on access"}
            </Button>
          </>
        )}
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-canvas px-4 py-3 text-[14px] leading-relaxed text-ink-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
        The password is shown here so you can test the portal. In the finished product the client gets a secure sign-in link by
        email and passwords are never displayed.
      </p>

      {!compact && <VisibilitySettings file={file} onChange={(u) => setPortalVisibility(file.id, u)} />}
    </section>
  );
}

const VIS_ROWS: { key: keyof PortalVisibility; label: (side: string) => string; hint: string }[] = [
  { key: "progress", label: () => "Progress timeline", hint: "Milestones and when they happened" },
  { key: "documents", label: () => "Documents", hint: "Their own paperwork and uploads" },
  { key: "property", label: (side) => (side === "listing" ? "Your Home (photos, showings)" : "Your Search (criteria, tours)"), hint: "Listing activity or search progress" },
  { key: "showingFeedback", label: () => "Buyer feedback from showings", hint: "Agents' comments, with names hidden" },
  { key: "money", label: () => "Money estimates", hint: "Take-home or cash-to-close calculators" },
];

function VisibilitySettings({ file, onChange }: { file: TransactionFile; onChange: (u: Partial<PortalVisibility>) => void }) {
  const vis = file.portalAccess!.visibility;
  return (
    <div className="mt-6 border-t border-hairline pt-5">
      <h4 className="text-[17px] font-semibold text-ink-950">What {file.clientName.split(" ")[0]} can see</h4>
      <p className="mt-1 text-[15px] text-ink-600">Home and Messages are always on. Your notes and checklist are never shown.</p>
      <ul className="mt-4 divide-y divide-hairline rounded-xl border border-hairline">
        {VIS_ROWS.filter((r) => r.key !== "showingFeedback" || file.side === "listing").map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-[16px] font-medium text-ink-900">{r.label(file.side)}</p>
              <p className="text-[14px] text-ink-500">{r.hint}</p>
            </div>
            <button
              role="switch"
              aria-checked={vis[r.key]}
              aria-label={r.label(file.side)}
              onClick={() => onChange({ [r.key]: !vis[r.key] })}
              className={cn(
                "relative h-8 w-14 shrink-0 rounded-full transition-colors",
                vis[r.key] ? "bg-itera-600" : "bg-ink-300"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all",
                  vis[r.key] ? "left-7" : "left-1"
                )}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
