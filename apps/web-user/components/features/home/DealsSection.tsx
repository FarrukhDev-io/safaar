import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import { UniversalCard } from "@/components/ui/UniversalCard";
import { ShinyText } from "@/components/ui/ShinyText";
import { DealsMobileCarousel } from "./DealsMobileCarousel";

export interface DealItem {
  id: string;
  slug: string;
  name: string;
  cityName: string;
  imageUrl: string;
  oldPriceSum: number;
  newPriceSum: number;
  discountPercent: number;
  endsAt: string;
}

function DealCard({
  deal,
  dict,
  locale,
  now,
}: {
  deal: DealItem;
  dict: HomeDict["deals"];
  locale: Locale;
  now: number;
}) {
  const endsInDays = deal.endsAt && now > 0
    ? Math.max(0, Math.ceil((Date.parse(deal.endsAt) - now) / 86_400_000))
    : 0;

  const discountBadge = (
    <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-black text-white shadow-md">
      -{deal.discountPercent}%
    </span>
  );

  const tags = endsInDays > 0 ? [`⏳ ${endsInDays} ${dict.days}`] : undefined;
  const viewDetailsLabel = locale === "ru" ? "Подробнее" : locale === "en" ? "Details" : "Batafsil";

  return (
    <UniversalCard
      imageSrc={deal.imageUrl}
      imageAlt={deal.name}
      topLeft={discountBadge}
      showFavorite
      title={deal.name}
      location={deal.cityName}
      tags={tags}
      href={`/${locale}/hotels/${deal.slug}`}
      price={{
        amount: deal.newPriceSum,
        oldAmount: deal.oldPriceSum,
        period: `1 ${dict.perNight}`,
      }}
      actionLabel={viewDetailsLabel}
    />
  );
}

export function DealsSection({
  deals,
  dict,
  locale,
}: {
  deals: DealItem[];
  dict: HomeDict["deals"];
  locale: Locale;
}) {
  if (deals.length === 0) return null;

  // RSC rendering evaluates `now` on the server during request time
  const now = Date.now();

  return (
    <section className="mx-auto w-full md:w-[96%] max-w-[1536px] px-3 sm:px-4 md:px-8">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">
          <ShinyText>{dict.title}</ShinyText>
        </h2>
        <p className="mt-0.5 text-xs font-semibold text-slate-600 sm:text-sm dark:text-slate-400">
          {dict.subtitle}
        </p>
      </div>

      {/* Mobile Carousel (Client wrapper for interaction, Server Children) */}
      <DealsMobileCarousel itemsCount={deals.length}>
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="w-[85vw] max-w-[320px] sm:w-[calc(50%-0.375rem)] shrink-0 snap-start"
          >
            <DealCard deal={deal} locale={locale} dict={dict} now={now} />
          </div>
        ))}
      </DealsMobileCarousel>

      {/* Desktop Grid */}
      <div className="hidden sm:grid sm:grid-cols-4 sm:gap-4">
        {deals.slice(0, 4).map((deal) => (
          <DealCard key={deal.id} deal={deal} locale={locale} dict={dict} now={now} />
        ))}
      </div>
    </section>
  );
}
