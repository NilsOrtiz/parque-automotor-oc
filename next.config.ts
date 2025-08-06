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
  webpack: (config, { isServer }) => {
    // Fix para pdfjs-dist en el browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false
      }
    }
    return config
  },
};

export default nextConfig;
