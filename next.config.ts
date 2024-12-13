import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    GDToT_API_KEY: process.env.GDToT_API_KEY,
    GDToT_BASE_URL: process.env.GDToT_BASE_URL,
    GDToT_EMAIL: process.env.GDToT_EMAIL,
  },
};

export default nextConfig;
