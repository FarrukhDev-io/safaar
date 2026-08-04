/**
 * Centralized Configuration System.
 * All environment variables are validated and exported from here.
 */

function getValidSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL ?? "https://safaar.uz";
  const formatted = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  try {
    new URL(formatted);
    return formatted;
  } catch {
    return "https://safaar.uz";
  }
}

export const config = {
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "https://backend-production-87e6.up.railway.app/v1",
  siteUrl: getValidSiteUrl(),
  isProd: process.env.NODE_ENV === "production",
};
