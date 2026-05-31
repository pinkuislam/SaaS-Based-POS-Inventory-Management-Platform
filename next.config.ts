import type { NextConfig } from "next";

const authUrl =
  process.env.AUTH_URL ??
  process.env.NEXTAUTH_URL ??
  "http://localhost:3000";

const nextConfig: NextConfig = {
  env: {
    AUTH_URL: authUrl,
    NEXTAUTH_URL: authUrl,
  },
};

export default nextConfig;
