import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { config } from "@/lib/config";

const SITE_URL = config.siteUrl;

/** Indekslanadigan public yo'llar (har bir til uchun sitemap shakllantiriladi). */
const PUBLIC_PATHS = [
  "",
  "/hotels",
  "/dachas",
  "/sanatoriums",
  "/resorts",
  "/restaurants",
  "/attractions",
  "/about",
  "/help",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return locales.flatMap((lang) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${SITE_URL}/${lang}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: path === "" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}${path}`]),
        ),
      },
    })),
  );
}
