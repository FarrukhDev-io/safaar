"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Info, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { BookingStatus } from "@safaar/types";
import { Button } from "../../../_components/ui/button";
import { Card, CardBody } from "../../../_components/ui/card";
import { EmptyState } from "../../../_components/ui/empty-state";
import { PageHeader } from "../../../_components/layout/page-header";
import { WalkInDialog, type WalkInInitial } from "../../../_components/domain/walk-in-dialog";
import { useRooms } from "../../../_hooks/use-rooms";
import { useReservations } from "../../../_hooks/use-reservations";
import { useRoomTypes } from "../../../_hooks/use-room-types";
import { useListing } from "../../../_hooks/use-listing";
import { useAuthStore } from "../../../_stores/auth-store";
import { cn } from "../../../_lib/utils/cn";
import { formatMoney } from "../../../_lib/utils/format";
import { TODAY_ISO } from "../../../_lib/mocks/data";
import { getPartnerLabels } from "../../../_lib/utils/partner-labels";
import {
  DEFAULT_SLOT_DURATION_MINUTES,
  SLOT_STEP_MINUTES,
  buildTimeSlots,
  toHHMM,
  toMinutes,
} from "../../../_lib/utils/time-slots";
import type { ReservationView } from "../../../_lib/domain/types";
import { ReservationBar } from "./reservation-bar";

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface TableRow {
  key: string;
  roomTypeId: string;
  primaryLabel: string;
  secondaryLabel: string;
  isListed: boolean;
  nightlyPrice?: number;
  roomNumber: string;
}

/** Restoran uchun kunlik vaqt-slot jadvali — kalendar o'rniga ishlatiladi. */
export function RestaurantScheduleView() {
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);

  const { data: rooms } = useRooms();
  const { data: reservations } = useReservations();
  const { data: roomTypes } = useRoomTypes();
  const { data: listing } = useListing();

  const [dayOffset, setDayOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInInitial, setWalkInInitial] = useState<WalkInInitial>({});

  const scheduleDate = addDays(TODAY_ISO, dayOffset);
  const slots = useMemo(
    () => buildTimeSlots(listing.checkInTime, listing.checkOutTime),
    [listing.checkInTime, listing.checkOutTime],
  );
  const spanSlots = Math.max(1, Math.round(DEFAULT_SLOT_DURATION_MINUTES / SLOT_STEP_MINUTES));

  const allRows = useMemo<TableRow[]>(
    () =>
      rooms.map((room) => ({
        key: room.id,
        roomTypeId: room.roomTypeId,
        primaryLabel: room.number,
        secondaryLabel: room.roomTypeName,
        isListed: room.isListed,
        nightlyPrice: room.nightlyPrice,
        roomNumber: room.number,
      })),
    [rooms],
  );

  const sortedRows = useMemo(() => {
    const filtered =
      typeFilter === "all" ? allRows : allRows.filter((r) => r.roomTypeId === typeFilter);
    return [...filtered].sort(
      (a, b) =>
        Number(a.roomNumber) - Number(b.roomNumber) ||
        a.primaryLabel.localeCompare(b.primaryLabel),
    );
  }, [allRows, typeFilter]);

  const handleEmptyClick = (row: TableRow, slotTime: string) => {
    setWalkInInitial({
      checkIn: scheduleDate,
      checkOut: scheduleDate,
      roomTypeId: row.roomTypeId,
      roomNumber: row.roomNumber,
      slotTime,
    });
    setWalkInOpen(true);
  };

  // Har bir stol uchun shu kungi bronlar
  const reservationsByRow = (() => {
    const map = new Map<
      string,
      Array<{
        reservation: ReservationView;
        startCol: number;
        spanCols: number;
        truncatedStart: boolean;
        truncatedEnd: boolean;
      }>
    >();

    for (const row of sortedRows) {
      for (const r of reservations) {
        if (
          r.status === BookingStatus.CANCELLED ||
          r.status === BookingStatus.EXPIRED ||
          r.bedId ||
          r.roomNumber !== row.roomNumber ||
          r.checkIn !== scheduleDate ||
          !r.slotTime
        ) {
          continue;
        }

        const slotIdx = slots.indexOf(r.slotTime);
        if (slotIdx === -1) continue;

        const visibleStart = slotIdx;
        const visibleEnd = Math.min(slots.length, slotIdx + spanSlots);
        if (visibleEnd <= visibleStart) continue;

        const entry = {
          reservation: r,
          startCol: visibleStart + 2, // +1 sticky ustun + 1 (1-indexed grid)
          spanCols: visibleEnd - visibleStart,
          truncatedStart: false,
          truncatedEnd: slotIdx + spanSlots > slots.length,
        };

        const existing = map.get(row.key) ?? [];
        existing.push(entry);
        map.set(row.key, existing);
      }
    }
    return map;
  })();

  const dayStats = (() => {
    const visible = reservations.filter(
      (r) =>
        r.checkIn === scheduleDate &&
        r.slotTime &&
        r.status !== BookingStatus.CANCELLED &&
        r.status !== BookingStatus.EXPIRED,
    );
    const total = visible.reduce((sum, r) => sum + r.totalPrice, 0);
    const paid = visible.reduce((sum, r) => sum + r.paidAmount, 0);
    return {
      bookings: visible.length,
      total,
      paid,
      listedRows: sortedRows.filter((r) => r.isListed).length,
    };
  })();

  const dateLabel = (() => {
    const d = new Date(scheduleDate);
    const months = [
      "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
      "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
    ];
    const weekdays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    return `${weekdays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  })();

  const colWidth = 72;
  const roomColWidth = 156;
  const rowHeight = 58;
  const headerHeight = 56;

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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CalendarMetric
          label={labels.availabilityLabel}
          value={`${dayStats.listedRows} / ${sortedRows.length}`}
          hint="turistlarga sotuvda"
        />
        <CalendarMetric
          label="Bugungi bronlar"
          value={dayStats.bookings.toString()}
          hint={dateLabel}
        />
        <CalendarMetric
          label="Oldindan to'langan"
          value={formatMoney(dayStats.paid)}
          hint={`Jami: ${formatMoney(dayStats.total)}`}
        />
        <CalendarMetric
          label="Ochiq vaqtlar"
          value={`${slots[0] ?? "—"} – ${slots.length ? toHHMM(toMinutes(slots[slots.length - 1]) + SLOT_STEP_MINUTES) : "—"}`}
          hint="Sozlamalar → Qoidalardan o'zgartiring"
        />
      </section>

      {/* Boshqaruv lentasi */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDayOffset((v) => v - 1)}
            aria-label="Oldingi kun"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDayOffset(0)}
            disabled={dayOffset === 0}
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Bugun
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDayOffset((v) => v + 1)}
            aria-label="Keyingi kun"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <span className="ml-3 text-sm font-medium text-[var(--muted-foreground)]">
            {dateLabel}
          </span>
        </div>

        <select
          aria-label={labels.unitTypeLabel}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:border-brand-600 focus:outline-none"
        >
          <option value="all">Barcha {labels.unitTypeLabel.toLowerCase()}lari</option>
          {roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-brand-500" aria-hidden />
          Tasdiqlangan
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-accent-500" aria-hidden />
          Band (ichkarida)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-400" aria-hidden />
          Tasdiq kutmoqda
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-zinc-400" aria-hidden />
          Yakunlangan
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px]">
          <Info className="h-3 w-3" aria-hidden />
          Bo'sh katakka bosib bron yarating
        </span>
      </div>

      {sortedRows.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<CalendarDays className="h-10 w-10" aria-hidden />}
              title={`${labels.unitPlural.charAt(0).toUpperCase()}${labels.unitPlural.slice(1)} yo'q`}
              description={`Avval ${labels.unitsPageTitle} bo'limidan qo'shing.`}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-card border border-[var(--border)] bg-[var(--surface)]">
          <div
            className="relative"
            style={{
              display: "grid",
              gridTemplateColumns: `${roomColWidth}px repeat(${slots.length}, ${colWidth}px)`,
              gridAutoRows: `${rowHeight}px`,
            }}
          >
            <div
              style={{
                gridRow: 1,
                gridColumn: 1,
                height: headerHeight,
                position: "sticky",
                top: 0,
                left: 0,
                zIndex: 30,
              }}
              className="flex items-center justify-center border-b border-r border-[var(--border)] bg-[var(--surface-muted)] text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
            >
              {labels.unitSingular.charAt(0).toUpperCase()}
              {labels.unitSingular.slice(1)}
            </div>

            {slots.map((slot, i) => (
              <div
                key={slot}
                style={{
                  gridRow: 1,
                  gridColumn: i + 2,
                  height: headerHeight,
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                }}
                className="flex items-center justify-center border-b border-r border-[var(--border)] bg-[var(--surface-muted)] text-[11px] font-medium"
              >
                {slot}
              </div>
            ))}

            {sortedRows.map((row, rIdx) => {
              const gridRow = rIdx + 2;
              const bars = reservationsByRow.get(row.key) ?? [];
              return (
                <TableRow
                  key={row.key}
                  primaryLabel={row.primaryLabel}
                  secondaryLabel={row.secondaryLabel}
                  isListed={row.isListed}
                  nightlyPrice={row.nightlyPrice}
                  gridRow={gridRow}
                  slots={slots}
                  bars={bars}
                  onEmptyClick={(slot) => handleEmptyClick(row, slot)}
                />
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

interface TableRowProps {
  primaryLabel: string;
  secondaryLabel: string;
  isListed: boolean;
  nightlyPrice?: number;
  gridRow: number;
  slots: string[];
  bars: Array<{
    reservation: ReservationView;
    startCol: number;
    spanCols: number;
    truncatedStart: boolean;
    truncatedEnd: boolean;
  }>;
  onEmptyClick: (slot: string) => void;
}

function TableRow({
  primaryLabel,
  secondaryLabel,
  isListed,
  nightlyPrice,
  gridRow,
  slots,
  bars,
  onEmptyClick,
}: TableRowProps) {
  return (
    <>
      <div
        style={{
          gridRow,
          gridColumn: 1,
          position: "sticky",
          left: 0,
          zIndex: 15,
        }}
        className="flex min-w-0 flex-col items-start justify-center border-b border-r border-[var(--border)] bg-[var(--surface)] px-3"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="font-mono text-sm font-bold leading-none">{primaryLabel}</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
              isListed
                ? "bg-accent-50 text-accent-700 dark:bg-accent-950/35 dark:text-accent-200"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
            )}
          >
            {isListed ? "E'londa" : "Yopiq"}
          </span>
        </div>
        <span className="mt-1 truncate text-[10px] text-[var(--muted-foreground)]">
          {secondaryLabel}
          {nightlyPrice ? ` · ${formatMoney(nightlyPrice)}` : ""}
        </span>
      </div>

      {slots.map((slot, i) => (
        <button
          key={slot}
          type="button"
          onClick={() => onEmptyClick(slot)}
          aria-label={`${primaryLabel}, ${slot} uchun bron yaratish`}
          style={{ gridRow, gridColumn: i + 2 }}
          className="border-b border-r border-[var(--border)] transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20"
        />
      ))}

      {bars.map((b) => (
        <ReservationBar
          key={b.reservation.id}
          reservation={b.reservation}
          gridRow={gridRow}
          startCol={b.startCol}
          spanCols={b.spanCols}
          truncatedStart={b.truncatedStart}
          truncatedEnd={b.truncatedEnd}
        />
      ))}
    </>
  );
}

function CalendarMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-[var(--foreground)]">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)]">{hint}</p>
    </div>
  );
}
