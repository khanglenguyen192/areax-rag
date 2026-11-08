import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produces a self-contained server in .next/standalone so the Docker image does not need node_modules.
  output: "standalone",
  // We keep agent guidance in CODING_STANDARD.md; do not generate AGENTS.md on `next dev`.
  agentRules: false,
  experimental: {
    // Barrels are required for developer experience, but Next re-evaluates a whole barrel on every
    // import unless it is listed here.
    optimizePackageImports: [
      "@/components/atoms",
      "@/components/molecules",
      "@/components/organisms",
      "@/components/templates",
    ],
  },
  sassOptions: {
    // Lets SCSS modules write `@use "tokens"` and `@use "mixins"` without relative paths.
    loadPaths: [path.join(process.cwd(), "src/styles")],
    // Bootstrap 5 still uses `@import` and global built-in functions; we cannot fix that upstream.
    silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"],
  },
};

export default nextConfig;
