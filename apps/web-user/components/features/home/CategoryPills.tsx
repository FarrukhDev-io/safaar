"use client";

import Link from "next/link";
import { Star, Hotel, Utensils, Car, Compass, Trees, Landmark } from "lucide-react";
import type { Locale } from "@/i18n/config";

interface CategoryPillsProps {
  locale: Locale;
  activeCategory?: string;
}

export function CategoryPills({ locale, activeCategory = "all" }: CategoryPillsProps) {
  const categories = [
    { id: "all", label: "Barchasi", icon: Star, href: `/${locale}/hotels` },
    { id: "hotels", label: "Mehmonxonalar", icon: Hotel, href: `/${locale}/hotels` },
    { id: "restaurants", label: "Restoranlar", icon: Utensils, href: `/${locale}/restaurants` },
    { id: "transport", label: "Transport", icon: Car, href: `/${locale}/transport` },
    { id: "attractions", label: "Ko'ngilochar joylar", icon: Compass, href: `/${locale}/attractions` },
    { id: "nature", label: "Tabiat", icon: Trees, href: `/${locale}/hotels?q=tabiat` },
    { id: "history", label: "Tarixiy joylar", icon: Landmark, href: `/${locale}/hotels?q=tarixiy` },
  ];

  return (
    <div className="relative mx-auto mt-6 w-full max-w-[1400px] px-4 sm:mt-8">
      <div className="scrollbar-none flex items-center gap-2.5 overflow-x-auto py-2 sm:justify-center">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategory;

          return (
            <Link
              key={cat.id}
              href={cat.href}
              className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-300 active:scale-95 shadow-xs border
                ${
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white border-slate-100/80 text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:-translate-y-0.5 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                }
              `}
            >
              <Icon className={`h-4 w-4 ${isActive ? "fill-white text-white" : "text-slate-400"}`} />
              <span>{cat.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
