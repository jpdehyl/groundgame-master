import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "https://5dd9c25c-c80c-4a46-b70d-1a3d01a7db80-00-2ghv0j89yqr8y.riker.replit.dev",
    "https://*.replit.dev",
    "https://*.repl.co",
  ],
  devIndicators: false,
};

export default nextConfig;
