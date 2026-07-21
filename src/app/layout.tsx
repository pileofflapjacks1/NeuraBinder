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
    "BCI-inspired TCG collection & portfolio manager for Pokémon TCG and Disney Lorcana. Computer-side demo with intent palette, showcase mode, and accessibility tools. Not implant software.",
  applicationName: "NeuraBinder",
  authors: [{ name: "NeuraBinder" }],
  keywords: [
    "BCI",
    "accessibility",
    "Pokémon TCG",
    "Lorcana",
    "collection tracker",
    "PWA",
    "Neurabeach",
    "intent",
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ),
  openGraph: {
    title: "NeuraBinder",
    description:
      "BCI-inspired TCG binder — intent palette, showcase path, computer-side only. Not affiliated with Neuralink.",
    type: "website",
    siteName: "NeuraBinder",
    images: [
      {
        url: "/og/demo.svg",
        width: 1200,
        height: 630,
        alt: "NeuraBinder BCI Mode demo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeuraBinder",
    description:
      "BCI-inspired TCG collection manager — /demo showcase, computer-side only.",
    images: ["/og/demo.svg"],
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
