"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { HotelsDict } from "@/i18n/dictionaries";
import { Select } from "@/components/ui/Select";

export function HotelSortSelect({ dict }: { dict: HotelsDict["sort"] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <span className="hidden sm:inline whitespace-nowrap text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        {dict.label}:
      </span>
      <div className="w-full sm:w-52 md:w-56">
        <Select
          value={current}
          onChange={onChange}
          ariaLabel={dict.label}
          options={[
            { value: "", label: dict.default },
            { value: "price_asc", label: dict.priceAsc },
            { value: "price_desc", label: dict.priceDesc },
            { value: "rating", label: dict.rating },
          ]}
        />
      </div>
    </div>
  );
}
