"use client";

import { Building2, Home, TreePine, HeartPulse, Mountain } from "lucide-react";
import { CategoryTabs, type CategoryTab } from "@/components/ui/CategoryTabs";

export function AccommodationCategoryTabs({
  locale,
  dict,
}: {
  locale: string;
  dict: Record<string, string>;
}) {
  const tabs: CategoryTab[] = [
    { key: "hotels", href: `/${locale}/hotels`, label: dict.hotels ?? "Mehmonxonalar", icon: Building2 },
    { key: "dachas", href: `/${locale}/dachas`, label: dict.dachas ?? "Dachalar", icon: Home },
    { key: "sanatoriums", href: `/${locale}/sanatoriums`, label: dict.sanatoriums ?? "Sanatoriylar", icon: HeartPulse },
    { key: "resorts", href: `/${locale}/resorts`, label: dict.resorts ?? "Oromgohlar", icon: Mountain },
  ];

  return <CategoryTabs tabs={tabs} />;
}
