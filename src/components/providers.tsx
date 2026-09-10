"use client";

import { useStoreHydration } from "@/stores";
import { useScheduler } from "@/hooks/use-scheduler";
import { RouteProgress } from "@/components/layout/route-progress";
import { ToastContainer } from "@/components/ui/toast-container";

export function Providers({ children }: { children: React.ReactNode }) {
  useStoreHydration();
  useScheduler();

  return (
    <>
      <RouteProgress />
      {children}
      <ToastContainer />
    </>
  );
}
