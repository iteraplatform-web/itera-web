import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useTransactionsStore } from "./transactions-store";

/**
 * The client's session — completely separate from the agent's. A client can
 * only ever open the files their own email has access to.
 */
interface ClientAuthState {
  email: string | null;
  fileIds: string[];
  signIn: (email: string, password: string) => { ok: true; fileIds: string[] } | { ok: false; reason: string };
  signOut: () => void;
}

export const useClientAuthStore = create<ClientAuthState>()(
  persist(
    (set) => ({
      email: null,
      fileIds: [],
      signIn: (email, password) => {
        const clean = email.trim().toLowerCase();
        const { files, recordClientSignIn } = useTransactionsStore.getState();
        const mine = files.filter((f) => f.portalAccess?.email === clean);
        if (mine.length === 0) return { ok: false, reason: "We don't have a portal for that email. Check with your agent." };
        const allowed = mine.filter((f) => f.portalAccess?.enabled);
        if (allowed.length === 0) return { ok: false, reason: "Your portal access is paused. Please contact your agent." };
        const match = allowed.filter((f) => f.portalAccess?.password === password.trim());
        if (match.length === 0) return { ok: false, reason: "That password isn't right. Passwords look like cedar-4821." };
        match.forEach((f) => recordClientSignIn(f.id));
        const fileIds = match.map((f) => f.id);
        set({ email: clean, fileIds });
        return { ok: true, fileIds };
      },
      signOut: () => set({ email: null, fileIds: [] }),
    }),
    { name: "itera-client-auth", storage: createJSONStorage(() => localStorage) }
  )
);
