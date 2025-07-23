import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Solo desactivar en producción
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    // Solo desactivar en producción
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
