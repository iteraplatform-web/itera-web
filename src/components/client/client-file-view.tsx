"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bell, X } from "lucide-react";
import { parseISO } from "date-fns";
import { getFileById } from "@/lib/selectors/transactions";
import { useBroadcastEvents, useTransactionsStore } from "@/stores";
import { useHasHydrated } from "@/hooks/use-hydrated";
import { ensureWorkFields } from "@/lib/work/defaults";
import { IteraMark } from "@/components/marketing/logo";
import { CLIENT_TABS, ClientShell, type ClientTab } from "@/components/client/portal/client-shell";
import { ClientHome } from "@/components/client/portal/client-home";
import { ClientDocuments, ClientHelp, ClientMessages, ClientProgress } from "@/components/client/portal/client-sections";
import { ClientMoney, ClientProperty } from "@/components/client/portal/client-property-money";
import { cn } from "@/lib/utils/cn";
import type { BroadcastEvent } from "@/stores";

const seenKey = (id: string) => `itera-client-seen-${id}`;

function readSeen(id: string): number {
  try {
    return Number(localStorage.getItem(seenKey(id)) ?? 0);
  } catch {
    return 0;
  }
}

export function ClientFileView({ fileId }: { fileId: string }) {
  const params = useSearchParams();
  const tabParam = params.get("tab") as ClientTab | null;
  const tab: ClientTab = tabParam && CLIENT_TABS.includes(tabParam) ? tabParam : "home";
  const focus = params.get("focus") ?? undefined;

  const files = useTransactionsStore((s) => s.files);
  const hydrated = useHasHydrated();
  const raw = useMemo(() => getFileById(files, fileId), [files, fileId]);
  const file = useMemo(() => (raw ? ensureWorkFields(raw) : undefined), [raw]);

  const [alert, setAlert] = useState<BroadcastEvent | null>(null);
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => setSeenAt(readSeen(fileId)), [fileId]);

  // Opening Messages counts as reading them.
  useEffect(() => {
    if (tab !== "messages" || !file) return;
    const now = Date.now();
    try {
      localStorage.setItem(seenKey(fileId), String(now));
    } catch {
      /* private mode: badge simply won't persist */
    }
    setSeenAt(now);
  }, [tab, fileId, file?.messages.length, file]);

  /* The agent side writing to storage wakes this tab; say what changed. */
  const handleEvent = useCallback((event: BroadcastEvent) => {
    setAlert(event);
    setTimeout(() => setAlert(null), 8000);
  }, []);
  useBroadcastEvents(handleEvent, fileId);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
        <IteraMark className="h-9 w-9 animate-pulse" />
        <p className="text-[15px] text-ink-500">Loading your portal…</p>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
        <p className="text-[18px] font-semibold text-ink-900">We couldn&apos;t find that transaction</p>
        <Link href="/client" className="text-[16px] font-semibold text-itera-600">
          See your transactions
        </Link>
      </div>
    );
  }

  const unread = file.messages.filter((m) => m.sender === "agent" && parseISO(m.sentAt).getTime() > seenAt).length;
  const needed = file.documents.filter((d) => d.status === "needed" && d.expectedFrom === "Client").length;

  return (
    <>
      {alert && (
        <div
          role="status"
          className={cn(
            "fixed inset-x-0 top-0 z-[60] animate-fade-in px-4 py-3.5 text-white shadow-lg",
            alert.tone === "success" ? "bg-emerald-600" : alert.tone === "urgent" ? "bg-red-600" : "bg-ink-900"
          )}
        >
          <div className="mx-auto flex max-w-3xl items-start gap-3">
            <Bell className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-semibold">{alert.title}</p>
              <p className="mt-0.5 text-[15px] leading-snug opacity-90">{alert.message}</p>
            </div>
            <button onClick={() => setAlert(null)} className="shrink-0 rounded p-1 opacity-80 hover:opacity-100" aria-label="Dismiss">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <ClientShell file={file} tab={tab} badges={{ messages: tab === "messages" ? 0 : unread, documents: needed }}>
        <div key={tab} className="animate-fade-in">
          {tab === "home" && <ClientHome file={file} unread={unread} />}
          {tab === "progress" && <ClientProgress file={file} />}
          {tab === "documents" && <ClientDocuments file={file} focus={focus} />}
          {tab === "messages" && <ClientMessages file={file} />}
          {tab === "property" && <ClientProperty file={file} />}
          {tab === "money" && <ClientMoney file={file} />}
          {tab === "help" && <ClientHelp file={file} />}
        </div>
      </ClientShell>
    </>
  );
}
