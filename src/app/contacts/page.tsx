"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { ContactsBoard } from "@/components/contacts/contacts-board";
import { buildContacts } from "@/lib/selectors/contacts";
import { useAuthStore, useTransactionsStore } from "@/stores";

export default function ContactsPage() {
  return (
    <AuthGuard>
      <ContactsContent />
    </AuthGuard>
  );
}

function ContactsContent() {
  const files = useTransactionsStore((s) => s.files);
  const agentName = useAuthStore((s) => s.user?.name?.split(" ")[0] ?? "you");
  const contacts = useMemo(() => buildContacts(files), [files]);

  return (
    <AppShell crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Contacts" }]}>
      <ContactsBoard contacts={contacts} agentName={agentName} />
    </AppShell>
  );
}
