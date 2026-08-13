"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, CalendarRange, PhoneCall, ShieldCheck, Users, Search } from "lucide-react";
import { formatSum } from "@/lib/money";
import type { Locale } from "@/i18n/config";
import type { CatalogDict } from "@/i18n/dictionaries";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import type { TransportItem } from "@/components/catalog/types";
import { BaseCard } from "@/components/ui/BaseCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { CategoryTabs, type CategoryTab } from "@/components/ui/CategoryTabs";
import { Input } from "@/components/ui/Input";

export type { TransportItem };

function TransportCard({
  item,
  dict,
  locale,
  checkIn,
  checkOut,
}: {
  item: TransportItem;
  dict: CatalogDict["transport"];
  locale: Locale;
  checkIn: string;
  checkOut: string;
}) {
  const categoryLabel = dict.categories?.[item.categoryKey] ?? item.categoryDefault;

  const badge = (
    <span className="rounded-full bg-slate-900/55 px-2.5 py-1 text-xs font-medium text-white">
      {categoryLabel}
    </span>
  );

  const subInfo = (
    <>
      <Users className="h-3.5 w-3.5 shrink-0" />
      {item.seats} {dict.seats}
      <span className="text-slate-300 dark:text-slate-700">·</span>
      {item.hasDriver ? dict.driverIncluded : dict.withoutDriver}
    </>
  );

  const ratingElement = (
    <span>
      {[item.transmission, item.fuelType, item.cityName].filter(Boolean).join(" · ")}
    </span>
  );

  const bookHref =
    checkIn && checkOut
      ? `/${locale}/booking?vehicleId=${encodeURIComponent(item.id)}&checkIn=${checkIn}&checkOut=${checkOut}`
      : undefined;

  return (
    <BaseCard
      imageSrc={item.imageUrl}
      imageAlt={item.name}
      badge={badge}
      title={item.name}
      subInfo={subInfo}
      rating={ratingElement}
      footerLeft={
        item.pricePerDaySum > 0 ? (
          <>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatSum(item.pricePerDaySum)}
            </span>
            <span className="text-[10px] text-slate-400">/ {dict.perDay}</span>
          </>
        ) : undefined
      }
      footerRight={
        <div className="flex items-center gap-1.5">
          {bookHref ? (
            <a
              href={bookHref}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              {dict.bookNow ?? "Bron qilish"}
            </a>
          ) : (
            <button
              type="button"
              onClick={() =>
                toast.error(
                  dict.selectDatesFirst ?? "Avval olib ketish va qaytarish sanalarini tanlang",
                )
              }
              className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {dict.bookNow ?? "Bron qilish"}
            </button>
          )}
          {item.phone ? (
            <a
              href={`tel:${item.phone.replace(/\s+/g, "")}`}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <PhoneCall className="h-3.5 w-3.5" />
            </a>
          ) : undefined}
        </div>
      }
    />
  );
}

export function TransportView({
  dict,
  items,
  locale,
  defaultCheckIn,
  defaultCheckOut,
}: {
  dict: CatalogDict["transport"];
  items: TransportItem[];
  locale: Locale;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [hasDriverFilter, setHasDriverFilter] = useState<string>("all");
  const [checkIn, setCheckIn] = useState(defaultCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(defaultCheckOut ?? "");

  const categories = useMemo(
    () => [
      { id: "all", label: dict.categories?.all ?? dict.allTypes },
      { id: "rent", label: dict.categories?.rent ?? "Avto Ijarasi" },
      { id: "transfer", label: dict.categories?.transfer ?? "Aeroport Transfer" },
      { id: "vip", label: dict.categories?.vip ?? "VIP Taksi" },
    ],
    [dict],
  );
  const cities = useMemo(
    () => Array.from(new Set(items.map((item) => item.cityName).filter(Boolean))),
    [items],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.cityName.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        selectedCategory === "all" || item.categoryKey === selectedCategory;
      const matchesCity = selectedCity === "all" || item.cityName === selectedCity;
      const matchesDriver =
        hasDriverFilter === "all" ||
        (hasDriverFilter === "yes" && item.hasDriver) ||
        (hasDriverFilter === "no" && !item.hasDriver);
      return matchesQuery && matchesCategory && matchesCity && matchesDriver;
    });
  }, [items, query, selectedCategory, selectedCity, hasDriverFilter]);

  const transportTabs: CategoryTab[] = useMemo(() => {
    return categories.map((cat) => ({
      key: cat.id,
      label: cat.label,
      isActive: selectedCategory === cat.id,
      onClick: () => setSelectedCategory(cat.id),
    }));
  }, [categories, selectedCategory]);

  const handleDateSearch = () => {
    if (!checkIn || !checkOut) {
      toast.error(
        dict.selectDatesFirst ?? "Avval olib ketish va qaytarish sanalarini tanlang",
      );
      return;
    }
    if (checkOut <= checkIn) {
      toast.error(
        dict.invalidDateRange ?? "Qaytarish sanasi olib ketish sanasidan keyin bo'lishi kerak",
      );
      return;
    }
    const params = new URLSearchParams({ check_in: checkIn, check_out: checkOut });
    router.push(`/${locale}/transport?${params.toString()}`);
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <CatalogHeader
        icon={<Car className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
        badge={dict.badge}
        title={dict.title}
        subtitle={dict.subtitle}
        searchControls={
          <>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="pl-10"
            />
          </>
        }
        filterControls={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedCity}
              onChange={setSelectedCity}
              options={[
                { value: "all", label: "Barcha shaharlar" },
                ...cities.map((city) => ({ value: city, label: city }))
              ]}
              className="w-44"
            />
            <Select
              value={hasDriverFilter}
              onChange={setHasDriverFilter}
              options={[
                { value: "all", label: "Hammasi" },
                { value: "yes", label: dict.driverIncluded },
                { value: "no", label: dict.withoutDriver }
              ]}
              className="w-44"
            />
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              aria-label={dict.pickupDate ?? "Olib ketish sanasi"}
              className="w-40"
            />
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              aria-label={dict.returnDate ?? "Qaytarish sanasi"}
              className="w-40"
            />
            <Button onClick={handleDateSearch} className="min-h-[44px]">
              <CalendarRange className="h-4 w-4" />
              {dict.checkAvailability ?? "Mavjudlikni tekshirish"}
            </Button>
          </div>
        }
      />

      <div className="mt-2 mb-6">
        <CategoryTabs tabs={transportTabs} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Ma'lumot topilmadi"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {filtered.map((item) => (
            <TransportCard
              key={item.id}
              item={item}
              dict={dict}
              locale={locale}
              checkIn={checkIn}
              checkOut={checkOut}
            />
          ))}
        </div>
      )}
    </main>
  );
}
