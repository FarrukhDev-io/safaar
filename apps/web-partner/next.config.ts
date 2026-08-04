import type { NextConfig } from "next";

const defaultBackendApiUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/v1"
    : "https://backend-production-87e6.up.railway.app/v1";
const backendApiUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() || defaultBackendApiUrl;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.5.50.43"],
  transpilePackages: ["@safaar/types"],
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendApiUrl.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
