import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/adapter-better-sqlite3', 'better-sqlite3', 'better-sqlite3-multiple-ciphers'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
