import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    optimizePackageImports: ['@hugeicons/core-free-icons', '@hugeicons/react', 'lucide-react'],
  },
};

export default nextConfig;