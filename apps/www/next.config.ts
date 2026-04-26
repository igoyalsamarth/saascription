import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Optional: Add trailing slashes for better SEO and compatibility
  trailingSlash: true,
  // Optional: Disable image optimization if not using a compatible provider
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
