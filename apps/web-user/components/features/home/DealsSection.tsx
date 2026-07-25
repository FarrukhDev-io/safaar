"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tag, Clock } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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

import { useCurrency } from "@/lib/context/CurrencyContext";

export function DealsSection({
  deals,
  dict,
  locale,
}: {
  deals: DealItem[];
  dict: HomeDict["deals"];
  locale: Locale;
}) {
  const { format } = useCurrency();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const el = ref.current;
    if (!el || deals.length < 3) return;

    timer.current = setInterval(() => {
      const cardW = el.clientWidth / 2;
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft + cardW >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardW, behavior: "smooth" });
      }
    }, 6000);

    return () => {
      if (timer.current) clearInterval(timer.current);
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

      {/* Mobile Horizontal Carousel */}
      <div
        ref={ref}
        className="scrollbar-none flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:hidden"
      >
        {deals.map((deal) => {
          const endsInDays = deal.endsAt
            ? Math.max(
                0,
                Math.ceil((Date.parse(deal.endsAt) - now) / 86_400_000),
              )
            : 0;
          return (
            <Link
              key={deal.id}
              href={`/${locale}/hotels/${deal.slug}`}
              className="group w-[calc(50%-0.375rem)] shrink-0 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Card className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:border-blue-400/80 group-hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {deal.imageUrl && (
                    <Image
                      src={deal.imageUrl}
                      alt={deal.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      quality={85}
                    />
                  )}

                  <Badge variant="destructive" className="absolute left-2.5 top-2.5 z-10 gap-1 bg-red-600 text-white font-black shadow-xs">
                    <Tag className="h-3.5 w-3.5" aria-hidden />
                    -{deal.discountPercent}% Flash Sale
                  </Badge>

                  <Badge variant="outline" className="absolute right-2.5 top-2.5 z-10 gap-1 border-white/40 bg-white/80 text-slate-900 font-extrabold backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 dark:text-white shadow-xs">
                    <Clock className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                    {endsInDays} {dict.days}
                  </Badge>
                </div>

                <CardHeader className="p-3.5 pb-2 space-y-0.5">
                  <CardTitle className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">
                    {deal.name}
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {deal.cityName}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-3.5 pt-0 mt-auto">
                  <div className="flex flex-wrap items-baseline gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 line-through">
                      {format(deal.oldPriceSum)}
                    </span>
                    <span className="text-base font-black text-rose-600 dark:text-rose-400">
                      {format(deal.newPriceSum)}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{dict.perNight}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Desktop Grid */}
      <div className="hidden sm:grid sm:grid-cols-4 sm:gap-4">
        {deals.slice(0, 4).map((deal) => {
          const endsInDays = deal.endsAt
            ? Math.max(0, Math.ceil((Date.parse(deal.endsAt) - now) / 86_400_000))
            : 0;
          return (
            <Link
              key={deal.id}
              href={`/${locale}/hotels/${deal.slug}`}
              className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Card className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:border-blue-400/80 group-hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {deal.imageUrl && (
                    <Image
                      src={deal.imageUrl}
                      alt={deal.name}
                      fill
                      sizes="(max-width: 1024px) 25vw, 300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      quality={85}
                    />
                  )}

                  <Badge variant="destructive" className="absolute left-2.5 top-2.5 z-10 gap-1 bg-red-600 text-white font-black shadow-xs">
                    <Tag className="h-3.5 w-3.5" aria-hidden />
                    -{deal.discountPercent}% Flash Sale
                  </Badge>

                  <Badge variant="outline" className="absolute right-2.5 top-2.5 z-10 gap-1 border-white/40 bg-white/80 text-slate-900 font-extrabold backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 dark:text-white shadow-xs">
                    <Clock className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                    {endsInDays} {dict.days}
                  </Badge>
                </div>

                <CardHeader className="p-3.5 pb-2 space-y-0.5">
                  <CardTitle className="line-clamp-1 text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                    {deal.name}
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {deal.cityName}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-3.5 pt-0 mt-auto">
                  <div className="flex flex-wrap items-baseline gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 line-through">
                      {format(deal.oldPriceSum)}
                    </span>
                    <span className="text-base font-black text-rose-600 dark:text-rose-400">
                      {format(deal.newPriceSum)}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{dict.perNight}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
