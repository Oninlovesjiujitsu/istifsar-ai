import type { NextConfig } from "next";
const path = require('path');

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, '..'),
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

export default nextConfig;