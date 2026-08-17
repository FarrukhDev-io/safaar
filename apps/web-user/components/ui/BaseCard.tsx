"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface BaseCardProps {
  imageSrc?: string | null;
  imageAlt?: string;
  badge?: React.ReactNode;          // Rasm ustidagi 1 ta badge (optional)
  title: React.ReactNode;           // Katta sarlavha
  subInfo?: React.ReactNode;        // Kichik qo'shimcha ma'lumotlar qatori
  rating?: React.ReactNode;         // Reyting va sharhlar qatori
  footerLeft?: React.ReactNode;     // Pastki chap qism (Narx)
  footerRight?: React.ReactNode;    // Pastki o'ng qism (CTA tugma yoki o'q)
  href?: string;                    // Link o'rami (optional)
  onClick?: () => void;
  className?: string;
  variant?: "default" | "overlay";  // 'default' - pastda matn, 'overlay' - shahar kartalari uchun matn rasm ustida
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

  const content = (
    <article className={`flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-card shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md ${className}`}>
      {variant === "overlay" ? (
        /* Overlay variant (e.g. City Card) */
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {imageSrc && (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              quality={85}
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {badge && <div className="absolute left-3 top-3 z-10">{badge}</div>}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="text-base font-bold text-white drop-shadow-md sm:text-lg">
              {title}
            </div>
            {subInfo && (
              <div className="mt-1 text-[12px] font-medium text-white/90 sm:text-sm drop-shadow-sm">
                {subInfo}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Default variant (standard card) */
        <>
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-t-3xl bg-slate-100 dark:bg-slate-800">
            {imageSrc && (
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                quality={85}
              />
            )}
            {badge && <div className="absolute left-3 top-3 z-10">{badge}</div>}
          </div>

          <div className="flex flex-col gap-1.5 px-5 pt-4 pb-2">
            <div className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </div>
            {subInfo && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 overflow-hidden line-clamp-1 truncate select-none">
                {subInfo}
              </div>
            )}
            {rating && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                {rating}
              </div>
            )}
          </div>

          {(footerLeft || footerRight) && (
            <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div className="flex flex-col w-full sm:w-auto">{footerLeft}</div>
              {footerRight && <div className="w-full sm:w-auto flex justify-end [&>*]:w-full sm:[&>*]:w-auto">{footerRight}</div>}
            </div>
          )}
        </>
      )}
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-3xl focus-visible:outline-none"
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
      className="group cursor-pointer focus-visible:outline-none"
    >
      {content}
    </div>
  );
}
