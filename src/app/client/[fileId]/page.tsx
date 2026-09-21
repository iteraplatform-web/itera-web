"use client";

import { Suspense, use } from "react";
import { ClientFileView } from "@/components/client/client-file-view";
import { ClientGuard } from "@/components/client/client-guard";

export default function ClientFilePage({ params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = use(params);
  return (
    <ClientGuard fileId={fileId}>
      <Suspense fallback={null}>
        <ClientFileView fileId={fileId} />
      </Suspense>
    </ClientGuard>
  );
}
