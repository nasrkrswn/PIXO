import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep this app's build and Turbopack resolution scoped to the frontend workspace.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
