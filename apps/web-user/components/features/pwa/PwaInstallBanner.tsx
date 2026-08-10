"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-xs">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
              Safaar ilovasini o'rnatish
            </span>
            <span className="line-clamp-2 text-xs text-slate-500 sm:line-clamp-1 dark:text-slate-400">
              Tezkor kirish, offlayn rejim va bron xabarnomalari uchun
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
            size="sm"
            variant="accent"
            onClick={handleInstall}
            className="shrink-0 gap-1.5 font-bold shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            O'rnatish
          </Button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
