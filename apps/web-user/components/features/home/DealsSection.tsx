import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Waves, Coffee, Wifi, Car } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { HomeDict } from "@/i18n/dictionaries";
import { formatSum } from "@/lib/utils/money";
import { resolveImage } from "@/lib/images";
import { ShinyText } from "@/components/ui/ShinyText";
import { DealsMobileCarousel } from "./DealsMobileCarousel";

export interface DealItem {
  id: string;
  slug: string;
  name: string;
  cityName: string;
  imageUrl: string;
  oldPriceSum: number;
  newPriceSum: number;
  discountPercent: number;
  endsAt: string;
}

function DealCard({
  deal,
  locale,
  dict,
  now,
}: {
  deal: DealItem;
  locale: Locale;
  dict: HomeDict["deals"];
  now: number;
}) {
  const imageUrl = resolveImage(deal.imageUrl);
  const cityNameLower = deal.cityName.toLowerCase();
  
  const locationSuffix = 
    cityNameLower === "toshkent" || cityNameLower === "buxoro" || cityNameLower === "samarqand"
      ? ", O'zbekiston" 
      : cityNameLower === "chimgan" 
        ? ", Toshkent viloyati" 
        : "";

  const nameLower = deal.name.toLowerCase();
  
  // Dynamic amenities with icons
  const renderAmenities = () => {
    if (nameLower.includes("hilton") || nameLower.includes("samarkand")) {
      return (
        <>
          <div className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Wi-Fi</div>
          <div className="flex items-center gap-1"><Coffee className="h-3 w-3" /> Nonushta</div>
          <div className="flex items-center gap-1"><Car className="h-3 w-3" /> Parking</div>
        </>
      );
    }
    return (
      <>
        <div className="flex items-center gap-1"><Coffee className="h-3 w-3" /> Nonushta</div>
        <div className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Wi-Fi</div>
        <span className="text-[10px] sm:text-[11px]">24/7 xizmat</span>
      </>
    );
  };

  const href = `/${locale}/hotels/${deal.slug}`;

  return (
    <div className="group relative flex h-full overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:border-slate-800 p-2">
      
      {/* Left Image Section */}
      <div className="relative aspect-[4/3] sm:aspect-[4/3] w-[45%] sm:w-[200px] shrink-0 overflow-hidden rounded-xl">
        <Image
          src={imageUrl || "/hotel-uzbekistan.jpeg"}
          alt={deal.name}
          fill
          sizes="(max-width: 640px) 45vw, 200px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md shadow-sm flex items-center z-10">
          -{deal.discountPercent}%
        </div>
        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
      </div>

      {/* Right Content Section */}
      <div className="flex flex-1 flex-col justify-between py-1 px-3 sm:px-4">
        
        <div>
          <Link href={href} className="absolute inset-0 z-0" aria-label={deal.name} />
          <h3 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 line-clamp-2 leading-tight">
            {deal.name}
          </h3>
          <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500 line-clamp-1">
            {deal.cityName}{locationSuffix}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] sm:text-[11px] font-semibold text-slate-400">
            {renderAmenities()}
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0 flex flex-col justify-end">
            <span className="text-[10px] sm:text-[11px] text-slate-400 line-through whitespace-nowrap">
              {formatSum(deal.oldPriceSum)}
            </span>
            <div className="flex items-baseline gap-1 flex-wrap sm:flex-nowrap">
              <span className="text-[13px] sm:text-[15px] font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                {formatSum(deal.newPriceSum)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 whitespace-nowrap">
                / {dict.perNight || "kecha"}
              </span>
            </div>
          </div>
          <div className="relative z-10 mb-0.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white cursor-pointer shadow-sm">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export function DealsSection({
  deals,
  dict,
  locale,
}: {
  deals: DealItem[];
  dict: HomeDict["deals"];
  locale: Locale;
}) {
  if (deals.length === 0) return null;

  // RSC rendering evaluates `now` on the server during request time
  const now = Date.now();

  return (
    <section className="mx-auto mt-4 w-full max-w-[1400px] px-4 lg:px-8 sm:mt-6 relative z-10 pb-10">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
            <ShinyText>{dict.title}</ShinyText>
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600 sm:text-base dark:text-slate-400">
            {dict.subtitle}
          </p>
        </div>
        <Link
          href={`/${locale}/hotels`}
          className="shrink-0 text-sm font-bold text-[#2563EB] transition-colors hover:text-[#1D4ED8] flex items-center gap-1 pb-1"
        >
          Barchasini ko'rish →
        </Link>
      </div>

      {/* Mobile Carousel (Client wrapper for interaction, Server Children) */}
      <DealsMobileCarousel itemsCount={deals.length}>
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="w-[85vw] sm:w-[350px] shrink-0 snap-start"
          >
            <DealCard deal={deal} locale={locale} dict={dict} now={now} />
          </div>
        ))}
      </DealsMobileCarousel>

      {/* Desktop Grid */}
      <div className="hidden gap-6 sm:grid lg:grid-cols-3">
        {deals.slice(0, 3).map((deal) => (
          <DealCard key={deal.id} deal={deal} locale={locale} dict={dict} now={now} />
        ))}
      </div>
    </section>
  );
}
