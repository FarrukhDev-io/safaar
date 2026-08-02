"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { BaseCard } from "@/components/ui/BaseCard";

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
  const { format } = useCurrency();
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
            {format(deal.oldPriceSum)}
          </span>
          <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
            {format(deal.newPriceSum)}
          </span>
          <span className="text-[10px] text-slate-400">/ {dict.perNight}</span>
        </>
      }
      footerRight={
        <span className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
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
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const el = ref.current;
    if (!el || deals.length < 3) return;

    const checkAndInitTimer = () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      
      const isMobile = window.matchMedia("(max-width: 639px)").matches;
      if (isMobile) {
        timer.current = setInterval(() => {
          const cardW = el.clientWidth / 2;
          const maxScroll = el.scrollWidth - el.clientWidth;

          if (el.scrollLeft + cardW >= maxScroll - 4) {
            el.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            el.scrollBy({ left: cardW, behavior: "smooth" });
          }
        }, 6000);
      }
    };

    checkAndInitTimer();

    const handleResize = () => {
      checkAndInitTimer();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [deals.length]);

  if (deals.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          {dict.title}
        </h2>
        <p className="mt-0.5 text-xs font-semibold text-slate-600 sm:text-sm dark:text-slate-400">
          {dict.subtitle}
        </p>
      </div>

      {/* Mobile Carousel */}
      <div
        ref={ref}
        className="scrollbar-none flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:hidden"
      >
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="w-[calc(50%-0.375rem)] shrink-0 snap-start"
          >
            <DealCard deal={deal} locale={locale} dict={dict} now={now} />
          </div>
        ))}
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:grid sm:grid-cols-4 sm:gap-4">
        {deals.slice(0, 4).map((deal) => (
          <DealCard key={deal.id} deal={deal} locale={locale} dict={dict} now={now} />
        ))}
      </div>
    </section>
  );
}
