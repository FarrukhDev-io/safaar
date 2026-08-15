"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CityOption } from "@/types/view";
import type { Locale } from "@/i18n/config";

interface CityPillsProps {
  cities: CityOption[];
  locale: Locale;
}

export function CityPills({ cities, locale }: CityPillsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 200 : -200, behavior: "smooth" });
  };

  const displayCities = cities.slice(0, 8);

  return (
    <div className="relative mx-auto mt-2 w-full max-w-5xl sm:mt-4">
      {/* Left fade + arrow */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center transition-opacity duration-200 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-10 bg-gradient-to-r from-white/80 to-transparent dark:from-slate-950/80" />
      </div>
      <button
        onClick={() => scroll("left")}
        className={`absolute left-1 top-1/2 z-20 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 ${
          canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-label="Chapga"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      {/* Pills track */}
      <div
        ref={trackRef}
        className="flex items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-none sm:justify-center"
      >
        {displayCities.map((city) => (
          <Link
            key={city.id}
            href={`/${locale}/hotels?city_id=${encodeURIComponent(city.id)}`}
            className="shrink-0 rounded-full border border-slate-100 bg-white px-5 py-2 text-[13px] font-bold text-slate-800 shadow-card transition-all duration-300 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600 hover:-translate-y-0.5 active:scale-95 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-primary-500 dark:hover:bg-slate-800"
          >
            <span className="capitalize">{city.name}</span>
          </Link>
        ))}
      </div>

      {/* Right fade + arrow */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center transition-opacity duration-200 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-10 bg-gradient-to-l from-white/80 to-transparent dark:from-slate-950/80" />
      </div>
      <button
        onClick={() => scroll("right")}
        className={`absolute right-1 top-1/2 z-20 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 ${
          canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-label="O'ngga"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
