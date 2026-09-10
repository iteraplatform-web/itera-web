"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell, AuthAside } from "@/components/layout/auth-shell";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils/cn";

/** Common markets offered as one-tap chips; anything else can be typed in. */
const SUGGESTED_MARKETS = [
  "Austin",
  "Round Rock",
  "Cedar Park",
  "Georgetown",
  "Pflugerville",
  "Leander",
  "Lakeway",
  "San Marcos",
];

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(1);
  const [brokerage, setBrokerage] = useState("");
  const [markets, setMarkets] = useState<string[]>([]);
  const [customMarket, setCustomMarket] = useState("");

  const toggleMarket = (market: string) => {
    setMarkets((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market]
    );
  };

  const addCustomMarket = () => {
    const value = customMarket.trim();
    if (!value || markets.includes(value)) return;
    setMarkets((prev) => [...prev, value]);
    setCustomMarket("");
  };

  const finish = () => {
    completeOnboarding(brokerage.trim(), markets);
    router.push("/dashboard");
  };

  const firstName = user?.name?.split(" ")[0];

  return (
    <AuthShell
      eyebrow="Step 2 of 2"
      title={firstName ? `Nice to meet you, ${firstName}` : "Tell us about your practice"}
      subtitle="Two details so your dashboard opens on the right portfolio."
      aside={
        <AuthAside
          quote="Set it once. Every file you open from here on already knows where it sits."
          points={[
            { label: "Setup steps", value: "2" },
            { label: "Minutes", value: "1" },
            { label: "Forms to fill", value: "0" },
          ]}
        />
      }
    >
      {/* Progress rail */}
      <div className="mb-7 flex items-center gap-2">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              step >= n ? "bg-itera-600" : "bg-ink-200"
            )}
          />
        ))}
      </div>

      {step === 1 ? (
        <div className="animate-fade-in space-y-5">
          <Input
            id="brokerage"
            label="Brokerage name"
            value={brokerage}
            onChange={(e) => setBrokerage(e.target.value)}
            placeholder="Summit Realty Group"
            hint="Appears on your dashboard and in outgoing email signatures."
            autoFocus
          />
          <Button
            size="lg"
            className="w-full"
            disabled={!brokerage.trim()}
            onClick={() => setStep(2)}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="animate-fade-in space-y-5">
          <div>
            <p className="text-[14px] font-medium text-ink-700">Markets you work in</p>
            <p className="mt-1 text-xs text-ink-500">Pick as many as apply.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...SUGGESTED_MARKETS, ...markets.filter((m) => !SUGGESTED_MARKETS.includes(m))].map(
                (market) => {
                  const selected = markets.includes(market);
                  return (
                    <button
                      key={market}
                      type="button"
                      onClick={() => toggleMarket(market)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-medium transition-all",
                        selected
                          ? "bg-itera-600 text-white shadow-xs"
                          : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {market}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <Input
              id="customMarket"
              label="Add another"
              value={customMarket}
              onChange={(e) => setCustomMarket(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomMarket();
                }
              }}
              placeholder="Dripping Springs"
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              className="mb-[1px] h-[42px]"
              onClick={addCustomMarket}
              disabled={!customMarket.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="lg" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button size="lg" className="flex-1" disabled={markets.length === 0} onClick={finish}>
              Open my dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
