"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { IteraLogo } from "@/components/marketing/logo";
import { useClientAuthStore } from "@/stores/client-auth-store";
import { useTransactionsStore } from "@/stores";
import { useHasHydrated } from "@/hooks/use-hydrated";

export default function ClientLoginPage() {
  return (
    <Suspense fallback={null}>
      <ClientLogin />
    </Suspense>
  );
}

function ClientLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHasHydrated();
  const signIn = useClientAuthStore((s) => s.signIn);
  const files = useTransactionsStore((s) => s.files);

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const e = params.get("email");
    if (e) setEmail(e);
  }, [params]);

  // For demonstrations started from the home page, without the agent side open.
  const sample = hydrated ? files.find((f) => f.portalAccess?.enabled && f.status === "under_contract")?.portalAccess : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn(email, password);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    router.push(result.fileIds.length === 1 ? `/client/${result.fileIds[0]}` : "/client");
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="px-6 py-5">
        <IteraLogo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-[420px]">
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.03em] text-ink-950">Sign in to your portal</h1>
          <p className="mt-2 text-[17px] leading-relaxed text-ink-600">
            Follow your home sale or purchase and message your agent. Your agent gave you these details.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-[16px] font-medium text-ink-800">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                autoComplete="username"
                required
                className="mt-2 block h-14 w-full rounded-xl border-0 bg-surface px-4 text-[18px] text-ink-950 ring-1 ring-inset ring-hairline-strong focus:outline-none focus:ring-2 focus:ring-itera-500"
              />
            </label>
            <label className="block">
              <span className="text-[16px] font-medium text-ink-800">Password</span>
              <span className="relative mt-2 block">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete="current-password"
                  required
                  className="block h-14 w-full rounded-xl border-0 bg-surface px-4 pr-24 text-[18px] text-ink-950 ring-1 ring-inset ring-hairline-strong focus:outline-none focus:ring-2 focus:ring-itera-500"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg px-3 py-2 text-[15px] font-medium text-ink-600 hover:bg-ink-100"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {show ? "Hide" : "Show"}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[16px] text-red-800">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-itera-600 text-[18px] font-semibold text-white hover:bg-itera-700"
            >
              Sign in
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {sample && (
            <button
              type="button"
              onClick={() => {
                setEmail(sample.email);
                setPassword(sample.password);
                setError(null);
              }}
              className="mt-6 flex w-full items-start gap-3 rounded-xl border border-dashed border-hairline-strong bg-surface px-4 py-4 text-left hover:border-itera-300"
            >
              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" />
              <span>
                <span className="block text-[16px] font-semibold text-ink-900">Just looking? Use a sample client</span>
                <span className="mt-0.5 block font-mono text-[14px] text-ink-600">
                  {sample.email} · {sample.password}
                </span>
              </span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
