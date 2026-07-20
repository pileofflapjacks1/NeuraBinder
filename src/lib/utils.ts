import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number | undefined | null,
  currency = "USD"
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function conditionLabel(c: string): string {
  const map: Record<string, string> = {
    NM: "Near Mint",
    LP: "Lightly Played",
    MP: "Moderately Played",
    HP: "Heavily Played",
    DMG: "Damaged",
  };
  return map[c] ?? c;
}

export function variantLabel(v: string): string {
  return v
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function rarityLabel(r: string): string {
  return variantLabel(r);
}

/** Condition multiplier for rough market adjustment */
export function conditionMultiplier(condition: string): number {
  switch (condition) {
    case "NM":
      return 1;
    case "LP":
      return 0.85;
    case "MP":
      return 0.65;
    case "HP":
      return 0.4;
    case "DMG":
      return 0.2;
    default:
      return 1;
  }
}

/** Grade premium rough estimate */
export function gradeMultiplier(
  isGraded: boolean,
  gradeCompany?: string,
  grade?: string
): number {
  if (!isGraded || !grade) return 1;
  const g = parseFloat(grade);
  if (Number.isNaN(g)) return 1.2;
  if (g >= 10) return gradeCompany === "PSA" ? 3.5 : 3.0;
  if (g >= 9.5) return 2.2;
  if (g >= 9) return 1.6;
  if (g >= 8) return 1.25;
  return 1.1;
}

export function estimateUnitValue(
  marketPrice: number | undefined,
  condition: string,
  isGraded: boolean,
  gradeCompany?: string,
  grade?: string
): number {
  const base = marketPrice ?? 0;
  return (
    base *
    conditionMultiplier(condition) *
    gradeMultiplier(isGraded, gradeCompany, grade)
  );
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
