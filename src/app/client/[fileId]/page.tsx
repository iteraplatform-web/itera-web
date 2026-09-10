"use client";

import { Suspense, use } from "react";
import { ClientFileView } from "@/components/client/client-file-view";

export default function ClientFilePage({ params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = use(params);
  return (
    <Suspense fallback={null}>
      <ClientFileView fileId={fileId} />
    </Suspense>
  );
}
