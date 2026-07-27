import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Local suite package (file:../neuralbridge)
  transpilePackages: ["neuralbridge"],
  // Avoid monorepo lockfile root inference warning when ~/package-lock.json exists
  turbopack: {
    root: process.cwd(),
    // neuralbridge optionally imports Node fs — stub only those (do not alias `path`)
    resolveAlias: {
      "fs/promises": "./src/lib/empty-module.ts",
      fs: "./src/lib/empty-module.ts",
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "fs/promises": false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pokemontcg.io",
      },
    ],
  },
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
