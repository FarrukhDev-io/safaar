"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { IridescentButton } from "@/components/ui/IridescentButton";

export function LocaleSwitcher({
  current,
  light = false,
}: {
  current: Locale;
  light?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === current) {
      setOpen(false);
      return;
    }
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && (locales as readonly string[]).includes(segments[0])) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }
    const nextPath = `/${segments.join("/")}`;
    setOpen(false);
    router.push(nextPath);
  }

  return (
    <div ref={ref} className="relative inline-block text-left">
      <IridescentButton
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Tilni tanlash"
        className={cn(
          "h-10 px-4 rounded-full text-[14px]",
          !light && "text-white/90"
        )}
      >
        <Globe className="h-[18px] w-[18px] opacity-80" aria-hidden />
        <span className="font-bold uppercase tracking-wide">
          {current}
        </span>
      </IridescentButton>

      {open && (
        <div
          role="listbox"
          aria-label="Tillar"
          className="absolute right-0 top-full mt-2 w-40 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_4px_0_rgb(226,232,240),0_10px_25px_rgba(0,0,0,0.1)] z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {locales.map((loc) => {
            const active = loc === current;
            return (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => switchLocale(loc)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-400"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                )}
              >
                <span>{localeNames[loc]}</span>
                <span className={cn("uppercase text-[11px] font-bold tracking-wider", active ? "opacity-100" : "opacity-60")}>
                  {loc}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

