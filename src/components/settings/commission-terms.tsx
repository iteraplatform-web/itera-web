"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { useAuthStore } from "@/stores";
import { toast } from "@/stores/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_AGENT_SPLIT, DEFAULT_TRANSACTION_FEE, money } from "@/lib/work/payout";

/** The agent's deal with their brokerage — every payout on every file uses it. */
export function CommissionTerms() {
  const user = useAuthStore((s) => s.user);
  const updateTerms = useAuthStore((s) => s.updateTerms);
  const [split, setSplit] = useState(String(user?.agentSplit ?? DEFAULT_AGENT_SPLIT));
  const [fee, setFee] = useState(String(user?.transactionFee ?? DEFAULT_TRANSACTION_FEE));

  const splitNum = Math.min(100, Math.max(0, Number(split) || 0));
  const feeNum = Math.max(0, Number(fee) || 0);
  // Worked example so the numbers mean something before saving.
  const exampleGross = 15000;
  const exampleNet = exampleGross * (splitNum / 100) - feeNum;

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-[18px] font-semibold text-ink-950">
        <Wallet className="h-5 w-5 text-ink-500" />
        Your commission terms
      </h3>
      <p className="mt-1 text-[15px] text-ink-500">Used to work out your take-home on every file.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input id="split" label="Your share after the brokerage split" type="number" trailing="%" value={split} onChange={(e) => setSplit(e.target.value)} hint="For an 80/20 split, enter 80" />
        <Input id="fee" label="Transaction fee per closing" type="number" leading="$" value={fee} onChange={(e) => setFee(e.target.value)} />
      </div>
      <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-[15px] text-ink-700">
        Example: on {money(exampleGross)} gross commission you would take home{" "}
        <strong className="text-ink-950">{money(Math.max(0, exampleNet))}</strong>.
      </p>
      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => {
            updateTerms({ agentSplit: splitNum, transactionFee: feeNum });
            toast.success("Terms saved", "Every file's payout has been recalculated");
          }}
        >
          Save terms
        </Button>
      </div>
    </div>
  );
}
