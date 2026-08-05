import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// Pin the workspace root to this app. Without it, Next walks up and finds the
// monorepo's root lockfile, warning about ambiguous roots (mobile/api live
// alongside). This app is self-contained (its own node_modules), like mobile.
const nextConfig: NextConfig = {
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
};

export default nextConfig;
