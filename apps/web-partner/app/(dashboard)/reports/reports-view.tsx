"use client";

import {
  Activity,
  BedDouble,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Calendar,
  UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Card,
  CardBody,
} from "../../_components/ui/card";
import { PageHeader } from "../../_components/layout/page-header";
import { formatMoney } from "../../_lib/utils/format";
import {
  buildDachaAvailabilitySummary,
  buildDailyStats,
  buildSourceDistribution,
  buildUnitTypeDistribution,
} from "../../_lib/domain/reports";
import { useReservations } from "../../_hooks/use-reservations";
import { useRoomTypes } from "../../_hooks/use-room-types";
import { useDataStore } from "../../_stores/data-store";
import { useAuthStore } from "../../_stores/auth-store";
import { getPartnerLabels, isDacha, isRestaurant } from "../../_lib/utils/partner-labels";
import { TODAY_ISO } from "../../_lib/utils/date";
import { cn } from "../../_lib/utils/cn";

type TimeRange = "7days" | "30days" | "year";

export function ReportsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");
  const { data: reservations } = useReservations();
  const { data: roomTypes } = useRoomTypes();
  const getStats = useDataStore((s) => s.getStats);
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);
  const dacha = isDacha(partnerType);
  const restaurant = isRestaurant(partnerType);

  const daysForRange = timeRange === "7days" ? 7 : timeRange === "year" ? 365 : 30;
  const dailyStats = useMemo(
    () => buildDailyStats(reservations, TODAY_ISO, daysForRange),
    [reservations, daysForRange],
  );
  const stats = getStats();
  const totalUnits = stats.totalRooms;

  const revenue = useMemo(
    () => dailyStats.map((d) => ({ date: d.date, revenue: d.revenue, bookings: d.bookings })),
    [dailyStats],
  );
  const occupancy = useMemo(
    () =>
      dailyStats.map((d) => ({
        date: d.date,
        occupancy: totalUnits > 0 ? Math.min(100, Math.round((d.occupiedUnits / totalUnits) * 100)) : 0,
      })),
    [dailyStats, totalUnits],
  );
  const unitTypeDistribution = useMemo(
    () => buildUnitTypeDistribution(reservations, roomTypes),
    [reservations, roomTypes],
  );
  const sourceDistribution = useMemo(
    () => buildSourceDistribution(reservations),
    [reservations],
  );
  const dachaSummary = useMemo(
    () => buildDachaAvailabilitySummary(dailyStats),
    [dailyStats],
  );

  const monthRevenue = revenue.reduce((s, d) => s + d.revenue, 0);
  const monthBookings = revenue.reduce((s, d) => s + d.bookings, 0);
  const avgOccupancy = occupancy.length
    ? Math.round(occupancy.reduce((s, d) => s + d.occupancy, 0) / occupancy.length)
    : 0;
  const adr = monthBookings > 0 ? Math.round(monthRevenue / monthBookings) : 0;

  // Oxirgi 7 kunni olish
  const recentRevenue = revenue.slice(-7).reverse();
  const recentOccupancy = occupancy.slice(-7).reverse();

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10">
      <PageHeader
        eyebrow="Tahlil va Statistika"
        title="Biznes Hisobotlari"
        description={`${labels.dashboardTitle} moliyaviy holati, ${labels.guestLabel.toLowerCase()}lar oqimi va sotuvlar bo'yicha batafsil ko'rsatkichlar.`}
      />

      {/* Vaqt Filtrlari */}
      <div className="flex justify-center md:justify-end">
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl">
          <TimeTab active={timeRange === "7days"} onClick={() => setTimeRange("7days")} label="Oxirgi 7 kun" />
          <TimeTab active={timeRange === "30days"} onClick={() => setTimeRange("30days")} label="Oxirgi 30 kun" />
          <TimeTab active={timeRange === "year"} onClick={() => setTimeRange("year")} label="Joriy yil" />
        </div>
      </div>

      {/* Asosiy ko'rsatkichlar (KPIs) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportMetric
          label="Umumiy Daromad"
          value={formatMoney(monthRevenue)}
          trend={{ value: 12, positive: true }}
          icon={<DollarSign className="h-6 w-6" />}
          tone="brand"
        />
        <ReportMetric
          label="O'rtacha Bandlik"
          value={`${avgOccupancy}%`}
          trend={{ value: 5, positive: true }}
          icon={<Activity className="h-6 w-6" />}
          tone="accent"
        />
        <ReportMetric
          label={restaurant ? "O'rtacha bron narxi" : "O'rtacha kunlik narx (ADR)"}
          value={formatMoney(adr)}
          trend={{ value: 2, positive: false }}
          icon={<CreditCard className="h-6 w-6" />}
          tone="warning"
        />
        <ReportMetric
          label="Yangi Bronlar"
          value={monthBookings.toString()}
          trend={{ value: 8, positive: true }}
          icon={restaurant ? <UtensilsCrossed className="h-6 w-6" /> : <BedDouble className="h-6 w-6" />}
          tone="success"
        />
      </section>

      {/* Daromad va Bandlik Ro'yxatlari */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Daromad Ro'yxati */}
        <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 flex flex-col">
          <CardBody className="p-6 flex-1 flex flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Oxirgi kunlar daromadi</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Kunlik tushumlar va bronlar soni
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-0">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 py-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <span>Sana</span>
                <span className="text-right w-16">Bronlar</span>
                <span className="text-right w-24">Daromad</span>
              </div>
              
              {recentRevenue.map((d) => (
                <div key={d.date} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 px-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-md">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{formatShortDate(d.date)}</span>
                  </div>
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 text-right w-16">{d.bookings} ta</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white text-right w-24">{formatMoney(d.revenue)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Bandlik Ro'yxati */}
        <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 flex flex-col">
          <CardBody className="p-6 flex-1 flex flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Oxirgi kunlar bandligi</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {labels.unitPlural.charAt(0).toUpperCase()}{labels.unitPlural.slice(1)} qanchalik to'lganligi (foizda)
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-0">
              <div className="grid grid-cols-[1fr_auto] gap-4 py-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <span>Sana</span>
                <span className="text-right">To'liqlik (%)</span>
              </div>
              
              {recentOccupancy.map((d) => (
                <div key={d.date} className="grid grid-cols-[1fr_auto] gap-4 py-3 px-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-md">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{formatShortDate(d.date)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className={cn(
                      "text-sm font-bold text-right",
                      d.occupancy >= 80 ? "text-emerald-600 dark:text-emerald-400" : 
                      d.occupancy >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {d.occupancy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Sotuv Manbalari Ro'yxati */}
        <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 flex flex-col">
          <CardBody className="p-6 flex-1 flex flex-col">
            <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Sotuv manbalari</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Mehmonlar qaysi platformalardan kelmoqda?
              </p>
            </div>
            
            <div className="flex flex-col gap-0">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 py-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <span>Manba (Platforma)</span>
                <span className="text-right w-16">Ulush</span>
                <span className="text-right w-16">Bronlar</span>
              </div>
              
              {(() => {
                const totalSrc = sourceDistribution.reduce((s, r) => s + r.value, 0);
                const sortedSrc = [...sourceDistribution].sort((a,b) => b.value - a.value).slice(0, 5);
                
                return sortedSrc.map((s) => {
                  const pct = totalSrc ? Math.round((s.value / totalSrc) * 100) : 0;
                  return (
                    <div key={s.name} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 px-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-md">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{s.name}</span>
                      <span className="text-sm font-medium text-zinc-500 text-right w-16">{pct}%</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white text-right w-16">{s.value} ta</span>
                    </div>
                  );
                });
              })()}
            </div>
          </CardBody>
        </Card>

        {/* Top xona/dorm turlari yoki dacha uchun bandlik xulosasi */}
        {dacha ? (
          <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
            <CardBody className="p-6">
              <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Bandlik holati</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Oxirgi {dachaSummary.totalNights} kunda dachangiz qanchalik band bo'lgan
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {dachaSummary.bookedNights}/{dachaSummary.totalNights}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">kun band bo'lgan</p>
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{
                      width: `${dachaSummary.totalNights > 0 ? Math.round((dachaSummary.bookedNights / dachaSummary.totalNights) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="border-none shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
            <CardBody className="p-6">
              <div className="mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  Top {labels.unitTypeLabel.toLowerCase()}lari (Daromad bo'yicha)
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Biznesga eng ko'p foyda keltiruvchi top-5 {labels.unitTypeLabel.toLowerCase()}
                </p>
              </div>

              <div className="flex flex-col gap-0">
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 py-2 px-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <span className="w-6 text-center">#</span>
                  <span>{labels.unitTypeLabel}</span>
                  <span className="text-right">Daromad</span>
                </div>

                {unitTypeDistribution.length === 0 ? (
                  <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    Hali bronlar yo'q.
                  </p>
                ) : (
                  [...unitTypeDistribution]
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map((r, index) => (
                      <div key={r.id} className="grid grid-cols-[auto_1fr_auto] gap-4 py-3 px-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors rounded-md">
                        <span className="text-sm font-mono text-zinc-400 w-6 text-center">{index + 1}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{r.name}</span>
                          <span className="text-xs text-zinc-500 mt-0.5">{r.bookings} ta bron qilingan</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white text-right self-center">{formatMoney(r.revenue)}</span>
                      </div>
                    ))
                )}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

    </div>
  );
}

// ==========================================
// Yordamchi Komponentlar
// ==========================================

function formatShortDate(isoDate: string) {
  const d = new Date(isoDate);
  const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
  return `${d.getDate()}-${months[d.getMonth()]}`;
}

function TimeTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap",
        active 
          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700/50" 
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/30 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30"
      )}
    >
      {label}
    </button>
  );
}

function ReportMetric({
  label, value, trend, icon, tone = "brand"
}: {
  label: string;
  value: string;
  trend?: { value: number; positive: boolean };
  icon: React.ReactNode;
  tone?: "brand" | "accent" | "warning" | "success" | "danger" | "neutral";
}) {
  const toneMap = {
    neutral: { bg: "bg-zinc-100 dark:bg-zinc-800/60", icon: "text-zinc-500" },
    brand: { bg: "bg-brand-50 dark:bg-brand-900/20", icon: "text-brand-600 dark:text-brand-400" },
    accent: { bg: "bg-indigo-50 dark:bg-indigo-900/20", icon: "text-indigo-600 dark:text-indigo-400" },
    warning: { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600 dark:text-amber-400" },
    success: { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-600 dark:text-emerald-400" },
    danger: { bg: "bg-red-50 dark:bg-red-900/20", icon: "text-red-600 dark:text-red-400" },
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-zinc-900 dark:border-zinc-800/60">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{value}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", toneMap.bg, toneMap.icon)}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-5 flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md",
            trend.positive 
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {trend.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend.value}%
          </div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">o'tgan oyga nisbatan</span>
        </div>
      )}
    </div>
  );
}
