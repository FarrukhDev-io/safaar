import { Building2, MapPin, Star, Headphones } from "lucide-react";
import type { HomeDict } from "@/i18n/dictionaries";
import type { PublicStatsView } from "@safaar/api-client";

export function TrustBar({
  dict,
  stats,
}: {
  dict: HomeDict["trust"] & { paymentMethodsLabel?: string };
  stats?: PublicStatsView | null;
}) {
  const statsItems = stats
    ? [
        {
          icon: <Building2 className="h-4 w-4" aria-hidden />,
          value: stats.totalHotels.toLocaleString("uz-UZ"),
          label: dict.hotelsLabel,
        },
        {
          icon: <MapPin className="h-4 w-4" aria-hidden />,
          value: stats.totalCities.toLocaleString("uz-UZ"),
          label: dict.citiesLabel,
        },
        {
          icon: <Star className="h-4 w-4" aria-hidden />,
          value: Number(stats.averageRating).toFixed(1),
          label: dict.ratingLabel,
        },
        {
          icon: <Headphones className="h-4 w-4" aria-hidden />,
          value: dict.support,
          label: dict.supportLabel,
        },
      ]
    : [
        {
          icon: <Building2 className="h-4 w-4" aria-hidden />,
          value: dict.hotels,
          label: dict.hotelsLabel,
        },
        {
          icon: <MapPin className="h-4 w-4" aria-hidden />,
          value: dict.cities,
          label: dict.citiesLabel,
        },
        {
          icon: <Star className="h-4 w-4" aria-hidden />,
          value: dict.rating,
          label: dict.ratingLabel,
        },
        {
          icon: <Headphones className="h-4 w-4" aria-hidden />,
          value: dict.support,
          label: dict.supportLabel,
        },
      ];

  return (
    <section className="border-t border-slate-100 bg-transparent px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-10">
        {/* Statistics Metric Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
          {statsItems.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-start bg-transparent border-none shadow-none"
            >
              <span className="text-slate-400 mb-1 flex items-center justify-center">
                {stat.icon}
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                {stat.value}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Payment Partner Badges Bar */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6 w-full">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-2">
            {dict.paymentMethodsLabel || "To'lov turlari:"}
          </span>
          {["Payme", "Click", "Uzcard", "Humo"].map((name) => (
            <span
              key={name}
              className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2 text-xs font-extrabold text-slate-800 transition-all hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
