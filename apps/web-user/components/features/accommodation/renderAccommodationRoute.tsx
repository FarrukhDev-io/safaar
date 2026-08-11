import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AccommodationPage } from "@/components/accommodation/AccommodationPage";

export type AccommodationRouteKey =
  | "hotels"
  | "dachas"
  | "sanatoriums"
  | "resorts";

export async function generateAccommodationMetadata(
  lang: string,
  key: AccommodationRouteKey
): Promise<Metadata> {
  if (!isLocale(lang)) return {};
  const common = await getDictionary(lang as Locale, "common");
  const title = key === "hotels"
    ? (await getDictionary(lang as Locale, "hotels")).title
    : (common.nav as Record<string, string>)[key] ?? key;
  return { title };
}

export async function renderAccommodationRoute(
  lang: string,
  searchParams: Record<string, string | string[] | undefined>,
  key: AccommodationRouteKey
) {
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const common = await getDictionary(locale, "common");
  const title = key === "hotels"
    ? (await getDictionary(locale, "hotels")).title
    : (common.nav as Record<string, string>)[key] ?? key;

  return (
    <AccommodationPage
      locale={locale}
      searchParams={searchParams}
      basePath={`/${locale}/${key}`}
      title={title}
    />
  );
}
