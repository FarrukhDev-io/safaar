"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Home, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingStatus } from "@safaar/types";
import { Button } from "../../../_components/ui/button";
import { EmptyState } from "../../../_components/ui/empty-state";
import { PageHeader } from "../../../_components/layout/page-header";
import { WalkInDialog, type WalkInInitial } from "../../../_components/domain/walk-in-dialog";
import { useReservations } from "../../../_hooks/use-reservations";
import { useRooms } from "../../../_hooks/use-rooms";
import { getPartnerLabels } from "../../../_lib/utils/partner-labels";
import { useAuthStore } from "../../../_stores/auth-store";
import { TODAY_ISO } from "../../../_lib/utils/date";
import { cn } from "../../../_lib/utils/cn";

const WEEKDAY_SHORT = ["Yak", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];
const MONTH_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Dacha uchun oylik bandlik ko'rinishi */
export function DachaAvailabilityView() {
  const router = useRouter();
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);
  const { data: rooms, isLoading } = useRooms();
  const room = rooms[0] ?? null;
  const { data: reservations } = useReservations();

  // Oylik navigatsiya
  const todayDate = new Date(TODAY_ISO);
  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());

  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInInitial, setWalkInInitial] = useState<WalkInInitial>({});

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(todayDate.getFullYear());
    setMonth(todayDate.getMonth());
  };

  // Oyning birinchi kunidan oldin nechtasi (haftaning necha o'tgan kuni)
  const firstDow = new Date(year, month, 1).getDay(); // 0=Yak
  const totalDays = daysInMonth(year, month);

  // Barcha kunlar ISO formatda
  const dayIsos = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => toIso(year, month, i + 1)),
    [year, month, totalDays],
  );

  // Band kunlar set'i
  const activeReservations = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.status !== BookingStatus.CANCELLED &&
          r.status !== BookingStatus.EXPIRED &&
          r.status !== BookingStatus.PENDING,
      ),
    [reservations],
  );

  const bookedDays = useMemo(() => {
    const set = new Set<string>();
    for (const r of activeReservations) {
      for (let d = r.checkIn; d < r.checkOut; d = addDays(d, 1)) {
        set.add(d);
      }
    }
    return set;
  }, [activeReservations]);

  const bookedCount = dayIsos.filter((d) => bookedDays.has(d)).length;
  const freeCount = totalDays - bookedCount;

  const handleDayClick = (iso: string) => {
    if (bookedDays.has(iso)) {
      const res = activeReservations.find(r => r.checkIn <= iso && r.checkOut > iso);
      if (res) {
        router.push(`/reservations/${res.id}`);
      }
      return;
    }
    setWalkInInitial({ checkIn: iso, checkOut: addDays(iso, 1) });
    setWalkInOpen(true);
  };

  const isCurrentMonth =
    year === todayDate.getFullYear() && month === todayDate.getMonth();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Operatsion"
        title={labels.calendarTitle}
        description={labels.calendarDescription}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setWalkInInitial({});
              setWalkInOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {labels.newBookingLabel}
          </Button>
        }
      />

      {/* Statistika */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            Bo'sh kunlar
          </p>
          <p className="mt-1 text-2xl font-bold text-accent-600 dark:text-accent-400">
            {freeCount}
            <span className="ml-1 text-sm font-normal text-[var(--muted-foreground)]">
              / {totalDays} kun
            </span>
          </p>
        </div>
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            Band kunlar
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">
            {bookedCount}
            <span className="ml-1 text-sm font-normal text-[var(--muted-foreground)]">
              kun
            </span>
          </p>
        </div>
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            Davrdagi bronlar
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            {activeReservations.length}
          </p>
        </div>
      </section>

      {/* Oy navigatsiyasi */}
      <div className="flex items-center gap-2 rounded-card border border-[var(--border)] bg-[var(--surface)] p-3">
        <Button
          variant="outline"
          size="icon"
          onClick={prevMonth}
          aria-label="Oldingi oy"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goToday}
          disabled={isCurrentMonth}
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Bugun
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={nextMonth}
          aria-label="Keyingi oy"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
        <span className="ml-2 text-base font-semibold text-[var(--foreground)]">
          {MONTH_UZ[month]} {year}
        </span>
        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-brand-500" aria-hidden />
            Band
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-accent-400" aria-hidden />
            Bo'sh
          </span>
        </div>
      </div>

      {/* Yillik band bo'lmagan holat */}
      {!isLoading && !room ? (
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-8">
          <EmptyState
            icon={<Home className="h-10 w-10" aria-hidden />}
            title="Dacha qo'shilmagan"
            description="Bandlik kalendarini ko'rish uchun avval Sozlamalar bo'limidan dachani qo'shing."
          />
        </div>
      ) : (
        /* Oylik kalendar grid */
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          {/* Hafta sarlavhalari */}
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {WEEKDAY_SHORT.map((label) => (
              <div
                key={label}
                className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Kunlar */}
          <div className="grid grid-cols-7">
            {/* Bo'sh kataklar (oyning 1-kuni haftaning qaysi kuni) */}
            {Array.from({ length: firstDow }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[64px] border-b border-r border-[var(--border)] bg-[var(--surface-muted)]/40"
              />
            ))}

            {dayIsos.map((iso) => {
              const day = new Date(iso).getDate();
              const dow = new Date(iso).getDay();
              const isToday = iso === TODAY_ISO;
              const isBooked = bookedDays.has(iso);
              const isWeekend = dow === 0 || dow === 6;
              const isPast = iso < TODAY_ISO;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => handleDayClick(iso)}
                  title={
                    isBooked
                      ? "Band — batafsil ko'rish uchun bosing"
                      : isPast
                      ? "O'tgan kun"
                      : "Bo'sh — bosib yangi bron yarating"
                  }
                  className={cn(
                    "relative flex min-h-[64px] flex-col items-start justify-between p-2 text-left transition-colors",
                    "border-b border-r border-[var(--border)]",
                    isBooked
                      ? "cursor-pointer bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50"
                      : isPast
                      ? "cursor-default bg-[var(--surface-muted)]/50 opacity-60"
                      : "cursor-pointer bg-[var(--surface)] hover:bg-accent-50 dark:hover:bg-accent-900/20",
                    isWeekend && !isBooked && !isToday && "bg-zinc-50/60 dark:bg-zinc-900/20",
                  )}
                >
                  {/* Kun raqami */}
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold leading-none",
                      isToday
                        ? "bg-brand-600 text-white"
                        : isBooked
                        ? "text-brand-700 dark:text-brand-300"
                        : "text-[var(--foreground)]",
                    )}
                  >
                    {day}
                  </span>

                  {/* Band belgisi */}
                  {isBooked && (
                    <span className="w-full rounded text-center text-[9px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/50 px-1 py-0.5">
                      Band
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <WalkInDialog
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        initialValues={walkInInitial}
      />
    </div>
  );
}
