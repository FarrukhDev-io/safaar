import { Building2, MapPin, Star, Headphones } from "lucide-react";
import type { HomeDict } from "@/i18n/dictionaries";
import type { PublicStatsView } from "@safaar/api-client";

export function TrustBar({
  dict,
  stats,
}: {
  dict: HomeDict["trust"];
  stats?: PublicStatsView | null;
}) {
  const statsItems = stats
    ? [
        {
          icon: <Building2 className="h-5 w-5" aria-hidden />,
          value: stats.totalHotels.toLocaleString("uz-UZ"),
          label: dict.hotelsLabel,
        },
        {
          icon: <MapPin className="h-5 w-5" aria-hidden />,
          value: stats.totalCities.toLocaleString("uz-UZ"),
          label: dict.citiesLabel,
        },
        {
          icon: <Star className="h-5 w-5" aria-hidden />,
          value: Number(stats.averageRating).toFixed(1),
          label: dict.ratingLabel,
        },
        {
          icon: <Headphones className="h-5 w-5" aria-hidden />,
          value: dict.support,
          label: dict.supportLabel,
        },
      ]
    : [
        {
          icon: <Building2 className="h-5 w-5" aria-hidden />,
          value: dict.hotels,
          label: dict.hotelsLabel,
        },
        {
          icon: <MapPin className="h-5 w-5" aria-hidden />,
          value: dict.cities,
          label: dict.citiesLabel,
        },
        {
          icon: <Star className="h-5 w-5" aria-hidden />,
          value: dict.rating,
          label: dict.ratingLabel,
        },
        {
          icon: <Headphones className="h-5 w-5" aria-hidden />,
          value: dict.support,
          label: dict.supportLabel,
        },
      ];

  return (
    <section className="border-t border-slate-200/80 bg-transparent px-4 py-10 sm:px-6 sm:py-14 dark:border-slate-800/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 sm:flex-row sm:justify-between">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-6">
          {statsItems.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/80 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                {stat.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {stat.value}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Partner Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {["Payme ⚡", "Click 🔵", "Uzcard 💳", "Humo 💳"].map((name) => (
            <span
              key={name}
              className="rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-extrabold text-slate-800 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
