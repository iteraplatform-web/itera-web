"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { useHasHydrated } from "@/hooks/use-hydrated";
import { IteraMark } from "@/components/marketing/logo";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useHasHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;

    /* Read the live store rather than the render snapshot: during hydration the
       snapshot still reflects the server's empty state, and redirecting off it
       would throw a signed-in agent back to the login screen on every refresh. */
    const { isAuthenticated: authed, user: current } = useAuthStore.getState();

    if (!authed) {
      router.replace("/login");
    } else if (current && !current.onboarded) {
      router.replace("/onboarding");
    }
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated || !isAuthenticated || (user && !user.onboarded)) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <IteraMark className="h-9 w-9 animate-pulse" />
      <p className="text-[14px] text-ink-500">Loading your portfolio…</p>
    </div>
  );
}
