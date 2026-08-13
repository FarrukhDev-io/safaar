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

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TransportPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const sp = await searchParams;
  const checkIn = one(sp.check_in);
  const checkOut = one(sp.check_out);

  const [transportDict, transports] = await Promise.all([
    getDictionary(locale, "transport"),
    api.catalog.getTransports(locale, { checkIn, checkOut }),
  ]);

  const items: TransportItem[] = transports.map((item) => ({
    ...item,
    categoryKey: toTransportCategory(item.categoryKey),
  }));

  return (
    <main className="flex flex-1 flex-col">
      <TransportView
        dict={transportDict}
        items={items}
        locale={locale}
        defaultCheckIn={checkIn}
        defaultCheckOut={checkOut}
      />
    </main>
  );
}

function toTransportCategory(value: string): TransportItem["categoryKey"] {
  if (value === "rent" || value === "transfer" || value === "vip") {
    return value;
  }
  return "transfer";
}
