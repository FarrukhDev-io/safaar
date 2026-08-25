import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import { formatSum } from "@/lib/utils/money";
import { BaseCard } from "@/components/ui/BaseCard";
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
  locale,
  dict,
  now,
}: {
  deal: DealItem;
  locale: Locale;
  dict: HomeDict["deals"];
  now: number;
}) {
  const endsInDays = deal.endsAt && now > 0
    ? Math.max(0, Math.ceil((Date.parse(deal.endsAt) - now) / 86_400_000))
    : 0;

  const badge = (
    <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
      -{deal.discountPercent}%
    </span>
  );

  const subInfo = (
    <>
      {deal.cityName}
      {endsInDays > 0 && (
        <span className="text-slate-400"> · {endsInDays} {dict.days}</span>
      )}
    </>
  );

  return (
    <BaseCard
      imageSrc={deal.imageUrl}
      imageAlt={deal.name}
      badge={badge}
      title={deal.name}
      subInfo={subInfo}
      href={`/${locale}/hotels/${deal.slug}`}
      footerLeft={
        <>
          <span className="text-xs text-slate-400 line-through">
            {formatSum(deal.oldPriceSum)}
          </span>
          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
            {formatSum(deal.newPriceSum)}
          </span>
          <span className="text-[10px] text-slate-400">/ {dict.perNight}</span>
        </>
      }
      footerRight={
        <span className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-all group-hover:border-primary-600 group-hover:bg-primary-600 group-hover:text-white dark:border-slate-700 dark:text-slate-300">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      }
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
