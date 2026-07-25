"use client";

import { useState, useRef, useEffect } from "react";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { CURRENCY_INFO, CurrencyCode } from "@/lib/utils/money";
import { cn } from "@/lib/cn";

export function CurrencySwitcher({ light = false }: { light?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const activeInfo = CURRENCY_INFO[currency] || CURRENCY_INFO.UZS;

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Valyutani tanlash"
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          light
            ? "border border-slate-200 bg-white text-slate-900 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            : "border border-white/40 bg-white/10 text-white shadow-xs backdrop-blur-md hover:bg-white/20 hover:border-white/60"
        )}
      >
        <span className="text-sm">{activeInfo.flag}</span>
        <span className={cn("text-xs font-extrabold uppercase tracking-wide", light ? "text-slate-900 dark:text-white" : "text-white")}>
          {activeInfo.code}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Valyutalar"
          className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 dark:border-slate-800 dark:bg-slate-900"
        >
          {(Object.keys(CURRENCY_INFO) as CurrencyCode[]).map((code) => {
            const item = CURRENCY_INFO[code];
            const active = code === currency;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setCurrency(code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.flag}</span>
                  <span>{item.code}</span>
                </div>
                <span className={cn("text-[11px] font-semibold opacity-80", active ? "text-white" : "text-slate-500 dark:text-slate-400")}>
                  {item.symbol}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
