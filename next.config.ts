import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

const path = require('path')
module.exports = {
  turbopack: {
    root: path.join(__dirname, '..'),
  },
};

export default nextConfig;
