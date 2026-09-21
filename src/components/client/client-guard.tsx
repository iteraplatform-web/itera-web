"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClientAuthStore } from "@/stores/client-auth-store";
import { useHasHydrated } from "@/hooks/use-hydrated";
import { IteraMark } from "@/components/marketing/logo";

/** Keeps the portal behind the client's own sign-in, and to their own files. */
export function ClientGuard({ fileId, children }: { fileId?: string; children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useHasHydrated();
  const fileIds = useClientAuthStore((s) => s.fileIds);
  const allowed = fileIds.length > 0 && (!fileId || fileIds.includes(fileId));

  useEffect(() => {
    if (!hydrated) return;
    const { fileIds: ids } = useClientAuthStore.getState();
    if (ids.length === 0 || (fileId && !ids.includes(fileId))) router.replace("/client/login");
  }, [hydrated, fileId, router]);

  if (!hydrated || !allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
        <IteraMark className="h-9 w-9 animate-pulse" />
        <p className="text-[16px] text-ink-500">Checking your sign-in…</p>
      </div>
    );
  }
  return <>{children}</>;
}
