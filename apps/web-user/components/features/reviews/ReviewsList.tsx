'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, ShieldCheck } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { ReviewsDict } from '@/i18n/dictionaries';
import type { ReviewView } from '@/types/view';
import { PhotoLightbox } from './PhotoLightbox';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const LOCALE_TAG: Record<Locale, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
};

function formatReviewDate(createdAt: string, locale: Locale): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export type ExtendedReview = ReviewView & {
  authorName?: string;
  avatarUrl?: string;
  photos?: string[];
  isVerifiedGuest?: boolean;
};

export function ReviewsList({
  reviews: initialReviews,
  dict,
  locale,
  hotelId,
  authed,
  token,
}: {
  reviews: ReviewView[];
  dict: ReviewsDict;
  locale: Locale;
  hotelId?: string;
  authed?: boolean;
  token?: string;
}) {
  const [reviewsList, setReviewsList] = useState<ExtendedReview[]>(initialReviews as ExtendedReview[]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !token) return;
    
    setIsSubmitting(true);
    try {
      let uploadedPhotos: string[] = [];
      if (files.length > 0) {
        uploadedPhotos = await api.reviews.uploadReviewPhotos(files, { token });
      }
      
      const newReview = await api.reviews.createReview({
        targetType: "hotel",
        targetId: hotelId,
        rating,
        body,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
      }, { token });
      
      setReviewsList([newReview as ExtendedReview, ...reviewsList]);
      setIsFormOpen(false);
      setBody("");
      setRating(5);
      setFiles([]);
    } catch (err) {
      console.error(err);
      alert("Sharh qoldirishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lightbox state
  const [activePhotoList, setActivePhotoList] = useState<string[] | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const openLightbox = (photos: string[], index: number) => {
    setActivePhotoList(photos);
    setPhotoIndex(index);
  };

  // Calculate overall average ratings
  const totalCount = reviewsList.length;
  const avgOverall =
    totalCount > 0
      ? (
          reviewsList.reduce(
            (acc, r) => acc + Math.max(0, Number(r.rating) || 0),
            0,
          ) / totalCount
        ).toFixed(1)
      : '0.0';

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header Summary & Rating Breakdown */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-6 dark:border-slate-800">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-primary-50 px-5 py-4 text-center dark:bg-primary-950/40">
            <span className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">
              {avgOverall}
            </span>
            <div className="flex text-amber-400 my-1">
              {'★'.repeat(Math.round(Number(avgOverall)))}
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

        {authed && hotelId && !isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)} variant="primary">
            Sharh qoldirish
          </Button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
          <h3 className="font-bold text-slate-900 dark:text-white">Sharh yozish</h3>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Baho (1-5)</label>
            <select 
              value={rating} 
              onChange={(e) => setRating(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
            >
              {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Yulduz</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sharh matni</label>
            <textarea 
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
              placeholder="O'z tajribangiz haqida yozing..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rasmlar (ixtiyoriy)</label>
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) {
                  setFiles(Array.from(e.target.files));
                }
              }}
              className="text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Bekor qilish
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Yuborilmoqda..." : "Yuborish"}
            </Button>
          </div>
        </form>
      )}

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
                    <Avatar
                      src={review.avatarUrl}
                      alt={review.authorName || 'Mehmon'}
                      fallback={review.authorName?.charAt(0) || 'M'}
                      size="sm"
                    />

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {review.authorName || 'Mehmon'}
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
                          {'★'.repeat(rating)} ({rating}.0)
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
