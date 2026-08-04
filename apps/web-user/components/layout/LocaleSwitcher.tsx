"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Tilni tanlash"
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          light
            ? "border border-slate-200 bg-card text-slate-900 shadow-btn hover:bg-slate-50"
            : "border border-white/40 bg-white/10 text-white shadow-xs backdrop-blur-md hover:bg-white/20 hover:border-white/60",
        )}
      >
        <Globe className={cn("h-3.5 w-3.5", light ? "text-slate-600" : "text-white/90")} aria-hidden />
        <span className={cn("text-xs font-bold uppercase tracking-wide", light ? "text-slate-900" : "text-white")}>
          {current.toUpperCase()}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Tillar"
          className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-slate-200 bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
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
                  "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                  active
                    ? "bg-primary-600 text-white shadow-xs"
                    : "text-slate-900 hover:bg-slate-100",
                )}
              >
                <span>{localeNames[loc]}</span>
                <span className="uppercase text-[10px] opacity-75">{loc}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

