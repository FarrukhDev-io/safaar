"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  Car, PhoneCall, ShieldCheck, Users, Search, RotateCcw, 
  MapPin, UserCheck, Calendar, Minus, Plus, CreditCard, Clock, CheckCircle2 
} from "lucide-react";
import { formatSum } from "@/lib/money";
import type { TransportDict } from "@/i18n/dictionaries";
import type { TransportItem } from "@/components/catalog/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { CategoryTabs, type CategoryTab } from "@/components/ui/CategoryTabs";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/config";

export type { TransportItem };

function TransportCard({
  item,
  dict,
}: {
  item: TransportItem;
  dict: TransportDict;
}) {
  const price = item.pricePerDaySum > 0 ? item.pricePerDaySum : 650000;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
            <Car className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white">
            <span className="text-blue-600">{(item.rating || 4.8).toFixed(1)}</span>
            <StarIcon className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-colors hover:text-red-500 dark:bg-slate-900">
            <HeartIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-base font-bold text-slate-900 dark:text-white">
          {item.name}
        </div>
        <div className="mb-3 flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>{item.cityName || "Toshkent"}</span>
          <span className="mx-1">→</span>
          <span>Samarqand</span>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <UserCheck className="h-3.5 w-3.5" />
            {item.seats} o'rin
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <SnowflakeIcon className="h-3.5 w-3.5" />
            Konditsioner
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <BagIcon className="h-3.5 w-3.5" />
            2 ta katta bagaj
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {formatSum(price)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Bir tomonlama
            </span>
          </div>
          <Button variant="secondary" className="h-9 min-h-[36px] shadow-none !translate-y-0 rounded-full px-4 text-xs font-bold !text-blue-600 border-blue-200 hover:!bg-blue-50 hover:!border-blue-300 dark:border-blue-900 dark:hover:!bg-blue-950/50">
            Tanlash &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper icons that aren't imported directly
function StarIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function HeartIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
}
function SnowflakeIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>;
}
function BagIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
}

export function TransportView({
  dict,
  items,
  locale,
  initialCheckIn = "",
  initialCheckOut = "",
}: {
  dict: TransportDict;
  items: TransportItem[];
  locale: Locale;
  initialCheckIn?: string;
  initialCheckOut?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [fromCity, setFromCity] = useState<string>("Toshkent");
  const [toCity, setToCity] = useState<string>("Samarqand");
  const [passengers, setPassengers] = useState<number>(2);
  const [checkIn, setCheckIn] = useState(initialCheckIn || "2024-05-18");
  const [checkOut, setCheckOut] = useState(initialCheckOut || "2024-05-20");
  const [sortBy, setSortBy] = useState<string>("default");

  const categories = useMemo(
    () => [
      { id: "all", label: "Barcha turlar", icon: null },
      { id: "rent", label: "Avto ijarasi (Rent a Car)", icon: <Car className="h-4 w-4" /> },
      { id: "transfer", label: "Aeroport transfer", icon: <MapPin className="h-4 w-4" /> },
      { id: "vip", label: "VIP & Biznes taksi", icon: <StarIcon className="h-4 w-4" /> },
      { id: "bus", label: "Shaharlararo avtobus", icon: <Users className="h-4 w-4" /> },
      { id: "auto_transfer", label: "Avtotransport & Transfer", icon: <MapPin className="h-4 w-4" /> },
    ],
    []
  );

  const transportTabs: CategoryTab[] = useMemo(() => {
    return categories.map((cat) => ({
      key: cat.id,
      label: cat.label,
      icon: cat.icon ? () => cat.icon : undefined,
      isActive: selectedCategory === cat.id,
      onClick: () => setSelectedCategory(cat.id),
      color: selectedCategory === cat.id ? "text-white" : "text-slate-500"
    }));
  }, [categories, selectedCategory]);

  return (
    <main className="mx-auto w-full md:w-[96%] max-w-[1536px] flex-1 px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8">
      
      {/* ═══ Header Banner ═══ */}
      <div className="relative mb-4 sm:mb-6 flex h-[150px] sm:h-[200px] w-full flex-col justify-center overflow-hidden rounded-[20px] sm:rounded-[24px] bg-gradient-to-r from-[#f0f7ff] to-[#e6f2ff] px-5 sm:px-8 md:px-12 dark:from-slate-900 dark:to-slate-800">
        <div className="relative z-10 w-full sm:max-w-[60%]">
          <h1 className="mb-1.5 sm:mb-2.5 text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#0f172a] dark:text-white leading-tight">
            Avto Ijarasi va Transfer Xizmatlari
          </h1>
          <p className="hidden sm:block text-[13px] sm:text-[14px] font-medium leading-relaxed text-[#475569] dark:text-slate-400">
            O'zbekiston bo'ylab qulay sayohat qilish uchun avtomobil ijarasi, VIP taksi va aeroport transferlari.
          </p>
        </div>
        
        {/* Decorative Skyline Silhouette Background */}
        <div 
          className="absolute inset-0 z-0 h-full w-full bg-cover bg-center bg-no-repeat opacity-[0.15] mix-blend-multiply grayscale dark:opacity-30 dark:mix-blend-screen pointer-events-none"
          style={{ backgroundImage: "url('/Tashkent-city-skyline.jpeg')" }}
        ></div>
        
        {/* Floating Car Image — hidden on smallest mobiles, visible sm+ */}
        <div className="absolute -bottom-2 right-4 sm:right-12 z-10 w-[150px] sm:w-[260px] lg:w-[350px] opacity-60 sm:opacity-100 sm:block">
          <img 
            src="https://freepngimg.com/thumb/car/3-2-car-free-download-png.png" 
            alt="Safaar Transport Car" 
            className="w-full object-contain drop-shadow-2xl grayscale brightness-150 contrast-125 hue-rotate-180 mix-blend-normal" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://img.icons8.com/?size=512&id=QJzM9r5R1y3L&format=png";
            }}
          />
        </div>
      </div>

      {/* ═══ Search Panel ═══ */}
      <div className="relative z-20 mb-5 sm:mb-8 rounded-[20px] sm:rounded-[24px] bg-white p-2.5 sm:p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:bg-slate-900 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4">
          
          {/* Top Row: Qayerdan, Qayerga, Yo'lovchilar soni */}
          <div className="flex h-[56px] sm:h-[64px] cursor-pointer flex-col justify-center rounded-[14px] sm:rounded-[16px] border border-slate-200/80 bg-white px-4 sm:px-5 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748b]">
              <MapPin className="h-3.5 w-3.5 text-[#3b82f6]" />
              <span>Qayerdan</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[15px] font-bold text-[#0f172a] dark:text-white">
              <span>{fromCity}</span>
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="flex h-[56px] sm:h-[64px] cursor-pointer flex-col justify-center rounded-[14px] sm:rounded-[16px] border border-slate-200/80 bg-white px-4 sm:px-5 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748b]">
              <MapPin className="h-3.5 w-3.5 text-[#3b82f6]" />
              <span>Qayerga</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[15px] font-bold text-[#0f172a] dark:text-white">
              <span>{toCity}</span>
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="flex h-[56px] sm:h-[64px] flex-col justify-center rounded-[14px] sm:rounded-[16px] border border-slate-200/80 bg-white px-4 sm:px-5 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748b]">
              <Users className="h-3.5 w-3.5 text-[#3b82f6]" />
              <span>Yo'lovchilar soni</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[15px] font-bold text-[#0f172a] dark:text-white">
              <span>{passengers} yo'lovchi</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPassengers(Math.max(1, passengers - 1))} className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setPassengers(passengers + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Olib ketish, Qaytarish, Qidirish */}
          <div className="flex h-[64px] cursor-pointer flex-col justify-center rounded-[16px] border border-slate-200/80 bg-white px-5 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748b]">
              <Calendar className="h-3.5 w-3.5 text-[#3b82f6]" />
              <span>Olib ketish sanasi</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[15px] font-bold text-[#0f172a] dark:text-white">
              <span>18 May, 2024</span>
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="flex h-[56px] sm:h-[64px] cursor-pointer flex-col justify-center rounded-[14px] sm:rounded-[16px] border border-slate-200/80 bg-white px-4 sm:px-5 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748b]">
              <Calendar className="h-3.5 w-3.5 text-[#3b82f6]" />
              <span>Qaytarish sanasi</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[15px] font-bold text-[#0f172a] dark:text-white">
              <span>20 May, 2024</span>
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <button className="flex h-[56px] sm:h-[64px] w-full items-center justify-center rounded-[14px] sm:rounded-[16px] bg-[#0057ff] text-[14px] sm:text-[15px] font-bold tracking-wide text-white transition-all hover:bg-blue-700 active:scale-[0.98] shadow-sm shadow-blue-500/20 sm:col-span-2 md:col-span-1">
            <Search className="mr-2 h-4 w-4" />
            QIDIRISH
          </button>
        </div>
      </div>

      {/* Category Tabs Switcher */}
      <div className="mb-5 sm:mb-8 -mx-3 sm:mx-0 overflow-x-auto">
        <div className="flex gap-2 px-3 sm:px-0 sm:flex-wrap pb-1 sm:pb-0" style={{minWidth: 'max-content'}}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-950"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              {cat.icon && (
                <span className={selectedCategory === cat.id ? "text-white" : "text-slate-400"}>
                  {cat.icon}
                </span>
              )}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Results Toolbar & Sorting ═══ */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
            12 ta transport topildi
          </h2>
          <p className="mt-0.5 sm:mt-1 hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>{fromCity} &rarr; {toCity}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span>18 May - 20 May</span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span>{passengers} yo'lovchi</span>
          </p>
        </div>

        {/* Sort select */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Saralash:
          </span>
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: "default", label: "Tavsiya etilgan" },
              { value: "price_asc", label: "Arzondan qimmatga" },
              { value: "price_desc", label: "Qimmatdan arzonga" },
            ]}
            className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <TransportCard key={item.id} item={item} dict={dict} />
        ))}
      </div>

      {/* Features Footer */}
      <div className="mt-12 grid grid-cols-1 gap-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Xavfsiz sayohat</h4>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
              Tekshirilgan haydovchilar va sug'urtalangan transport
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">24/7 qo'llab-quvvatlash</h4>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
              Istalgan vaqtda yordam berish xizmatimiz
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Onlayn to'lov</h4>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
              Xavfsiz va qulay to'lov tizimi
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Bepul bekor qilish</h4>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
              Ko'pchilik buyurtmalarda bepul bekor qilish imkoni
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
