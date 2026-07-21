/**
 * Scripted showcase path for Neurabeach talks.
 * Navigates key surfaces with timed steps — fully local.
 */

export interface ShowcaseStep {
  id: string;
  title: string;
  body: string;
  href?: string;
  /** optional filter hints applied on collection */
  action?:
    | "bci_on"
    | "open_palette"
    | "open_command"
    | "filter_ir"
    | "snapshot_hint"
    | "none";
  dwellMs: number;
}

export const SHOWCASE_SCRIPT: ShowcaseStep[] = [
  {
    id: "intro",
    title: "NeuraBinder showcase",
    body: "BCI-inspired TCG binder — computer-side only. No implant software.",
    href: "/demo",
    action: "bci_on",
    dwellMs: 4000,
  },
  {
    id: "intents",
    title: "Intent palette",
    body: "⌘K ranked actions — few signals for major navigation.",
    href: "/demo",
    action: "open_palette",
    dwellMs: 4500,
  },
  {
    id: "collection",
    title: "Collection + IR filter",
    body: "Fuzzy search, bulk tools, saved views — large targets in BCI Mode.",
    href: "/collection",
    action: "filter_ir",
    dwellMs: 6000,
  },
  {
    id: "binder",
    title: "Visual binder",
    body: "Stable 3×3 spatial pages + cheapest path to complete a set.",
    href: "/binder",
    action: "none",
    dwellMs: 5500,
  },
  {
    id: "portfolio",
    title: "Portfolio",
    body: "Local value, cost basis, tax lots, and snapshots over time.",
    href: "/portfolio",
    action: "snapshot_hint",
    dwellMs: 5000,
  },
  {
    id: "scan",
    title: "Scan confirm loop",
    body: "Ranked candidates → one-intent confirm (vision pluggable later).",
    href: "/scan",
    action: "none",
    dwellMs: 5000,
  },
  {
    id: "a11y",
    title: "Accessibility",
    body: "Keyboard, switch-scan, high contrast, reduced motion — see /a11y.",
    href: "/a11y",
    action: "none",
    dwellMs: 5000,
  },
  {
    id: "close",
    title: "Done",
    body: "Replay anytime from /demo. Manifest: neurabeach-manifest.json",
    href: "/demo",
    action: "none",
    dwellMs: 3000,
  },
];
