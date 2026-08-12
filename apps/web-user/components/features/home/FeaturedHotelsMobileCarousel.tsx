"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function FeaturedHotelsMobileCarousel({
  children,
  itemsCount,
}: {
  children: ReactNode;
  itemsCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
    if (!el || itemsCount < 3) return;

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
  }, [itemsCount, updateScrollButtons]);

  return (
    <>
      <div className="absolute right-0 top-0 hidden items-center gap-2 md:hidden sm:flex" style={{ transform: 'translateY(-120%)' }}>
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
      <div
        ref={ref}
        className="scrollbar-none flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:hidden"
      >
        {children}
      </div>
    </>
  );
}
