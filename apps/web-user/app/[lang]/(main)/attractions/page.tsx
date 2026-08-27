import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { AttractionsView } from "@/components/features/attractions/AttractionsView";
import type { AttractionItem } from "@/components/catalog/types";
import { getFavoritesMap } from "@/lib/account/favorites-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const [commonDict, attractionsDict] = await Promise.all([
    getDictionary(lang as Locale, "common"),
    getDictionary(lang as Locale, "attractions"),
  ]);
  return {
    title: `${commonDict.nav.attractions} — Safaar`,
    description: attractionsDict.subtitle,
  };
}

export default async function AttractionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [attractionsDict, attractions, favoritesResult] = await Promise.all([
    getDictionary(locale, "attractions"),
    api.catalog.getAttractions(locale),
    getFavoritesMap("attraction"),
  ]);

  const items: AttractionItem[] = attractions.map((item) => ({
    ...item,
    categoryKey: toAttractionCategory(item.categoryKey),
  }));

  const loginHref = `/${locale}/login?next=${encodeURIComponent(`/${locale}/attractions`)}`;

  return (
    <main className="flex flex-1 flex-col">
      <AttractionsView
        dict={attractionsDict}
        items={items}
        authed={favoritesResult.authed}
        favoriteIds={favoritesResult.favoriteIds}
        loginHref={loginHref}
      />
    </main>
  );
}

function toAttractionCategory(value: string): AttractionItem["categoryKey"] {
  if (value === "historical" || value === "unesco" || value === "nature") {
    return value;
  }
  return "historical";
}
