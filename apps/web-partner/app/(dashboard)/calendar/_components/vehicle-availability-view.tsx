"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Car } from "lucide-react";
import { useMemo, useState } from "react";
import { BookingStatus } from "@safaar/types";
import { Button } from "../../../_components/ui/button";
import { Card, CardBody } from "../../../_components/ui/card";
import { EmptyState } from "../../../_components/ui/empty-state";
import { PageHeader } from "../../../_components/layout/page-header";
import { useReservations } from "../../../_hooks/use-reservations";
import { useVehicles } from "../../../_hooks/use-fleet";
import { getPartnerLabels } from "../../../_lib/utils/partner-labels";
import { useAuthStore } from "../../../_stores/auth-store";
import { TODAY_ISO } from "../../../_lib/utils/date";
import { cn } from "../../../_lib/utils/cn";
import type { ReservationView } from "../../../_lib/domain/types";

const WEEKDAY_LABEL = ["Yak", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];
const VIEW_DAYS = 30;

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Transport (rent-a-car) hamkori uchun "Bandlik taqvimi" — mehmonxona
 * xona-kalendaridan farqli, bu yerda hech qanday "bo'sh katakka bosib
 * bron yaratish" yo'q (o'qish uchun, real bron faqat foydalanuvchi
 * Transport sahifasidan yaratadi) — faqat har bir mashinaning qaysi
 * kunlari band ekanini ko'rsatadi.
 */
export function VehicleAvailabilityView() {
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);
  const { data: vehicles, isLoading } = useVehicles();
  const { data: reservations } = useReservations();

  const [startOffset, setStartOffset] = useState(0);
  const startDate = addDays(TODAY_ISO, startOffset);
  const days = useMemo(
    () => Array.from({ length: VIEW_DAYS }, (_, i) => addDays(startDate, i)),
    [startDate],
  );

  const reservationsByVehicle = useMemo(() => {
    const map = new Map<string, ReservationView[]>();
    for (const r of reservations) {
      if (
        !r.vehicleId ||
        r.status === BookingStatus.CANCELLED ||
        r.status === BookingStatus.EXPIRED
      ) {
        continue;
      }
      const list = map.get(r.vehicleId) ?? [];
      list.push(r);
      map.set(r.vehicleId, list);
    }
    return map;
  }, [reservations]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Operatsion"
        title="Bandlik taqvimi"
        description="Har bir mashinaning band va bo'sh kunlarini kuzating."
      />

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

      {isLoading ? (
        <Card>
          <CardBody className="h-32 animate-pulse" />
        </Card>
      ) : vehicles.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Car className="h-7 w-7" aria-hidden />}
              title={`${labels.unitPlural.charAt(0).toUpperCase()}${labels.unitPlural.slice(1)} yo'q`}
              description="Avval 'Transport Parki' bo'limidan mashina qo'shing."
            />
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {vehicles.map((vehicle) => {
            const vehicleReservations = reservationsByVehicle.get(vehicle.id) ?? [];
            const bookedDays = new Set<string>();
            for (const r of vehicleReservations) {
              for (let d = r.checkIn; d < r.checkOut; d = addDays(d, 1)) {
                bookedDays.add(d);
              }
            }
            const bookedInView = days.filter((d) => bookedDays.has(d)).length;

            return (
              <Card key={vehicle.id}>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{vehicle.name}</p>
                      {vehicle.plate_number && (
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {vehicle.plate_number}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {VIEW_DAYS - bookedInView} / {VIEW_DAYS} kun bo'sh
                    </p>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10 lg:grid-cols-[repeat(30,minmax(0,1fr))]">
                    {days.map((iso) => {
                      const isToday = iso === TODAY_ISO;
                      const isBooked = bookedDays.has(iso);
                      const d = new Date(iso);
                      return (
                        <div
                          key={iso}
                          title={`${iso}${isBooked ? " — band" : " — bo'sh"}`}
                          className={cn(
                            "flex flex-col items-center justify-center gap-0.5 rounded-md border p-1.5 text-[10px]",
                            isBooked
                              ? "border-brand-200 bg-brand-100 text-brand-800 dark:border-brand-900/60 dark:bg-brand-900/40 dark:text-brand-200"
                              : "border-accent-200 bg-accent-50 text-accent-800 dark:border-accent-900/60 dark:bg-accent-950/20 dark:text-accent-200",
                            isToday && "ring-2 ring-brand-500",
                          )}
                        >
                          <span className="uppercase tracking-wide opacity-70">
                            {WEEKDAY_LABEL[d.getDay()]}
                          </span>
                          <span className="font-bold leading-none">{d.getDate()}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
