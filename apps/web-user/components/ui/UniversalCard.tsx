"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Heart, MapPin, ChevronRight } from "lucide-react";
import { formatSum } from "@/lib/utils/money";

export interface UniversalCardProps {
  imageSrc?: string | null;
  imageAlt?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "overlay";

  // Top Media Slots
  topLeft?: React.ReactNode;
  topRight?: React.ReactNode;
  showFavorite?: boolean;
  isFavorite?: boolean;
  favoritePending?: boolean;
  onFavoriteToggle?: (isFav: boolean) => void;

  // Content
  title: React.ReactNode;
  location?: React.ReactNode;
  tags?: Array<string | { label: string; icon?: React.ReactNode }> | React.ReactNode;
  extraInfo?: React.ReactNode;

  // Price & Action Footer
  price?: {
    amount: number | string;
    oldAmount?: number | string;
    period?: string;
  };
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onActionClick?: () => void;
}

export function UniversalCard({
  imageSrc,
  imageAlt = "",
  href,
  onClick,
  className = "",
  variant = "default",
  topLeft,
  topRight,
  showFavorite = false,
  isFavorite = false,
  favoritePending = false,
  onFavoriteToggle,
  title,
  location,
  tags,
  extraInfo,
  price,
  footerLeft,
  footerRight,
  actionLabel,
  actionIcon,
  onActionClick,
}: UniversalCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favoritePending) return;
    onFavoriteToggle?.(!isFavorite);
  };

  // Resolve Location Node
  const locationNode = location ? (
    typeof location === "string" ? (
      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{location}</span>
      </span>
    ) : (
      location
    )
  ) : null;

  // Resolve Tags Node
  const tagsNode = Array.isArray(tags) ? (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 pt-0.5 overflow-hidden">
      {tags.map((tag, idx) => {
        const tagText = typeof tag === "string" ? tag : tag.label;
        const tagIcon = typeof tag === "string" ? null : tag.icon;
        return (
          <span
            key={`${tagText}-${idx}`}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200/60 bg-slate-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
          >
            {tagIcon}
            <span>{tagText}</span>
          </span>
        );
      })}
    </div>
  ) : (
    tags
  );

  // Resolve Price Node
  const priceNode = price ? (
    <div className="flex flex-col leading-tight">
      {price.oldAmount !== undefined && (
        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 line-through">
          {typeof price.oldAmount === "number" ? formatSum(price.oldAmount) : price.oldAmount}
        </span>
      )}
      <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white">
        {typeof price.amount === "number" ? formatSum(price.amount) : price.amount}
      </span>
      {price.period && (
        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
          / {price.period}
        </span>
      )}
    </div>
  ) : null;

  // Resolve Action Node
  const actionNode = actionLabel ? (
    <span
      onClick={onActionClick ? (e) => { e.stopPropagation(); onActionClick(); } : undefined}
      className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/80 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-extrabold text-blue-600 transition-all duration-200 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white select-none"
    >
      <span>{actionLabel}</span>
      {actionIcon ?? <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />}
    </span>
  ) : null;

  const content = (
    <article
      className={`group/card flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-[24px] border border-slate-200/80 bg-white shadow-xs sm:shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 ${className}`}
    >
      {variant === "overlay" ? (
        /* Overlay variant (e.g. City Card / Special Showcase) */
        <div className="relative aspect-[4/3] sm:aspect-[3/2] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
              quality={85}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 opacity-60">
              <ImageOff className="mb-2 h-8 w-8" />
              <span className="text-xs font-medium uppercase tracking-wider">Rasm yo'q</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          {topLeft && <div className="absolute left-3 top-3 z-10">{topLeft}</div>}
          {(topRight || showFavorite) && (
            <div className="absolute right-3 top-3 z-10">
              {topRight ?? (
                <button
                  type="button"
                  aria-label="Sevimli"
                  aria-pressed={isFavorite}
                  aria-busy={favoritePending}
                  disabled={favoritePending}
                  onClick={handleFavoriteClick}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100/80 bg-white/90 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white disabled:opacity-60 disabled:cursor-wait dark:border-slate-700/80 dark:bg-slate-900/90"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      isFavorite
                        ? "fill-rose-500 text-rose-500"
                        : "text-slate-600 dark:text-slate-300 hover:text-rose-500"
                    }`}
                  />
                </button>
              )}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="text-base sm:text-xl font-extrabold text-white drop-shadow-md line-clamp-1">
              {title}
            </div>
            {locationNode && (
              <div className="mt-1 text-xs sm:text-sm font-medium text-white/90 drop-shadow-sm">
                {locationNode}
              </div>
            )}
            {extraInfo && (
              <div className="mt-1 text-xs font-medium text-white/80 drop-shadow-sm">
                {extraInfo}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Default variant (standard card) */
        <>
          {/* Top Media Section */}
          <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-t-2xl sm:rounded-t-[24px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
                quality={85}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 opacity-60">
                <ImageOff className="mb-2 h-10 w-10" />
              </div>
            )}

            {topLeft && <div className="absolute left-3 top-3 z-10">{topLeft}</div>}

            {(topRight || showFavorite) && (
              <div className="absolute right-3 top-3 z-10">
                {topRight ?? (
                  <button
                    type="button"
                    aria-label="Sevimli"
                    aria-pressed={isFavorite}
                    aria-busy={favoritePending}
                    disabled={favoritePending}
                    onClick={handleFavoriteClick}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100/80 bg-white/90 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white disabled:opacity-60 disabled:cursor-wait dark:border-slate-700/80 dark:bg-slate-900/90 cursor-pointer"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isFavorite
                          ? "fill-rose-500 text-rose-500"
                          : "text-slate-600 dark:text-slate-300 hover:text-rose-500"
                      }`}
                    />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="flex flex-1 flex-col justify-between px-3.5 pt-3 pb-2 sm:px-4 sm:pt-3.5 sm:pb-2.5">
            <div className="flex flex-col gap-1">
              <div className="line-clamp-1 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {title}
              </div>
              {locationNode}
              {tagsNode}
              {extraInfo}
            </div>

            {/* Card Footer */}
            {(priceNode || footerLeft || actionNode || footerRight) && (
              <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-slate-100 pt-2.5 sm:pt-3 dark:border-slate-800/80">
                <div className="flex flex-col min-w-0">{footerLeft ?? priceNode}</div>
                {(footerRight || actionNode) && (
                  <div className="shrink-0 flex items-center">
                    {footerRight ?? actionNode}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block h-full rounded-2xl sm:rounded-[24px] focus-visible:outline-none"
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`group block h-full focus-visible:outline-none ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {content}
    </div>
  );
}
