"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { BookingStatus } from "@safaar/types";
import { Button } from "../../../_components/ui/button";
import { PageHeader } from "../../../_components/layout/page-header";
import { WalkInDialog, type WalkInInitial } from "../../../_components/domain/walk-in-dialog";
import { useReservations } from "../../../_hooks/use-reservations";
import { useRooms } from "../../../_hooks/use-rooms";
import { getPartnerLabels } from "../../../_lib/utils/partner-labels";
import { useAuthStore } from "../../../_stores/auth-store";
import { TODAY_ISO } from "../../../_lib/utils/date";
import { cn } from "../../../_lib/utils/cn";

const WEEKDAY_LABEL = ["Yak", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];
const VIEW_DAYS = 30;

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Dacha uchun soddalashtirilgan mavjudlik ko'rinishi — xona tanlash yo'q, yagona birlik. */
export function DachaAvailabilityView() {
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);
  const { data: rooms } = useRooms();
  const room = rooms[0];
  const { data: reservations } = useReservations();

  const [startOffset, setStartOffset] = useState(0);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInInitial, setWalkInInitial] = useState<WalkInInitial>({});

  const startDate = addDays(TODAY_ISO, startOffset);
  const days = useMemo(
    () => Array.from({ length: VIEW_DAYS }, (_, i) => addDays(startDate, i)),
    [startDate],
  );

  const activeReservations = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.roomNumber === room?.number &&
          r.status !== BookingStatus.CANCELLED &&
          r.status !== BookingStatus.EXPIRED,
      ),
    [reservations, room?.number],
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

  const visibleBookedCount = days.filter((d) => bookedDays.has(d)).length;

  const handleDayClick = (dateIso: string) => {
    if (bookedDays.has(dateIso)) return;
    setWalkInInitial({ checkIn: dateIso, checkOut: addDays(dateIso, 1) });
    setWalkInOpen(true);
  };

  if (!room) return null;

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

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            {labels.availabilityLabel}
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {VIEW_DAYS - visibleBookedCount} / {VIEW_DAYS} kun bo'sh
          </p>
        </div>
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">
            Davrdagi bronlar
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {activeReservations.length}
          </p>
        </div>
      </section>

      <div className="flex items-center gap-1 rounded-card border border-[var(--border)] bg-[var(--surface)] p-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setStartOffset((v) => v - VIEW_DAYS)}
          aria-label="Oldingi davr"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStartOffset(0)}
          disabled={startOffset === 0}
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Bugun
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setStartOffset((v) => v + VIEW_DAYS)}
          aria-label="Keyingi davr"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
        {days.map((iso) => {
          const isToday = iso === TODAY_ISO;
          const isBooked = bookedDays.has(iso);
          const d = new Date(iso);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => handleDayClick(iso)}
              disabled={isBooked}
              title={isBooked ? "Band" : "Bo'sh — bosib bron yaratish"}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg border p-2 text-xs transition-colors",
                isBooked
                  ? "cursor-not-allowed border-brand-200 bg-brand-100 text-brand-800 dark:border-brand-900/60 dark:bg-brand-900/40 dark:text-brand-200"
                  : "cursor-pointer border-accent-200 bg-accent-50 text-accent-800 hover:bg-accent-100 dark:border-accent-900/60 dark:bg-accent-950/20 dark:text-accent-200",
                isToday && "ring-2 ring-brand-500",
              )}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-70">
                {WEEKDAY_LABEL[d.getDay()]}
              </span>
              <span className="text-sm font-bold leading-none">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <WalkInDialog
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        initialValues={walkInInitial}
      />
    </div>
  );
}
