import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // The application enforces a 2 MB file limit; this leaves room for multipart metadata.
      bodySizeLimit: "2200kb",
    },
  },
};

export default nextConfig;
