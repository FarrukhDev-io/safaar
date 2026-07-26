"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { HotelsDict } from "@/i18n/dictionaries";
import { formatSum } from "@/lib/money";
import { ActiveFilters as SharedActiveFilters, type ActiveFilterChip } from "@/components/ui/ActiveFilters";

const AMENITIES_MAP: Record<string, string> = {
  pool: "Basseyn",
  tapchan: "Tapchan",
  sauna: "Sauna",
  wifi: "Wi-Fi",
  breakfast: "Nonushta",
  billiards: "Bilyard",
};

const PAYMENT_MAP: Record<string, string> = {
  pay_at_property: "Joyida to'lash",
  online_payment: "Online to'lash",
};

export function ActiveFilters({ dict }: { dict: HotelsDict }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function remove(keys: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    keys.forEach((k) => params.delete(k));
    params.delete("page");
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  const stars = searchParams.get("stars");
  const min = searchParams.get("min_price");
  const max = searchParams.get("max_price");
  const sort = searchParams.get("sort");
  const amenities = searchParams.get("amenities")?.split(",").filter(Boolean) ?? [];
  const payments = searchParams.get("payment")?.split(",").filter(Boolean) ?? [];

  const sortLabels: Record<string, string> = {
    price_asc: dict.sort.priceAsc,
    price_desc: dict.sort.priceDesc,
    rating: dict.sort.rating,
  };

  const chips: ActiveFilterChip[] = [];

  if (stars) {
    chips.push({
      key: "stars",
      label: dict.filters.starsValue.replace("{n}", stars),
      onRemove: () => remove(["stars"]),
    });
  }

  if (min && Number.isFinite(Number(min))) {
    chips.push({
      key: "min_price",
      label: `${dict.filters.priceMin}: ${formatSum(Number(min))}`,
      onRemove: () => remove(["min_price"]),
    });
  }

  if (max && Number.isFinite(Number(max))) {
    chips.push({
      key: "max_price",
      label: `${dict.filters.priceMax}: ${formatSum(Number(max))}`,
      onRemove: () => remove(["max_price"]),
    });
  }

  if (sort && sortLabels[sort]) {
    chips.push({
      key: "sort",
      label: sortLabels[sort],
      onRemove: () => remove(["sort"]),
    });
  }

  amenities.forEach((amenity) => {
    chips.push({
      key: `amenity-${amenity}`,
      label: AMENITIES_MAP[amenity] ?? amenity,
      onRemove: () => {
        const remaining = amenities.filter((a) => a !== amenity);
        const params = new URLSearchParams(searchParams.toString());
        if (remaining.length) {
          params.set("amenities", remaining.join(","));
        } else {
          params.delete("amenities");
        }
        params.delete("page");
        const query = params.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
      },
    });
  });

  payments.forEach((payment) => {
    chips.push({
      key: `payment-${payment}`,
      label: PAYMENT_MAP[payment] ?? payment,
      onRemove: () => {
        const remaining = payments.filter((p) => p !== payment);
        const params = new URLSearchParams(searchParams.toString());
        if (remaining.length) {
          params.set("payment", remaining.join(","));
        } else {
          params.delete("payment");
        }
        params.delete("page");
        const query = params.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
      },
    });
  });

  const handleClearAll = () => {
    remove(["stars", "min_price", "max_price", "sort", "amenities", "payment"]);
  };

  return (
    <SharedActiveFilters
      chips={chips}
      onClearAll={handleClearAll}
      clearAllLabel={dict.clearFilters}
    />
  );
}
