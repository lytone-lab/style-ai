import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  webpack(config, { dev, isServer }) {
    if (dev) { config.cache = false; }
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
      config.resolve.alias = { ...config.resolve.alias, "onnxruntime-web/webgpu": false };
    }
    return config;
  },
};
export default nextConfig;
