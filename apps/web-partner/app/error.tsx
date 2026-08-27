"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./_components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Web Partner kutilmagan xatolik:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
      <div className="flex flex-col items-center max-w-md bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Kechirasiz, tizimda kutilmagan xatolik yuz berdi
        </h1>
        <p className="text-[var(--text-secondary)] mb-6 text-sm">
          Ilovada vaqtinchalik nosozlik yuzaga keldi. Iltimos, sahifani yangilab, qaytadan urinib ko'ring.
        </p>
        
        {/* Development only error details */}
        {process.env.NODE_ENV === 'development' && (
          <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 rounded text-left mb-6 overflow-auto max-h-32 text-xs text-red-600 dark:text-red-400 font-mono">
            {error.message}
          </div>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCcw size={16} />
            Qayta urinish
          </Button>
          <Button variant="outline" onClick={() => router.push("/")} className="gap-2">
            <Home size={16} />
            Asosiy sahifa
          </Button>
        </div>
      </div>
    </div>
  );
}
