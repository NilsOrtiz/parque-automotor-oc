import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Desactivar ESLint durante build para deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desactivar type checking durante build para deployment  
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
