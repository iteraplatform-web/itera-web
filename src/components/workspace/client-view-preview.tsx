"use client";

import { PortalAccessCard } from "@/components/workspace/portal-access-card";
import type { TransactionFile } from "@/types";

/**
 * Client Portal tab — portal login, access, and visibility controls.
 * Opening the live portal is done from the sidebar "Client view" action.
 */
export function ClientViewPreview({ file }: { file: TransactionFile }) {
  return <PortalAccessCard file={file} />;
}
