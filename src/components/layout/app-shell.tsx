"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  Library,
  LineChart,
  Menu,
  Search,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBciStore } from "@/lib/stores/bci-store";
import { CommandBar } from "@/components/command/command-bar";
import { IntentPalette } from "@/components/intent/intent-palette";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { ShowcaseBanner } from "@/components/showcase/showcase-banner";
import { ProfileSwitcher } from "@/components/profile/profile-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

/** Primary nav — only the everyday paths */
const PRIMARY_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/collection", label: "My cards", icon: Library },
  { href: "/binder", label: "Binder", icon: BookOpen },
  { href: "/portfolio", label: "Value", icon: LineChart },
];

/** Everything else — one “More” menu */
const MORE_LINKS = [
  { href: "/scan", label: "Add by photo" },
  { href: "/import", label: "Import spreadsheet" },
  { href: "/lists", label: "Want & trade lists" },
  { href: "/grading", label: "Grading tracker" },
  { href: "/trade", label: "Trade ideas" },
  { href: "/watch", label: "Price alerts" },
  { href: "/demo", label: "Try the demo" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bciMode = useBciStore((s) => s.bciMode);
  const toggleBciMode = useBciStore((s) => s.toggleBciMode);
  const setCommandBarOpen = useBciStore((s) => s.setCommandBarOpen);
  const commandBarOpen = useBciStore((s) => s.commandBarOpen);
  const profile = useBciStore((s) => s.profile);
  const [moreOpen, setMoreOpen] = useState(false);

  // Close menus on navigation
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const targetClass =
    profile.targetSize === "xl"
      ? "bci-targets-xl"
      : profile.targetSize === "large" || bciMode
        ? "bci-targets-large"
        : "";

  const isMoreActive = MORE_LINKS.some(
    (l) => pathname === l.href || pathname.startsWith(l.href + "/")
  );

  const moreMenu = (
    <ul className="space-y-0.5 p-1.5">
      {MORE_LINKS.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            onClick={() => setMoreOpen(false)}
            className={cn(
              "block rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent",
              bciMode && "py-3.5 text-base",
              (pathname === l.href || pathname.startsWith(l.href + "/")) &&
                "bg-primary/10 text-primary"
            )}
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );

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

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div
          className={cn(
            "mx-auto flex max-w-[1200px] items-center gap-2 px-4",
            bciMode ? "h-16" : "h-14"
          )}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
            aria-label="NeuraBinder home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Library className="h-5 w-5" aria-hidden />
            </span>
            <span className="hidden sm:inline">NeuraBinder</span>
          </Link>

          <nav
            className="ml-2 hidden items-center gap-0.5 md:flex"
            aria-label="Main"
          >
            {PRIMARY_NAV.map((item) => {
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
                    "flex items-center gap-1.5 rounded-xl px-3 font-medium transition-colors",
                    bciMode ? "h-11 text-base" : "h-9 text-sm",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 font-medium",
                  bciMode ? "h-11 text-base" : "h-9 text-sm",
                  isMoreActive || moreOpen
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                <Menu className="h-4 w-4" />
                More
              </button>
              {moreOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setMoreOpen(false)}
                  />
                  <div className="absolute left-0 z-50 mt-1 w-56 rounded-2xl border border-border bg-card shadow-xl">
                    {moreMenu}
                  </div>
                </>
              )}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="outline"
              size={bciMode ? "default" : "sm"}
              onClick={() => setCommandBarOpen(true)}
              className="gap-1.5"
              aria-label="Search your cards"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
            <div className="hidden sm:block">
              <ProfileSwitcher compact />
            </div>
            <Button
              variant={bciMode ? "default" : "ghost"}
              size={bciMode ? "default" : "sm"}
              onClick={toggleBciMode}
              aria-pressed={bciMode}
              title="Bigger buttons — easier to tap"
              className="hidden sm:inline-flex gap-1.5"
            >
              {bciMode ? "Easy on" : "Easy"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hidden md:inline-flex"
              aria-label="Settings"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {commandBarOpen && (
          <div className="border-t border-border/50 px-4 py-3">
            <div className="mx-auto max-w-[1200px]">
              <CommandBar compact />
            </div>
          </div>
        )}
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-5 md:py-8"
      >
        {bciMode && (
          <p className="mb-4 text-sm text-muted-foreground" role="status">
            <Badge variant="default" className="mr-2">
              Easy mode
            </Badge>
            Bigger buttons · Search anytime
          </p>
        )}
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
        aria-label="Mobile"
      >
        <ul className={cn("grid grid-cols-5", bciMode ? "h-[4.5rem]" : "h-16")}>
          {PRIMARY_NAV.map((item) => {
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
                    "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={bciMode ? "h-6 w-6" : "h-5 w-5"} />
                  {item.label === "My cards" ? "Cards" : item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                isMoreActive || moreOpen
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              aria-expanded={moreOpen}
            >
              <Menu className={bciMode ? "h-6 w-6" : "h-5 w-5"} />
              More
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile more sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-auto rounded-t-3xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <p className="font-semibold">More</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {moreMenu}
            <div className="border-t border-border p-3">
              <Button
                variant={bciMode ? "default" : "outline"}
                className="w-full"
                onClick={() => {
                  toggleBciMode();
                }}
              >
                {bciMode ? "Easy mode is on" : "Turn on Easy mode"}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Bigger buttons for easier tapping
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
