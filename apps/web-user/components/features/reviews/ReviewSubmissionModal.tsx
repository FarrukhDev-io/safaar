"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import {
  Star,
  UploadCloud,
  X,
  Sparkles,
  CheckCircle2,
  Brush,
  UserCheck,
  MapPin,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ReviewView } from "@/types/view";

export interface ReviewSubmissionModalProps {
  hotelName?: string;
  onAddReview?: (newReview: ReviewView) => void;
  className?: string;
}

export function ReviewSubmissionModal({
  hotelName = "Mehmonxona",
  onAddReview,
  className,
}: ReviewSubmissionModalProps) {
  const [open, setOpen] = useState(false);
  const [cleanliness, setCleanliness] = useState(5);
  const [staff, setStaff] = useState(5);
  const [location, setLocation] = useState(5);
  const [valueForMoney, setValueForMoney] = useState(5);

  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (filesList: FileList | File[]) => {
    const validFiles = Array.from(filesList).filter((f) =>
      f.type.startsWith("image/")
    );
    if (validFiles.length === 0) return;

    const newPhotos = [...photos, ...validFiles].slice(0, 5);
    setPhotos(newPhotos);

    const newPreviews = newPhotos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(newPreviews);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    const updatedPreviews = updatedPhotos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(updatedPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 10) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const overallRating = Number(
        ((cleanliness + staff + location + valueForMoney) / 4).toFixed(1)
      );

      const createdReview: ReviewView & {
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
      } = {
        id: `rev-${Date.now()}`,
        rating: overallRating,
        body: text.trim(),
        createdAt: new Date().toISOString(),
        authorName: "Siz (Foydalanuvchi)",
        avatarUrl: "/Tashkent-city-skyline.jpeg",
        photos: photoPreviews,
        isVerifiedGuest: true,
        breakdown: {
          cleanliness,
          staff,
          location,
          valueForMoney,
        },
      };

      if (onAddReview) {
        onAddReview(createdReview);
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    }, 800);
  };

  const handleClose = () => {
    setOpen(false);
    setIsSuccess(false);
    setText("");
    setPhotos([]);
    setPhotoPreviews([]);
  };

  return (
    <div className={className}>
      <Button
        variant="primary"
        onClick={() => setOpen(true)}
        className="gap-2 font-bold shadow-md"
      >
        <Sparkles className="h-4 w-4" />
        Sharh va Baho qoldirish
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleClose}
          />

          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Sharh va Baho qoldirish
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {hotelName} ob'ektida o'tkazgan vaqtingiz bo'yicha baho bering
                  </p>
                </div>

                {/* 4 Rating Criteria */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  {/* Cleanliness */}
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Brush className="h-3.5 w-3.5 text-blue-500" />
                      Tozalik: {cleanliness}★
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCleanliness(star)}
                          className="p-0.5 focus:outline-none"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= cleanliness
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Staff */}
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                      Xodimlar: {staff}★
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setStaff(star)}
                          className="p-0.5 focus:outline-none"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= staff
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-red-500" />
                      Joylashuv: {location}★
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setLocation(star)}
                          className="p-0.5 focus:outline-none"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= location
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Value for Money */}
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Coins className="h-3.5 w-3.5 text-amber-500" />
                      Narx-sifat: {valueForMoney}★
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setValueForMoney(star)}
                          className="p-0.5 focus:outline-none"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= valueForMoney
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Fikringiz (Kamida 10 ta belgi)
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Mehmonxonadagi tajribangiz, xizmat ko'rsatish sifati va qulayliklar haqida samimiy fikringizni yozing..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                {/* Drag & Drop Photo Upload */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Rasmlar yuklash (Max 5 ta)
                  </span>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/30"
                    }`}
                  >
                    <UploadCloud className="h-6 w-6 text-slate-400" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Rasmlarni sudrab tashlang yoki <span className="font-bold text-blue-600">tanlang</span>
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Photo Previews */}
                  {photoPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {photoPreviews.map((src, idx) => (
                        <div
                          key={idx}
                          className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800"
                        >
                          <Image
                            src={src}
                            alt={`Preview ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(idx);
                            }}
                            className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  disabled={text.trim().length < 10}
                  className="mt-2 font-bold"
                >
                  Sharhni yuborish
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  Sharhingiz qabul qilindi!
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Fikringiz va yuklagan rasmlaringiz boshqa turistlarga eng ma'qul tanlovni amalga oshirishda yordam beradi.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  className="mt-6 w-full rounded-xl"
                >
                  Yopish
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
