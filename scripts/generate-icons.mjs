/**
 * Generate simple PWA icons without external deps (PNG via raw minimal approach).
 * Uses a tiny valid purple PNG for both sizes (browsers accept scaling).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

// 1x1 purple PNG expanded — use a real small base64 PNG
// 192-ish purple square PNG (67 bytes is 1x1; we write a standard purple 1x1 and note SVG fallback)
const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

// For demo PWA installability, also write an SVG icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#7c3aed"/>
  <circle cx="256" cy="220" r="90" fill="none" stroke="#fff" stroke-width="28"/>
  <path d="M160 360c30-50 70-75 96-75s66 25 96 75" fill="none" stroke="#fff" stroke-width="28" stroke-linecap="round"/>
  <circle cx="220" cy="200" r="12" fill="#fff"/>
  <circle cx="292" cy="200" r="12" fill="#fff"/>
</svg>`;

writeFileSync(join(outDir, "icon.svg"), svg);
writeFileSync(join(outDir, "icon-192.png"), png1x1);
writeFileSync(join(outDir, "icon-512.png"), png1x1);
console.log("Wrote icons to public/icons");
