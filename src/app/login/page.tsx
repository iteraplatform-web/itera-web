"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell, AuthAside } from "@/components/layout/auth-shell";
import { useAuthStore } from "@/stores";
import { DEMO_CREDENTIALS } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      router.push("/dashboard");
    } else {
      setError("Those credentials don't match. Use the demo details below.");
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError("");
  };

  return (
    <AuthShell
      eyebrow="Agent sign in"
      title="Welcome back"
      subtitle="Pick up where your portfolio left off."
      aside={
        <AuthAside
          quote="Every deadline tracked. Every client informed. Nothing left to memory."
          points={[
            { label: "Active files", value: "6" },
            { label: "Tasks tracked", value: "148" },
            { label: "Missed", value: "0" },
          ]}
        />
      }
      footer={
        <p className="text-center text-[14px] text-ink-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-itera-600 hover:text-itera-700">
            Create one
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="you@brokerage.com"
          autoComplete="username"
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 ring-1 ring-inset ring-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <p className="text-[14px] text-red-700">{error}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full">
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* Demo credentials, one click away — this is a demonstration build. */}
      <button
        type="button"
        onClick={fillDemo}
        className="mt-5 flex w-full items-start gap-3 rounded-xl border border-dashed border-hairline-strong bg-canvas px-4 py-3.5 text-left transition-colors hover:border-itera-300 hover:bg-itera-50/50"
      >
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-ink-800">
            Use the demo account
          </span>
          <span className="mt-0.5 block font-mono text-[13px] text-ink-500">
            {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
          </span>
        </span>
      </button>
    </AuthShell>
  );
}
