"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Heart, ChevronRight } from "lucide-react";

export interface BaseCardProps {
  imageSrc?: string | null;
  imageAlt?: string;
  badge?: React.ReactNode;          // Rasm ustidagi rating badge (e.g. ★ 4.9)
  title: React.ReactNode;           // Katta sarlavha
  subInfo?: React.ReactNode;        // Joylashuv (e.g. 📍 Toshkent)
  rating?: React.ReactNode;         // Reyting yoki teglar (Wi-Fi, Nonushta)
  footerLeft?: React.ReactNode;     // Pastki chap qism (Narx)
  footerRight?: React.ReactNode;    // Pastki o'ng qism (Tugma)
  href?: string;                    // Link o'rami (optional)
  onClick?: () => void;
  className?: string;
  variant?: "default" | "overlay";  // 'default' - pastda matn, 'overlay' - shahar kartalari
}

export function BaseCard({
  imageSrc,
  imageAlt = "",
  badge,
  title,
  subInfo,
  rating,
  footerLeft,
  footerRight,
  href,
  onClick,
  className = "",
  variant = "default",
}: BaseCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const content = (
    <article className={`flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-[24px] border border-slate-200/80 bg-white shadow-xs sm:shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 ${className}`}>
      {variant === "overlay" ? (
        /* Overlay variant (e.g. City Card) */
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              quality={85}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 opacity-60">
              <ImageOff className="mb-2 h-8 w-8" />
              <span className="text-xs font-medium uppercase tracking-wider">Rasm yo'q</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {badge && <div className="absolute left-3 top-3 z-10">{badge}</div>}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="text-base sm:text-xl font-extrabold text-white drop-shadow-md">
              {title}
            </div>
            {subInfo && (
              <div className="mt-1 text-xs sm:text-sm font-medium text-white/90 drop-shadow-sm">
                {subInfo}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Default variant (standard card) */
        <>
          <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-t-2xl sm:rounded-t-[24px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                quality={85}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 opacity-60">
                <ImageOff className="mb-2 h-10 w-10" />
              </div>
            )}
            
            {/* Top Left Badge (e.g. ★ 4.9) */}
            {badge && <div className="absolute left-3 top-3 z-10">{badge}</div>}

            {/* Top Right Favorite Heart Button */}
            <button
              type="button"
              aria-label="Sevimli"
              onClick={handleFavoriteClick}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-100/80 bg-white/90 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/90"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavorite
                    ? "fill-rose-500 text-rose-500"
                    : "text-slate-600 dark:text-slate-300 hover:text-rose-500"
                }`}
              />
            </button>
          </div>

          {/* Card Details */}
          <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-2">
            <div className="line-clamp-1 text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {title}
            </div>
            {subInfo && (
              <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {subInfo}
              </div>
            )}
            {rating && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {rating}
              </div>
            )}
          </div>

          {/* Card Footer */}
          {(footerLeft || footerRight) && (
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800/80">
              <div className="flex flex-col min-w-0">{footerLeft}</div>
              {footerRight ? (
                <div className="shrink-0 flex items-center">{footerRight}</div>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-extrabold text-blue-600 transition-all duration-200 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                  Batafsil <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="group block rounded-3xl focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className="group cursor-pointer focus-visible:outline-none"
    >
      {content}
    </div>
  );
}

