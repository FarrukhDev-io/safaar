"use client";

import { useState, useSyncExternalStore, useEffect } from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { type PromoBarConfig, getLocalizedText } from "@/lib/promo";

interface PromoBarProps {
  config?: PromoBarConfig | null;
  locale?: string;
}

const emptySubscribe = () => () => {};

export function PromoBar({ config, locale = "uz" }: PromoBarProps) {
  const [now, setNow] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(timer);
  }, []);

  const [isDismissed, setIsDismissed] = useState(false);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const handleDismiss = () => {
    if (!config?.id) return;
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`safaar_promo_dismissed_${config.id}`, "1");
    }
  };

  const isActive = Boolean(config?.isActive);
  const isExpired = Boolean(
    config?.endsAt && now > 0 && new Date(config.endsAt).getTime() < now
  );

  const text = getLocalizedText(config?.text, locale);
  const badgeText = config ? getLocalizedText(config.badge, locale) : "";
  const linkText = config ? getLocalizedText(config.linkText, locale) : "";

  if (!isActive || isExpired || (isMounted && isDismissed) || !text) {
    return null;
  }

  const isDismissible = config?.isDismissible ?? true;

  return (
    <div
      role="region"
      className="relative flex min-h-[36px] items-center justify-center bg-primary-600 px-8 py-1.5 text-center text-xs font-semibold text-white shadow-md transition-all duration-300 sm:text-sm"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {badgeText ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-400 shadow-xs backdrop-blur-md sm:text-xs">
            <Sparkles className="h-3 w-3 text-amber-400" aria-hidden />
            {badgeText}
          </span>
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse hidden sm:inline" aria-hidden />
        )}

        <span className="line-clamp-1 drop-shadow-xs">{text}</span>

        {config?.link && (
          <Link
            href={config.link}
            className="ml-1 inline-flex items-center gap-0.5 rounded-sm font-bold text-amber-400 underline underline-offset-2 hover:text-amber-300 focus:outline-hidden focus:ring-1 focus:ring-amber-400"
          >
            <span>{linkText || "Batafsil"}</span>
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        )}
      </div>

      {isDismissible && isMounted && (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-hidden focus:ring-1 focus:ring-white"
          aria-label="E'lonni yopish"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
