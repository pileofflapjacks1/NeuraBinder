import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Local suite package (file:../neuralbridge)
  transpilePackages: ["neuralbridge"],
  // Avoid monorepo lockfile root inference warning when ~/package-lock.json exists
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pokemontcg.io",
      },
    ],
  },
  // PWA headers for offline-friendly caching of static assets (service worker optional Phase 2)
  headers: async () => [
    {
      source: "/manifest.webmanifest",
      headers: [
        {
          key: "Content-Type",
          value: "application/manifest+json",
        },
      ],
    },
  ],
};

export default nextConfig;
