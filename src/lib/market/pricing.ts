/**
 * Condition/grade-aware pricing helpers + grade advice (local heuristics).
 */

import type { Card, CollectionItem } from "@/lib/types";
import type { GradeAdvice } from "@/lib/types/features";
import {
  conditionMultiplier,
  estimateUnitValue,
  gradeMultiplier,
} from "@/lib/utils";

const PSA_FEE_ESTIMATE = 25; // rough economy tier placeholder
const SHIPPING_ESTIMATE = 15;

export function rawNmValue(card: Card | undefined, market?: number): number {
  return market ?? card?.marketPrice ?? 0;
}

export function valueBreakdown(
  marketPrice: number,
  condition: string,
  isGraded: boolean,
  gradeCompany?: string,
  grade?: string
) {
  const cond = conditionMultiplier(condition);
  const gradeM = gradeMultiplier(isGraded, gradeCompany, grade);
  const unit = marketPrice * cond * gradeM;
  return {
    marketNm: marketPrice,
    conditionMult: cond,
    gradeMult: gradeM,
    unitValue: unit,
  };
}

/**
 * Heuristic: grade if projected PSA 10 net gain beats fees with margin.
 */
export function shouldIGrade(
  item: CollectionItem,
  opts?: { fee?: number; shipping?: number }
): GradeAdvice {
  const fee = opts?.fee ?? PSA_FEE_ESTIMATE;
  const shipping = opts?.shipping ?? SHIPPING_ESTIMATE;
  const raw = item.card.marketPrice ?? item.estimatedValue ?? 0;
  const rawValue = estimateUnitValue(
    raw,
    item.condition,
    false
  );
  const projectedPsa10 = raw * gradeMultiplier(true, "PSA", "10");
  const totalCost = fee + shipping;
  const netIfTen = projectedPsa10 - totalCost - rawValue;

  // Only recommend if raw NM-ish value is high enough and card is NM
  const recommend =
    !item.isGraded &&
    item.condition === "NM" &&
    raw >= 40 &&
    netIfTen > fee * 0.5;

  let reason: string;
  if (item.isGraded) {
    reason = "Already graded — no action needed.";
  } else if (item.condition !== "NM") {
    reason = `Condition is ${item.condition}; grading is usually only worth it for strong NM/M candidates.`;
  } else if (raw < 40) {
    reason = `Raw value (~$${raw.toFixed(0)}) is below typical fee+shipping break-even for modern slabs.`;
  } else if (recommend) {
    reason = `If this pops PSA 10, estimated upside is ~$${netIfTen.toFixed(
      0
    )} after ~$${totalCost} fees/shipping (heuristic).`;
  } else {
    reason =
      "Projected PSA 10 premium may not clear fees with enough margin — hold raw or sell.";
  }

  return {
    recommend,
    reason,
    rawValue,
    projectedPsa10,
    estimatedFee: totalCost,
    netIfTen,
    breakEvenGrade: "PSA 10",
  };
}

/** Apply mild random walk to catalog market prices (local mock refresh). */
export function driftCatalogPrices<T extends { marketPrice?: number; id: string }>(
  cards: T[],
  intensity = 0.04
): T[] {
  return cards.map((c) => {
    if (c.marketPrice == null) return c;
    // deterministic-ish drift from time + id
    let h = 0;
    for (let i = 0; i < c.id.length; i++) h = (h + c.id.charCodeAt(i) * 17) % 997;
    const t = Date.now() / 60000;
    const wave = Math.sin(t + h) * intensity;
    const next = Math.max(0.05, c.marketPrice * (1 + wave));
    return { ...c, marketPrice: Math.round(next * 100) / 100 };
  });
}
