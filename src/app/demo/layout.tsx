import type { Metadata } from "next";

const title = "NeuraBinder Demo — BCI Mode & Intent Showcase";
const description =
  "Live computer-side demo: BCI Mode, synthetic intents, showcase path, and TCG collection UI. Not implant software. Not affiliated with Neuralink, Pokémon, or Disney.";

export const metadata: Metadata = {
  title: "Demo",
  description,
  openGraph: {
    title,
    description,
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
    title,
    description,
    images: ["/og/demo.svg"],
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
