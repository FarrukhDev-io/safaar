"use client";

import { BedSingle, Sparkles, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { useBeds } from "../../_hooks/use-beds";
import { useRooms } from "../../_hooks/use-rooms";
import { useAssignRoom } from "../../_hooks/use-reservations";
import { useDataStore } from "../../_stores/data-store";
import { RoomStatus, type Bed, type ReservationView, type Room } from "../../_lib/domain/types";
import { cn } from "../../_lib/utils/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  reservation: ReservationView | null;
  /** Yotoq tanlangandan keyingi harakat. */
  onAssigned?: (roomNumber: string) => void;
}

export function AssignBedDialog({ open, onClose, reservation, onAssigned }: Props) {
  const { data: rooms } = useRooms();
  useBeds();
  const beds = useDataStore((s) => s.beds);
  const assignRoom = useAssignRoom();
  const [selected, setSelected] = useState<{ room: Room; bed: Bed } | null>(null);

  const matchingRooms = useMemo(
    () => (reservation ? rooms.filter((r) => r.roomTypeId === reservation.roomTypeId) : []),
    [rooms, reservation],
  );

  const availableBedsCount = useMemo(
    () =>
      matchingRooms.reduce(
        (sum, room) =>
          sum +
          beds.filter((b) => b.roomId === room.id && b.status === RoomStatus.VACANT_CLEAN).length,
        0,
      ),
    [matchingRooms, beds],
  );

  // Qavatlar bo'yicha xaritalash
  const floors = useMemo(() => {
    const map = new Map<number, Room[]>();
    matchingRooms.forEach((room) => {
      if (!map.has(room.floor)) map.set(room.floor, []);
      map.get(room.floor)!.push(room);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([floor, floorRooms]) => ({
        floor,
        rooms: floorRooms.sort((a, b) => a.number.localeCompare(b.number)),
      }));
  }, [matchingRooms]);

  const handleConfirm = () => {
    if (!reservation || !selected) return;
    assignRoom.mutate(
      {
        id: reservation.id,
        roomNumber: selected.room.number,
        bedId: selected.bed.id,
      },
      {
        onSuccess: () => {
          toast.success(`${selected.room.number} · ${selected.bed.label} tayinlandi.`);
          onAssigned?.(selected.room.number);
          setSelected(null);
          onClose();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        setSelected(null);
        onClose();
      }}
      title="Yotoq Tayinlash"
      description={
        reservation ? `${reservation.guest.fullName} · Bron: ${reservation.roomTypeName}` : ""
      }
      size="lg"
    >
      <div className="flex flex-col gap-6">
        {reservation && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-brand-50 p-4 border border-brand-100 dark:bg-brand-900/20 dark:border-brand-900/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-900 dark:text-brand-100">
                  Mos keladigan {availableBedsCount} ta bo'sh yotoq bor
                </p>
                <p className="text-xs text-brand-700 dark:text-brand-300">
                  Har bir dormitory xona ichidagi bo'sh yotoqlar ko'rsatilmoqda.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {floors.map(({ floor, rooms: floorRooms }) => (
            <div key={floor} className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-1">
                {floor}-Qavat
              </h3>
              <div className="flex flex-col gap-3">
                {floorRooms.map((room) => {
                  const roomBeds = beds
                    .filter((b) => b.roomId === room.id)
                    .sort((a, b) => a.label.localeCompare(b.label));
                  return (
                    <div key={room.id} className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-zinc-500">
                        Xona {room.number}
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {roomBeds.map((bed) => {
                          const isMatch = bed.status === RoomStatus.VACANT_CLEAN;
                          const isSelected = selected?.bed.id === bed.id;
                          return (
                            <SmartBedOption
                              key={bed.id}
                              bed={bed}
                              isMatch={isMatch}
                              selected={isSelected}
                              onSelect={() => {
                                if (isMatch) setSelected({ room, bed });
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-5">
          <Button variant="outline" onClick={onClose} disabled={assignRoom.isPending}>
            Bekor qilish
          </Button>
          <Button onClick={handleConfirm} disabled={!selected} loading={assignRoom.isPending}>
            {selected ? "Tayinlash" : "Yotoq tanlang"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function SmartBedOption({
  bed,
  isMatch,
  selected,
  onSelect,
}: {
  bed: Bed;
  isMatch: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!isMatch}
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all duration-200",
        selected
          ? "border-brand-500 bg-brand-50 shadow-md ring-1 ring-brand-500 dark:bg-brand-900/40 dark:border-brand-400 dark:ring-brand-400"
          : isMatch
            ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm cursor-pointer dark:bg-emerald-900/10 dark:border-emerald-900/60 dark:hover:bg-emerald-900/20"
            : "border-zinc-100 bg-zinc-50/50 opacity-40 cursor-not-allowed grayscale dark:border-zinc-800 dark:bg-zinc-900/30",
      )}
    >
      {selected && (
        <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
      )}
      <BedSingle
        className={cn(
          "h-4 w-4",
          selected
            ? "text-brand-700 dark:text-brand-300"
            : isMatch
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-zinc-400",
        )}
      />
      <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 line-clamp-1">
        {bed.label}
      </span>
    </button>
  );
}
