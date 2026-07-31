import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AttractionsView } from "@/components/features/attractions/AttractionsView";

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

  const attractionsDict = await getDictionary(locale, "attractions");

  return (
    <main className="flex flex-1 flex-col">
      <AttractionsView dict={attractionsDict} locale={locale} />
    </main>
  );
}
