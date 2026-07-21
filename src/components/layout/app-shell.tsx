"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Camera,
  Command,
  LayoutGrid,
  Library,
  LineChart,
  List,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBciStore } from "@/lib/stores/bci-store";
import { CommandBar } from "@/components/command/command-bar";
import { IntentPalette } from "@/components/intent/intent-palette";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { ShowcaseBanner } from "@/components/showcase/showcase-banner";
import { useShowcaseStore } from "@/lib/stores/showcase-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/", label: "Home", icon: LayoutGrid },
  { href: "/demo", label: "Demo", icon: Sparkles },
  { href: "/collection", label: "Collection", icon: Library },
  { href: "/scan", label: "Scan", icon: Camera },
  { href: "/portfolio", label: "Portfolio", icon: LineChart },
  { href: "/lists", label: "Lists", icon: List },
  { href: "/a11y", label: "A11y", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bciMode = useBciStore((s) => s.bciMode);
  const toggleBciMode = useBciStore((s) => s.toggleBciMode);
  const setCommandBarOpen = useBciStore((s) => s.setCommandBarOpen);
  const setIntentPaletteOpen = useBciStore((s) => s.setIntentPaletteOpen);
  const profile = useBciStore((s) => s.profile);
  const showcase = useShowcaseStore((s) => s.enabled);
  const enableShowcase = useShowcaseStore((s) => s.enable);

  const targetClass =
    profile.targetSize === "xl"
      ? "bci-targets-xl"
      : profile.targetSize === "large"
        ? "bci-targets-large"
        : "";

  return (
    <div
      className={cn(
        "flex min-h-full flex-col bg-background text-foreground",
        targetClass
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <OfflineBanner />
      <ShowcaseBanner />
      <IntentPalette />

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div
          className={cn(
            "mx-auto flex max-w-[1600px] items-center gap-3 px-4",
            bciMode ? "h-16 md:h-20" : "h-14"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
            aria-label="NeuraBinder home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Brain className="h-5 w-5" aria-hidden />
            </span>
            <span className={cn("hidden sm:inline", bciMode && "text-lg")}>
              NeuraBinder
            </span>
          </Link>

          <nav
            className="ml-2 hidden items-center gap-1 lg:flex"
            aria-label="Primary"
          >
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    bciMode ? "h-12 text-base" : "h-9 text-sm",
                    active && "bg-accent text-accent-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={bciMode ? "h-5 w-5" : "h-4 w-4"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size={bciMode ? "bci" : "sm"}
              onClick={() => setIntentPaletteOpen(true)}
              className="hidden sm:inline-flex"
              aria-label="Open intent palette"
            >
              <Command className="h-4 w-4" />
              <span className="hidden md:inline">Intents</span>
              <kbd className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </Button>

            <Button
              variant="outline"
              size={bciMode ? "bci" : "sm"}
              onClick={() => setCommandBarOpen(true)}
              className="hidden sm:inline-flex"
              aria-label="Open command bar"
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-muted-foreground">Ask…</span>
              <kbd className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                /
              </kbd>
            </Button>

            {!showcase && (
              <Button
                variant="ghost"
                size={bciMode ? "bci" : "sm"}
                onClick={() =>
                  enableShowcase({
                    lockData: true,
                    autoTour: false,
                    autoIntentSocket: true,
                  })
                }
                className="hidden md:inline-flex"
                title="Showcase mode for Neurabeach demos"
              >
                Showcase
              </Button>
            )}
            <Button
              variant={bciMode ? "default" : "outline"}
              size={bciMode ? "bci" : "sm"}
              onClick={toggleBciMode}
              aria-pressed={bciMode}
              aria-label={
                bciMode ? "Disable BCI Mode" : "Enable BCI Mode"
              }
            >
              <Brain className="h-4 w-4" />
              <span className="hidden lg:inline">
                {bciMode ? "BCI On" : "BCI Mode"}
              </span>
            </Button>
          </div>
        </div>

        <div className="border-t border-border/50 px-4 py-2">
          <div className="mx-auto max-w-[1600px]">
            <CommandBar compact />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 md:py-6"
      >
        {bciMode && (
          <div className="mb-4 flex flex-wrap items-center gap-2" role="status">
            <Badge variant="default" className="text-sm">
              BCI Mode active
            </Badge>
            {profile.intentOnlyMode && (
              <Badge variant="warning">Intent-only</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              ⌘K intents · / ask · Enter select · Esc cancel · ←/→ navigate
            </span>
          </div>
        )}
        {children}
      </main>

      <nav
        className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
        aria-label="Mobile"
      >
        <ul className={cn("grid grid-cols-5", bciMode ? "h-20" : "h-16")}>
          {NAV.filter((n) => n.href !== "/settings").map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={bciMode ? "h-7 w-7" : "h-5 w-5"} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
