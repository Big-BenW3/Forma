import type { NextConfig } from "next";

/**
 * Next.js configuration for FORMA.
 *
 * Decisions worth knowing about:
 *
 * - `output: "standalone"` makes `next build` emit a self-contained server in
 *   `.next/standalone`. The Dockerfile copies exactly that folder, which keeps
 *   the Render image small and avoids shipping the whole node_modules tree.
 *
 * - `cacheComponents` is deliberately OFF (the scaffold turns it on by default).
 *   With it on, Next keeps previously visited routes mounted in a hidden
 *   <Activity> boundary. For a WebGL workspace that means old 3D scenes can keep
 *   their GPU contexts alive in the background, which is exactly the memory
 *   pressure a mid-range phone cannot afford. We also don't need its caching
 *   model: lesson content is static data and progress is per-user.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  // The dev-mode "N" badge sits over the phone tab bar while testing.
  devIndicators: false,
  // Tailwind v4 is compiled through its Turbopack loader (set up by the scaffold).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
