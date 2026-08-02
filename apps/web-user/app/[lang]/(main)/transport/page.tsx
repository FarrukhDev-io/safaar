import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { api } from "@/lib/api";
import { TransportView } from "@/components/features/transport/TransportView";
import type { TransportItem } from "@/components/catalog/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const [commonDict, transportDict] = await Promise.all([
    getDictionary(lang as Locale, "common"),
    getDictionary(lang as Locale, "transport"),
  ]);
  const transportTitle = (commonDict.nav as typeof commonDict.nav & { transport?: string }).transport ?? "Transport";
  return {
    title: `${transportTitle} — Safaar`,
    description: transportDict.subtitle,
  };
}

export default async function TransportPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [transportDict, transports] = await Promise.all([
    getDictionary(locale, "transport"),
    api.catalog.getTransports(locale),
  ]);

  const items: TransportItem[] = transports.map((item) => ({
    ...item,
    categoryKey: toTransportCategory(item.categoryKey),
  }));

  return (
    <main className="flex flex-1 flex-col">
      <TransportView dict={transportDict} items={items} />
    </main>
  );
}

function toTransportCategory(value: string): TransportItem["categoryKey"] {
  if (value === "rent" || value === "transfer" || value === "vip") {
    return value;
  }
  return "transfer";
}
