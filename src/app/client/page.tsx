"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Home, LogOut, Search } from "lucide-react";
import { useTransactionsStore } from "@/stores";
import { useClientAuthStore } from "@/stores/client-auth-store";
import { ClientGuard } from "@/components/client/client-guard";
import { StatusBadge } from "@/components/ui/status-badge";
import { IteraLogo } from "@/components/marketing/logo";

/** Only reached by a client whose email has more than one transaction. */
export default function ClientTransactionsPage() {
  return (
    <ClientGuard>
      <ClientTransactions />
    </ClientGuard>
  );
}

function ClientTransactions() {
  const router = useRouter();
  const files = useTransactionsStore((s) => s.files);
  const { fileIds, email, signOut } = useClientAuthStore();
  const mine = files.filter((f) => fileIds.includes(f.id));

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <IteraLogo />
          <button
            onClick={() => {
              signOut();
              router.push("/client/login");
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-medium text-ink-600 hover:bg-ink-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-5 py-8">
        <h1 className="text-[26px] font-bold tracking-[-0.025em] text-ink-950">Your transactions</h1>
        <p className="mt-1.5 text-[16px] text-ink-600">Signed in as {email}. Choose one to open it.</p>
        <ul className="mt-6 space-y-3">
          {mine.map((f) => (
            <li key={f.id}>
              <Link
                href={`/client/${f.id}`}
                className="flex items-center gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-sm hover:shadow-md"
              >
                {f.side === "listing" ? <Home className="h-6 w-6 text-itera-600" /> : <Search className="h-6 w-6 text-itera-600" />}
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold text-ink-950">{f.propertyAddress}</span>
                  <StatusBadge status={f.status} size="sm" className="mt-2" />
                </span>
                <ArrowRight className="h-5 w-5 text-ink-400" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
