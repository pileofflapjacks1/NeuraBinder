import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NeuraBinder",
    template: "%s · NeuraBinder",
  },
  description:
    "BCI/Neuralink-native TCG collection and portfolio manager for Pokémon TCG and Disney Lorcana. Thought-first, accessible, offline-capable.",
  applicationName: "NeuraBinder",
  authors: [{ name: "NeuraBinder" }],
  keywords: [
    "Neuralink",
    "BCI",
    "Pokémon TCG",
    "Lorcana",
    "collection tracker",
    "PWA",
    "accessibility",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NeuraBinder",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "NeuraBinder",
    description:
      "The first TCG collection manager designed for high-bandwidth brain-computer interfaces.",
    type: "website",
    siteName: "NeuraBinder",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a14" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
