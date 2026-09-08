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
  async headers() {
    // SECURITY-P3 (A12-4, docs/product/security-product-readiness-report.md):
    // the Content-Security-Policy itself now lives in middleware.ts, because
    // it needs a fresh per-request nonce that this static headers() function
    // cannot generate (it is evaluated once, not per request). The headers
    // below have no per-request component, so they stay here -- brought to
    // parity with web-user, which already had them.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
