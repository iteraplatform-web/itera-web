"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell, AuthAside } from "@/components/layout/auth-shell";
import { useAuthStore } from "@/stores";

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup(name.trim(), email.trim());
    router.push("/onboarding");
  };

  return (
    <AuthShell
      eyebrow="Step 1 of 2"
      title="Create your account"
      subtitle="Two short steps and your dashboard is ready."
      aside={
        <AuthAside
          quote="The moment you open a file, the right checklist is already waiting for you."
          points={[
            { label: "Questions asked", value: "8" },
            { label: "Tasks generated", value: "24" },
            { label: "Built by hand", value: "0" },
          ]}
        />
      }
      footer={
        <p className="text-center text-[14px] text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-itera-600 hover:text-itera-700">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Whitmore"
          autoComplete="name"
          required
        />
        <Input
          id="email"
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@brokerage.com"
          autoComplete="email"
          required
        />
        <Button type="submit" size="lg" className="w-full">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] leading-relaxed text-ink-500">
        This is a demonstration build. Nothing you enter is sent anywhere or
        checked against a real account.
      </p>
    </AuthShell>
  );
}
