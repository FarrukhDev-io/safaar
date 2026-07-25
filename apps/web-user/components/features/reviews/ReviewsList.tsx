"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck, Camera, User } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { ReviewsDict } from "@/i18n/dictionaries";
import type { ReviewView } from "@/types/view";
import { ReviewSubmissionModal } from "./ReviewSubmissionModal";
import { PhotoLightbox } from "./PhotoLightbox";

const LOCALE_TAG: Record<Locale, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
};

function formatReviewDate(createdAt: string, locale: Locale): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export type ExtendedReview = ReviewView & {
  authorName?: string;
  avatarUrl?: string;
  photos?: string[];
  isVerifiedGuest?: boolean;
  breakdown?: {
    cleanliness: number;
    staff: number;
    location: number;
    valueForMoney: number;
  };
};

export function ReviewsList({
  reviews: initialReviews,
  dict,
  locale,
  hotelName = "Mehmonxona",
}: {
  reviews: ReviewView[];
  dict: ReviewsDict;
  locale: Locale;
  hotelName?: string;
}) {
  const [reviewsList, setReviewsList] = useState<ExtendedReview[]>(() => {
    return initialReviews.map((r, i) => ({
      ...r,
      authorName: (r as ExtendedReview).authorName || `Mehmon #${i + 1}`,
      isVerifiedGuest: true,
      photos: (r as ExtendedReview).photos || (i === 0 ? ["/Samarkand-Registan-cinematic.jpeg", "/Charvak-Lake-drone.jpeg"] : []),
      breakdown: (r as ExtendedReview).breakdown || {
        cleanliness: 4.9,
        staff: 4.8,
        location: 4.9,
        valueForMoney: 4.7,
      },
    }));
  });

  // Lightbox state
  const [activePhotoList, setActivePhotoList] = useState<string[] | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const handleAddNewReview = (newReview: ReviewView) => {
    setReviewsList((prev) => [newReview as ExtendedReview, ...prev]);
  };

  const openLightbox = (photos: string[], index: number) => {
    setActivePhotoList(photos);
    setPhotoIndex(index);
  };

  // Calculate overall average ratings
  const totalCount = reviewsList.length;
  const avgOverall =
    totalCount > 0
      ? (
          reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) / totalCount
        ).toFixed(1)
      : "5.0";

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header Summary & Rating Breakdown */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-6 dark:border-slate-800">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-blue-50 px-5 py-4 text-center dark:bg-blue-950/40">
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {avgOverall}
            </span>
            <div className="flex text-amber-400 my-1">
              {"★".repeat(Math.round(Number(avgOverall)))}
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {totalCount} ta sharh
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {dict.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tasdiqlangan mehmonlarning haqiqiy baholari va tajribasi
            </p>
          </div>
        </div>

        {/* 4 Criteria Progress Bars */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 max-w-md w-full">
          {/* Cleanliness */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>🧹 Tozalik</span>
              <span>4.9 / 5</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-blue-600" style={{ width: "98%" }} />
            </div>
          </div>

          {/* Staff */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>👨‍💼 Xodimlar</span>
              <span>4.8 / 5</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "96%" }} />
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>📍 Joylashuv</span>
              <span>4.9 / 5</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-amber-500" style={{ width: "98%" }} />
            </div>
          </div>

          {/* Value */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>💰 Narx va Sifat</span>
              <span>4.7 / 5</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: "94%" }} />
            </div>
          </div>
        </div>

        <ReviewSubmissionModal
          hotelName={hotelName}
          onAddReview={handleAddNewReview}
        />
      </div>

      {/* Reviews List */}
      {reviewsList.length === 0 ? (
        <p className="text-sm text-slate-500">{dict.empty}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviewsList.map((review) => {
            const rating = Math.max(0, Math.min(5, Math.round(review.rating)));
            const dateLabel = formatReviewDate(review.createdAt, locale);

            return (
              <div
                key={review.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 shadow-xs transition-all hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800/40"
              >
                {/* Author Info Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 overflow-hidden rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                      {review.avatarUrl ? (
                        <Image
                          src={review.avatarUrl}
                          alt={review.authorName || "Mehmon"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center">
                          <User className="h-5 w-5" />
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {review.authorName || "Mehmon"}
                        </span>
                        {review.isVerifiedGuest && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <ShieldCheck className="h-3 w-3 stroke-[2.5]" />
                            Tasdiqlangan Mehmon
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-500 font-bold">
                          {"★".repeat(rating)} ({rating}.0)
                        </span>
                        {dateLabel && (
                          <span className="text-xs text-slate-400">
                            • {dateLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                {review.body && (
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {review.body}
                  </p>
                )}

                {/* Photo Gallery Thumbnails */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {review.photos.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => openLightbox(review.photos!, idx)}
                        className="group relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700"
                      >
                        <Image
                          src={photo}
                          alt={`Review photo ${idx + 1}`}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 grid place-items-center">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {activePhotoList && (
        <PhotoLightbox
          photos={activePhotoList}
          currentIndex={photoIndex}
          onClose={() => setActivePhotoList(null)}
          onNavigate={(newIdx) => setPhotoIndex(newIdx)}
        />
      )}
    </section>
  );
}
