import type { NextConfig } from "next";

const basePath = process.env.RELAYHUB_FRONTEND_BASE_PATH?.trim() || "";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  ...(basePath
    ? {
        basePath,
        assetPrefix: basePath,
      }
    : {}),
};

export default nextConfig;
