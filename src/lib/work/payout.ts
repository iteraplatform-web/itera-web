import type { TransactionFile, User } from "@/types";

/** Typical when the agent has not set their own terms in Settings. */
export const DEFAULT_AGENT_SPLIT = 80;
export const DEFAULT_TRANSACTION_FEE = 395;

export interface PayoutBreakdown {
  price: number;
  ratePct: number;
  gross: number;
  referralPct: number;
  referralFee: number;
  afterReferral: number;
  agentSplitPct: number;
  brokerageShare: number;
  transactionFee: number;
  /** What the agent keeps before giving any rebate back to their client. */
  beforeRebate: number;
  rebate: number;
  net: number;
}

/**
 * What actually reaches the agent, in the order money is taken at closing:
 * gross compensation → referral fee to the referring broker → brokerage split →
 * flat transaction fee → rebate back to the agent's own client. The file header
 * and the Offers & Money tab both use this, so take-home is the same number
 * in both places.
 */
export function calculatePayout(file: TransactionFile, user?: User | null): PayoutBreakdown {
  const price = file.financials.listPrice || file.listPrice || 0;
  const rate = file.financials.commissionRate || 0;
  const gross = price * rate;
  const referralPct = referralPercent(file);
  const referralFee = gross * (referralPct / 100);
  const afterReferral = gross - referralFee;
  const agentSplitPct = user?.agentSplit ?? DEFAULT_AGENT_SPLIT;
  const brokerageShare = afterReferral * (1 - agentSplitPct / 100);
  const transactionFee = gross > 0 ? user?.transactionFee ?? DEFAULT_TRANSACTION_FEE : 0;
  const beforeRebate = afterReferral - brokerageShare - transactionFee;
  const rebate = Math.max(0, file.financials.rebate || 0);
  const net = Math.max(0, beforeRebate - rebate);

  return {
    price,
    ratePct: rate * 100,
    gross,
    referralPct,
    referralFee,
    afterReferral,
    agentSplitPct,
    brokerageShare,
    transactionFee,
    beforeRebate,
    rebate,
    net,
  };
}

/**
 * Referral fee comes off the top only when the file is flagged as a referral.
 * The referral agreement is where the agent types the percent. If that box
 * is still empty, the percent saved at intake is used.
 */
function referralPercent(file: TransactionFile): number {
  if (!file.isReferral) return 0;
  const fromAgreement = file.agreements?.find((a) => a.kind === "referral")?.referralPercentage;
  if (fromAgreement) return fromAgreement;
  return file.financials.referralPercentage ?? file.referralPercentage ?? 0;
}

export const money = (n: number) => {
  const r = Math.round(n);
  return `${r < 0 ? "-" : ""}$${Math.abs(r).toLocaleString()}`;
};
