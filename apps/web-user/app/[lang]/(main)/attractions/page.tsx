import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { AttractionsView } from "@/components/features/attractions/AttractionsView";
import type { AttractionItem } from "@/components/catalog/types";

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
    title: commonDict.nav.attractions,
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

  const [attractionsDict, attractions] = await Promise.all([
    getDictionary(locale, "attractions"),
    api.catalog.getAttractions(locale),
  ]);

  const items: AttractionItem[] = attractions.map((item) => ({
    ...item,
    categoryKey: toAttractionCategory(item.categoryKey),
  }));

  return (
    <main className="flex flex-1 flex-col">
      <AttractionsView dict={attractionsDict} items={items.length > 0 ? items : MOCK_ATTRACTIONS} />
    </main>
  );
}

function toAttractionCategory(value: string): AttractionItem["categoryKey"] {
  if (value === "historical" || value === "unesco" || value === "nature") {
    return value;
  }
  return "historical";
}

// ─── DEV MOCK DATA ─────────────────────────────────────────────────────────────
// Faqat API dan bo'sh ro'yxat kelganda ishlatiladi.
// Production'da real API ma'lumotlari ustunlik qiladi.
const MOCK_ATTRACTIONS: AttractionItem[] = [
  {
    id: "1",
    name: "Registon Maydoni",
    cityName: "Samarqand",
    categoryKey: "historical",
    categoryDefault: "Tarixiy Obida",
    description: "O'rta Osiyo me'morchiligining eng ulug'vor namunasi.",
    rating: 4.9,
    imageUrl: "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=800&q=80",
    bestTimeToVisit: "Aprel — Iyun, Sentyabr — Oktyabr",
  },
  {
    id: "2",
    name: "Xiva Ichon-Qal'a",
    cityName: "Xiva",
    categoryKey: "unesco",
    categoryDefault: "UNESCO Merosi",
    description: "Butun dunyoga mashhur ochiq osmon ostidagi muzey-shahar.",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80",
    bestTimeToVisit: "Mart — May",
  },
  {
    id: "3",
    name: "Chimyon Tog'lari",
    cityName: "Toshkent viloyati",
    categoryKey: "nature",
    categoryDefault: "Tabiat & Hordiq",
    description: "Poytaxtga yaqin joylashgan tog' kurort mintaqasi.",
    rating: 4.6,
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    bestTimeToVisit: "Yil davomida",
  },
  {
    id: "4",
    name: "Lyabi-Hovuz Ansambli",
    cityName: "Buxoro",
    categoryKey: "historical",
    categoryDefault: "Tarixiy Obida",
    description: "XVII asrda qurilgan hovuz atrofidagi tarixiy ansambli.",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800&q=80",
    bestTimeToVisit: "Oktyabr — Aprel",
  },
  {
    id: "5",
    name: "Aral Dengizi",
    cityName: "Qoraqalpog'iston",
    categoryKey: "nature",
    categoryDefault: "Tabiat & Hordiq",
    description: "Noyob ekologik turistik zona — qurigan dengiz izi.",
    rating: 4.3,
    imageUrl: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800&q=80",
    bestTimeToVisit: "Aprel — Iyun",
  },
  {
    id: "6",
    name: "Shah-i-Zinda",
    cityName: "Samarqand",
    categoryKey: "unesco",
    categoryDefault: "UNESCO Merosi",
    description: "X–XV asrlarga oid ko'rkam mozorlar to'plami.",
    rating: 4.8,
    imageUrl: "https://images.unsplash.com/photo-1565034946487-077786996e27?w=800&q=80",
    bestTimeToVisit: "Mart — Noyabr",
  },
  {
    id: "7",
    name: "Fergana Vodiysi",
    cityName: "Farg'ona",
    categoryKey: "nature",
    categoryDefault: "Tabiat & Hordiq",
    description: "Ipak yo'lining markazida joylashgan unumdor vohalar.",
    rating: 4.5,
    imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
    bestTimeToVisit: "Yoz va Kuz",
  },
  {
    id: "8",
    name: "Ark Qal'asi",
    cityName: "Buxoro",
    categoryKey: "historical",
    categoryDefault: "Tarixiy Obida",
    description: "2000 yildan ortiq tarixi bo'lgan qadimiy qal'a.",
    rating: 4.7,
    imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&q=80",
    bestTimeToVisit: "Sentyabr — Noyabr",
  },
];
