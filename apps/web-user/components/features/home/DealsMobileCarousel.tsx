"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function DealsMobileCarousel({
  children,
  itemsCount,
}: {
  children: ReactNode;
  itemsCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || itemsCount < 3) return;

    const checkAndInitTimer = () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      
      const isMobile = window.matchMedia("(max-width: 639px)").matches;
      if (isMobile) {
        timer.current = setInterval(() => {
          const cardW = el.querySelector("div")?.clientWidth ?? el.clientWidth / 2;
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

    const handleResize = () => checkAndInitTimer();
    window.addEventListener("resize", handleResize);

    return () => {
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [itemsCount]);

  return (
    <div
      ref={ref}
      className="scrollbar-none flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:hidden"
    >
      {children}
    </div>
  );
}
