"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, TreePine, HeartPulse, Mountain } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export interface CategoryTabsProps {
  locale: Locale;
  dict: {
    hotels?: string;
    dachas?: string;
    guesthouses?: string;
    sanatoriums?: string;
    resorts?: string;
    [key: string]: string | undefined;
  };
}

export function CategoryTabs({ locale, dict }: CategoryTabsProps) {
  const pathname = usePathname();

  const categories = [
    { key: "hotels", href: `/${locale}/hotels`, label: dict.hotels ?? "Mehmonxonalar", icon: Building2 },
    { key: "dachas", href: `/${locale}/dachas`, label: dict.dachas ?? "Dachalar", icon: Home },
    { key: "guesthouses", href: `/${locale}/guesthouses`, label: dict.guesthouses ?? "Mehmon uylari", icon: TreePine },
    { key: "sanatoriums", href: `/${locale}/sanatoriums`, label: dict.sanatoriums ?? "Sanatoriylar", icon: HeartPulse },
    { key: "resorts", href: `/${locale}/resorts`, label: dict.resorts ?? "Oromgohlar", icon: Mountain },
  ];

  return (
    <div className="relative mb-2 w-full">
      <div className="scrollbar-none flex w-full gap-2.5 overflow-x-auto pb-4 snap-x snap-mandatory md:justify-center">
        {categories.map((cat) => {
          const isActive = pathname === cat.href;
          const Icon = cat.icon;

          return (
            <Link
              key={cat.key}
              href={cat.href}
              className={cn(
                "group relative flex shrink-0 cursor-pointer snap-start items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all duration-300",
                isActive
                  ? "bg-slate-900 text-white shadow-lg dark:bg-card dark:text-slate-900"
                  : "bg-card text-slate-500 shadow-xs border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-white dark:text-slate-900" : "text-slate-400 dark:text-slate-500"
                )}
              />
              <span>{cat.label}</span>
              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-card" />
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Fade gradients for scrolling indication */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white/90 to-transparent dark:from-slate-950/90 sm:hidden" />
    </div>
  );
}
