"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./_components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Web Partner kutilmagan xatolik (Global):", error);
  }, [error]);

  return (
    <html lang="uz" className="light">
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F9FAFB] px-4 text-center font-sans">
          <div className="flex flex-col items-center max-w-md bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Kechirasiz, tizimda kutilmagan xatolik yuz berdi
            </h1>
            <p className="text-gray-500 mb-6 text-sm">
              Ilovada vaqtinchalik nosozlik yuzaga keldi. Biz bu haqida xabar topdik va tez orada bartaraf etamiz.
            </p>
            
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => reset()} className="gap-2">
                <RefreshCcw size={16} />
                Qayta urinish
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/"} className="gap-2">
                Asosiy sahifaga qaytish
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
