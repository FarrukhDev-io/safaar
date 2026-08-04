"use client";

/**
 * Global error boundary — root layout ham yiqilgan holatlar uchun.
 * O'zining `<html>`/`<body>` ini render qiladi. Til aniqlab bo'lmasligi
 * mumkin, shuning uchun matn O'zbekcha (defaultLocale) statik beriladi.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="uz">
      <body
        style={{ margin: 0 }}
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-card px-6 py-20 text-center text-slate-900"
      >
        <h1 className="text-2xl font-bold tracking-tight text-primary-600 sm:text-3xl">
          Tizimda jiddiy xatolik
        </h1>
        <p className="max-w-md text-slate-600">
          Kechirasiz, kutilmagan xatolik yuz berdi. Iltimos, sahifani qayta
          yuklang.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-12 items-center justify-center rounded-full bg-primary-600 px-6 text-base font-medium text-white transition-colors hover:bg-primary-700"
        >
          Qayta yuklash
        </button>
      </body>
    </html>
  );
}
