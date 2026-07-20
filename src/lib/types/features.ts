/**
 * Extended feature types for local-first MVP expansions.
 */

import type {
  Card,
  CardCondition,
  GradeCompany,
  ScanCandidate,
  VariantType,
} from "./index";

export interface InventoryLot {
  id: string;
  userCardId: string;
  quantity: number;
  unitCost: number;
  fees: number;
  purchasedAt: string;
  notes?: string;
  /** Remaining qty if partially sold */
  remaining: number;
}

export interface PriceAlert {
  id: string;
  cardId: string;
  cardName: string;
  direction: "below" | "above";
  targetPrice: number;
  active: boolean;
  /** last known price when evaluated */
  lastPrice?: number;
  triggeredAt?: string;
  createdAt: string;
}

export interface WatchItem {
  id: string;
  cardId: string;
  note?: string;
  createdAt: string;
}

export interface MarketEvent {
  id: string;
  title: string;
  date: string;
  kind: "release" | "spike" | "reprint" | "note";
  game?: string;
  setId?: string;
  body: string;
}

export interface PendingScanItem {
  id: string;
  createdAt: string;
  status: "pending" | "confirmed" | "rejected";
  candidates: ScanCandidate[];
  selectedIndex: number;
  /** optional camera snapshot */
  imageDataUrl?: string;
}

export type OfflineOpType =
  | "add_card"
  | "update_card"
  | "remove_card"
  | "adjust_qty"
  | "add_to_list"
  | "remove_from_list";

export interface OfflineOp {
  id: string;
  type: OfflineOpType;
  payload: Record<string, unknown>;
  createdAt: string;
  status: "queued" | "flushed" | "failed";
  error?: string;
}

export type AiActionType =
  | "set_filters"
  | "add_card"
  | "add_to_want"
  | "move_to_list"
  | "adjust_quantity"
  | "create_alert"
  | "navigate";

export interface AiAction {
  type: AiActionType;
  label: string;
  /** human confirmation text */
  description: string;
  payload: Record<string, unknown>;
}

export interface AiQueryResultExt {
  actions?: AiAction[];
}

export interface TradePeer {
  id: string;
  displayName: string;
  /** card ids they want */
  wantCardIds: string[];
  /** card ids they have (simplified) */
  haveCardIds: string[];
  bio?: string;
}

export interface TradeMatch {
  peer: TradePeer;
  /** they want what I have */
  theyWantFromMe: { cardId: string; name: string; value: number }[];
  /** I want what they have */
  iWantFromThem: { cardId: string; name: string; value: number }[];
  score: number;
}

export interface GradeAdvice {
  recommend: boolean;
  reason: string;
  rawValue: number;
  projectedPsa10: number;
  estimatedFee: number;
  netIfTen: number;
  breakEvenGrade: string;
}

export interface CheapestPathItem {
  card: Card;
  marketPrice: number;
  cumulative: number;
}

export interface BciProfile {
  targetSize: "default" | "large" | "xl";
  /** ms to dwell before auto-select in dwell mode */
  dwellMs: number;
  useDwell: boolean;
  confirmTimeoutMs: number;
  /** prefer top scan candidate auto-highlight */
  scanAutoRankAggressive: boolean;
  /** assume no continuous cursor — switch/scan only */
  intentOnlyMode: boolean;
  switchScanMs: number;
  soundFeedback: boolean;
  calibrated: boolean;
}

export interface RecentAction {
  id: string;
  label: string;
  href?: string;
  intent?: string;
  at: string;
}

export type ImportFormat = "neurabinder" | "tcgplayer" | "collectr" | "auto";

export interface ImportRow {
  name: string;
  setName?: string;
  setCode?: string;
  number?: string;
  quantity: number;
  condition: CardCondition;
  variant: VariantType;
  language: string;
  isGraded: boolean;
  gradeCompany?: GradeCompany;
  grade?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  /** matched catalog id if found */
  matchedCardId?: string;
  matchConfidence: number;
  raw: Record<string, string>;
}

export interface ImportPreview {
  format: ImportFormat;
  rows: ImportRow[];
  matched: number;
  unmatched: number;
  errors: string[];
}
