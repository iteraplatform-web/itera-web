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
  net: number;
}

/**
 * What actually reaches the agent, in the order money is taken at closing:
 * gross commission → referral fee to the referring broker → brokerage split →
 * flat transaction fee. Every screen that shows a payout uses this, so the
 * Overview and the Offers & Money tab can never disagree.
 */
export function calculatePayout(file: TransactionFile, user?: User | null): PayoutBreakdown {
  const price = file.financials.listPrice || file.listPrice || 0;
  const rate = file.financials.commissionRate || 0;
  const gross = price * rate;
  const referralPct = file.isReferral ? file.financials.referralPercentage ?? file.referralPercentage ?? 0 : 0;
  const referralFee = gross * (referralPct / 100);
  const afterReferral = gross - referralFee;
  const agentSplitPct = user?.agentSplit ?? DEFAULT_AGENT_SPLIT;
  const brokerageShare = afterReferral * (1 - agentSplitPct / 100);
  const transactionFee = gross > 0 ? user?.transactionFee ?? DEFAULT_TRANSACTION_FEE : 0;
  const net = Math.max(0, afterReferral - brokerageShare - transactionFee);

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
    net,
  };
}

export const money = (n: number) => {
  const r = Math.round(n);
  return `${r < 0 ? "-" : ""}$${Math.abs(r).toLocaleString()}`;
};
