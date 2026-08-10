"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeaturedHotelCard } from "./FeaturedHotelCard";
import type { HotelListItem } from "@/types/view";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";

export function FeaturedHotelsCarousel({
  hotels,
  dict,
  locale,
}: {
  hotels: HotelListItem[];
  dict: HomeDict["featured"];
  locale: Locale;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const cards = hotels;

  const updateScrollButtons = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const cardW = el.querySelector("div")?.clientWidth ?? el.clientWidth / 2;
    el.scrollBy({
      left: dir === "left" ? -cardW : cardW,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || cards.length < 3) return;

    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons);

    const checkAndInitTimer = () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        timer.current = setInterval(() => {
          const maxScroll = el.scrollWidth - el.clientWidth;
          if (el.scrollLeft >= maxScroll - 4) {
            el.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            el.scrollBy({ left: el.clientWidth / 2, behavior: "smooth" });
          }
        }, 6000);
      }
    };

    checkAndInitTimer();

    const handleResize = () => {
      updateScrollButtons();
      checkAndInitTimer();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (timer.current) clearInterval(timer.current);
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", handleResize);
    };
  }, [cards.length, updateScrollButtons]);

  if (cards.length === 0) return null;

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl px-4 sm:mt-8 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold tracking-tight sm:text-lg">
          {dict.title}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-card text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-card text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link
            href={`/${locale}/hotels`}
            className="shrink-0 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700 sm:text-sm"
          >
            {dict.all} →
          </Link>
        </div>
      </div>
      {/* Mobile: horizontal scroll */}
      <div
        ref={ref}
        className="scrollbar-none flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:hidden"
      >
        {cards.map((hotel) => (
          <div
            key={hotel.id}
            className="w-[calc(50%-0.375rem)] shrink-0 snap-start"
          >
            <FeaturedHotelCard hotel={hotel} locale={locale} dict={dict} />
          </div>
        ))}
      </div>

      {/* Desktop: 4 cards grid */}
      <div className="hidden gap-4 md:grid md:grid-cols-4">
        {cards.map((hotel) => (
          <FeaturedHotelCard key={hotel.id} hotel={hotel} locale={locale} dict={dict} />
        ))}
      </div>
    </section>
  );
}
