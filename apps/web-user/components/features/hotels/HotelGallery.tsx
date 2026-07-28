'use client';

import Image from 'next/image';
import { cn } from '@/lib/cn';
import { Camera, Image as ImageIcon } from 'lucide-react';

export function HotelGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const real = images.filter(
    (src) => src.startsWith('http') || src.startsWith('/'),
  );
  const shots = real;

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
            quality={85}
          />
        </div>

        {/* 4 Smaller Grid Side Photos */}
        {sidePhotos.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className={cn(
              'relative hidden overflow-hidden bg-slate-100 sm:block dark:bg-slate-800',
              i === 0 && 'sm:col-span-1 sm:row-span-1',
              i === 1 && 'sm:col-span-1 sm:row-span-1',
              i === 2 && 'sm:col-span-1 sm:row-span-1',
              i === 3 && 'sm:col-span-1 sm:row-span-1',
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

      {shots.length > 1 && (
        <div className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">
          <Camera className="h-4 w-4 text-amber-300" />
          <span>{shots.length} ta rasm</span>
        </div>
      )}
    </div>
  );
}
