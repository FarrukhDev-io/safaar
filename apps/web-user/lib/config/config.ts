/**
 * Centralized Configuration System.
 * All environment variables are validated and exported from here.
 */

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://safaar.uz",
  isProd: process.env.NODE_ENV === "production",
};
