/**
 * Local CSV import for NeuraBinder / TCGPlayer-style / Collectr-style exports.
 * No network required.
 */

import type {
  Card,
  CardCondition,
  GradeCompany,
  VariantType,
} from "@/lib/types";
import type { ImportFormat, ImportPreview, ImportRow } from "@/lib/types/features";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length)) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell.trim());
    if (row.some((c) => c.length)) rows.push(row);
  }
  return rows;
}

function normHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function detectFormat(headers: string[]): ImportFormat {
  const h = new Set(headers.map(normHeader));
  if (h.has("product_name") || h.has("tcgplayer_id") || h.has("printing"))
    return "tcgplayer";
  if (h.has("card_name") && (h.has("set") || h.has("expansion"))) return "collectr";
  if (h.has("card_id") || h.has("neurabinder_id")) return "neurabinder";
  return "auto";
}

function mapCondition(raw?: string): CardCondition {
  if (!raw) return "NM";
  const s = raw.toUpperCase().replace(/\s+/g, "");
  if (s.includes("NEAR") || s === "NM" || s === "M" || s === "MINT") return "NM";
  if (s.includes("LIGHT") || s === "LP") return "LP";
  if (s.includes("MODER") || s === "MP") return "MP";
  if (s.includes("HEAV") || s === "HP") return "HP";
  if (s.includes("DAM") || s === "DMG" || s === "POOR") return "DMG";
  return "NM";
}

function mapVariant(raw?: string): VariantType {
  if (!raw) return "normal";
  const s = raw.toLowerCase();
  if (s.includes("special illustration") || s.includes("sir"))
    return "special_illustration_rare";
  if (s.includes("illustration") || s === "ir") return "illustration_rare";
  if (s.includes("reverse")) return "reverse_holo";
  if (s.includes("holo") || s.includes("holofoil")) return "holo";
  if (s.includes("enchanted")) return "enchanted";
  if (s.includes("full art")) return "full_art";
  if (s.includes("first")) return "first_edition";
  return "normal";
}

function get(
  obj: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = obj[k] ?? obj[normHeader(k)];
    if (v != null && v !== "") return v;
  }
  // fuzzy
  for (const [hk, hv] of Object.entries(obj)) {
    for (const k of keys) {
      if (hk.includes(normHeader(k)) && hv) return hv;
    }
  }
  return undefined;
}

function matchCard(
  catalog: Card[],
  name: string,
  setHint?: string,
  number?: string
): { id?: string; confidence: number } {
  const n = name.toLowerCase().trim();
  if (!n) return { confidence: 0 };

  let best: Card | undefined;
  let score = 0;

  for (const c of catalog) {
    let s = 0;
    if (c.name.toLowerCase() === n) s += 50;
    else if (c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase()))
      s += 30;
    else if (c.searchText.includes(n)) s += 15;
    else continue;

    if (number && c.number.replace(/^0+/, "") === number.replace(/^0+/, ""))
      s += 40;
    if (setHint) {
      const sh = setHint.toLowerCase();
      if (
        c.setName.toLowerCase().includes(sh) ||
        c.setCode.toLowerCase() === sh ||
        c.setId === sh
      )
        s += 25;
    }
    if (s > score) {
      score = s;
      best = c;
    }
  }

  if (!best || score < 30) return { confidence: score / 100 };
  return { id: best.id, confidence: Math.min(1, score / 100) };
}

function rowFromMap(
  map: Record<string, string>,
  catalog: Card[]
): ImportRow | null {
  const name =
    get(map, "name", "card_name", "product_name", "product", "title") ?? "";
  if (!name) return null;

  const setName = get(map, "set_name", "set", "expansion", "set_name");
  const setCode = get(map, "set_code", "set_code", "abbr");
  const number = get(map, "number", "card_number", "collector_number", "#");
  const qty = parseInt(get(map, "quantity", "qty", "count") ?? "1", 10) || 1;
  const condition = mapCondition(get(map, "condition", "cond"));
  const variant = mapVariant(
    get(map, "variant", "printing", "finish", "rarity")
  );
  const language = (get(map, "language", "lang") ?? "en").toLowerCase();
  const grade = get(map, "grade");
  const gradeCompany = get(map, "grade_company", "grader") as
    | GradeCompany
    | undefined;
  const isGraded = !!(grade || gradeCompany || /true|yes|1/i.test(get(map, "graded") ?? ""));
  const purchasePrice = parseFloat(
    get(map, "purchase_price", "cost", "paid", "price_paid") ?? ""
  );
  const purchaseDate = get(map, "purchase_date", "date");
  const notes = get(map, "notes", "comment");

  const explicitId = get(map, "card_id", "neurabinder_id");
  let matchedCardId = explicitId;
  let matchConfidence = explicitId ? 1 : 0;
  if (!matchedCardId) {
    const m = matchCard(catalog, name, setName ?? setCode, number);
    matchedCardId = m.id;
    matchConfidence = m.confidence;
  }

  return {
    name,
    setName,
    setCode,
    number,
    quantity: qty,
    condition,
    variant,
    language,
    isGraded,
    gradeCompany: isGraded ? gradeCompany ?? "PSA" : undefined,
    grade,
    purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : undefined,
    purchaseDate,
    notes,
    matchedCardId,
    matchConfidence,
    raw: map,
  };
}

export function parseImportCsv(
  text: string,
  catalog: Card[],
  formatHint: ImportFormat = "auto"
): ImportPreview {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  if (table.length < 2) {
    return {
      format: formatHint,
      rows: [],
      matched: 0,
      unmatched: 0,
      errors: ["CSV needs a header row and at least one data row."],
    };
  }

  const headers = table[0].map(normHeader);
  const format =
    formatHint === "auto" ? detectFormat(table[0]) : formatHint;
  const rows: ImportRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    const map: Record<string, string> = {};
    headers.forEach((h, idx) => {
      map[h] = cells[idx] ?? "";
    });
    try {
      const row = rowFromMap(map, catalog);
      if (row) rows.push(row);
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : "parse error"}`);
    }
  }

  const matched = rows.filter((r) => r.matchedCardId).length;
  return {
    format,
    rows,
    matched,
    unmatched: rows.length - matched,
    errors,
  };
}

export const SAMPLE_CSV = `name,set_name,number,quantity,condition,variant,purchase_price
Pikachu,Scarlet & Violet 151,025,2,NM,normal,0.35
Charmander,Scarlet & Violet 151,168,1,NM,illustration_rare,30
Stitch - Rock Star,The First Chapter,5,1,NM,normal,40
`;
