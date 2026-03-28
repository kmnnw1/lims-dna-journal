import type { NextConfig } from "next";

/** Сборка Next.js: tree-shaking для lucide-react. */
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;