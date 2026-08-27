"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

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
    console.error("Web Admin kutilmagan xatolik:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--background)] px-4 text-center">
      <div className="flex flex-col items-center max-w-md bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--danger)]/10 text-[var(--danger)] mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Kechirasiz, tizimda kutilmagan xatolik yuz berdi
        </h1>
        <p className="text-[var(--text-secondary)] mb-6 text-sm">
          Biz bu haqida xabar topdik va tez orada bartaraf etamiz. Iltimos, sahifani yangilang yoki asosiy menyuga qayting.
        </p>
        
        {/* Development only error details */}
        {process.env.NODE_ENV === 'development' && (
          <div className="w-full bg-[var(--bg-tertiary)] p-3 rounded text-left mb-6 overflow-auto max-h-32 text-xs text-[var(--danger)] font-mono">
            {error.message}
          </div>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} icon={<RefreshCcw size={16} />}>
            Qayta urinish
          </Button>
          <Button variant="secondary" onClick={() => router.push("/")} icon={<Home size={16} />}>
            Asosiy sahifa
          </Button>
        </div>
      </div>
    </div>
  );
}
