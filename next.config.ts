import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    GDToT_API_KEY: process.env.GDToT_API_KEY,
    GDToT_BASE_URL: process.env.GDToT_BASE_URL,
    GDToT_EMAIL: process.env.GDToT_EMAIL,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
