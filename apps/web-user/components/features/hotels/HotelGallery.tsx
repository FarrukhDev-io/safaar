"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { SHOW_PLACEHOLDER_PHOTOS, placeholderPhoto } from "@/lib/images";
import { Camera, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function HotelGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const real = images.filter((src) => src.startsWith("http") || src.startsWith("/"));
  const shots =
    real.length > 0
      ? real
      : SHOW_PLACEHOLDER_PHOTOS
        ? Array.from({ length: 5 }, (_, i) =>
            placeholderPhoto(`${alt}-${i}`, 1280, 720),
          )
        : [];

  if (shots.length === 0) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex aspect-21/9 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-slate-100 text-2xl font-semibold text-primary-900/60 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300"
      >
        <ImageIcon className="h-12 w-12 text-slate-400" />
      </div>
    );
  }

  const mainPhoto = shots[0];
  const sidePhotos = shots.slice(1, 5);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-4 sm:grid-rows-2 sm:h-[400px]">
          {/* Large Main Featured Photo */}
          <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 sm:col-span-2 sm:row-span-2 sm:aspect-auto dark:bg-slate-800">
            <Image
              src={mainPhoto}
              alt={`${alt} — Asosiy ko'rinish`}
              priority
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
              quality={90}
            />
          </div>

          {/* 4 Smaller Grid Side Photos */}
          {sidePhotos.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={cn(
                "relative hidden overflow-hidden bg-slate-100 sm:block dark:bg-slate-800",
                i === 0 && "sm:col-span-1 sm:row-span-1",
                i === 1 && "sm:col-span-1 sm:row-span-1",
                i === 2 && "sm:col-span-1 sm:row-span-1",
                i === 3 && "sm:col-span-1 sm:row-span-1",
              )}
            >
              <Image
                src={src}
                alt={`${alt} — ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* "See all photos" Overlay Button */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setActiveIndex(0);
            setIsLightboxOpen(true);
          }}
          className="absolute bottom-3 right-3 z-10 gap-1.5 rounded-xl border border-white/20 bg-slate-950/75 px-3 py-1.5 text-xs font-extrabold text-white shadow-md backdrop-blur-md hover:bg-slate-950/90 active:scale-95"
        >
          <Camera className="h-4 w-4 text-amber-300" />
          <span>Barcha {shots.length}+ rasmlar</span>
        </Button>
      </div>

      {/* Lightbox Slideshow Modal */}
      <Modal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        size="lg"
        title={alt}
      >
        <div className="flex flex-col gap-4">
          {/* Main Large Image Container */}
          <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Image
              src={shots[activeIndex]}
              alt={`${alt} — Slayder ${activeIndex + 1}`}
              fill
              className="object-cover transition-all duration-300"
              quality={95}
            />

            {/* Prev Arrow */}
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : shots.length - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-xs transition-all hover:bg-slate-900 active:scale-90"
              aria-label="Oldingi rasm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Next Arrow */}
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev < shots.length - 1 ? prev + 1 : 0))}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-xs transition-all hover:bg-slate-900 active:scale-90"
              aria-label="Keyingi rasm"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Thumbnails Row */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {shots.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                  idx === activeIndex
                    ? "border-blue-600 ring-2 ring-blue-500/20"
                    : "border-slate-200/60 dark:border-slate-800 hover:border-slate-350"
                )}
              >
                <Image
                  src={src}
                  alt={`${alt} kichik rasm ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
