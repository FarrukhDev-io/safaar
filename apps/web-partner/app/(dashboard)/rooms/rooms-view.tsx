"use client";

import { BedDouble, BedSingle, UtensilsCrossed, Users, CarFront } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../../_components/layout/page-header";
import { useBeds } from "../../_hooks/use-beds";
import { useRooms } from "../../_hooks/use-rooms";
import { useRoomTypes } from "../../_hooks/use-room-types";
import { RoomStatus, type Bed, type Room, type RoomType } from "../../_lib/domain/types";
import { RoomDialog } from "../settings/rooms/_dialogs/room-dialog";
import { BedManagementDialog } from "../settings/rooms/_dialogs/bed-management-dialog";
import { Button } from "../../_components/ui/button";
import { formatMoney } from "../../_lib/utils/format";
import { useAuthStore } from "../../_stores/auth-store";
import { useDataStore } from "../../_stores/data-store";
import { getPartnerLabels, hasBeds, hasBuses, isDacha, isRestaurant } from "../../_lib/utils/partner-labels";

export function RoomsView() {
  const router = useRouter();
  const { data: rooms } = useRooms();
  const { data: roomTypes } = useRoomTypes();
  useBeds();
  const beds = useDataStore((s) => s.beds);
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);
  const isHostel = hasBeds(partnerType);
  const isDachaType = isDacha(partnerType);
  const restaurant = isRestaurant(partnerType);
  const isBus = hasBuses(partnerType);

  const [addingRoom, setAddingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [managingBedsFor, setManagingBedsFor] = useState<Room | null>(null);

  useEffect(() => {
    if (isDachaType) router.replace("/listing");
  }, [isDachaType, router]);

  // Qavatlar bo'yicha guruhlash
  const floors = useMemo(() => {
    const map = new Map<number, Room[]>();
    rooms.forEach(room => {
      if (!map.has(room.floor)) {
        map.set(room.floor, []);
      }
      map.get(room.floor)!.push(room);
    });

    // Qavatlarni o'sish tartibida (1, 2, 3...) va xonalarni raqami bo'yicha tartiblash
    const sortedFloors = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([floor, floorRooms]) => {
        return {
          floor,
          rooms: floorRooms.sort((a, b) => a.number.localeCompare(b.number))
        };
      });

    return sortedFloors;
  }, [rooms]);

  if (isDachaType) return null;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow="Operatsion"
          title={labels.unitsPageTitle}
          description={labels.unitsPageDescription}
        />
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setAddingRoom(true)}>
            {isBus ? (
              <CarFront className="mr-2 h-4 w-4" />
            ) : restaurant ? (
              <UtensilsCrossed className="mr-2 h-4 w-4" />
            ) : (
              <BedDouble className="mr-2 h-4 w-4" />
            )}
            {labels.addUnitLabel}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {floors.map(({ floor, rooms }) => (
          <section key={floor} className="flex flex-col gap-4">
            <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {floor}-{labels.floorSingular.charAt(0).toUpperCase()}{labels.floorSingular.slice(1)}
              </h2>
              <span className="text-sm font-medium text-zinc-500">
                {rooms.length} ta {labels.unitSingular}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {rooms.map(room => {
                const roomType = roomTypes.find(t => t.id === room.roomTypeId);
                const roomBeds = isHostel ? beds.filter((b) => b.roomId === room.id) : [];
                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    roomType={roomType}
                    beds={isHostel ? roomBeds : undefined}
                    restaurant={restaurant}
                    isBus={isBus}
                    onEdit={() => setEditingRoom(room)}
                    onManageBeds={isHostel ? () => setManagingBedsFor(room) : undefined}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <RoomDialog
        open={addingRoom}
        onClose={() => setAddingRoom(false)}
        editing={null}
      />

      <RoomDialog
        open={!!editingRoom}
        onClose={() => setEditingRoom(null)}
        editing={editingRoom}
      />

      <BedManagementDialog
        open={!!managingBedsFor}
        onClose={() => setManagingBedsFor(null)}
        room={managingBedsFor}
      />
    </div>
  );
}

function RoomCard({
  room,
  roomType,
  beds,
  restaurant,
  isBus,
  onEdit,
  onManageBeds,
}: {
  room: Room;
  roomType?: RoomType;
  beds?: Bed[];
  restaurant: boolean;
  isBus?: boolean;
  onEdit: () => void;
  onManageBeds?: () => void;
}) {
  const freeBeds = beds?.filter((b) => b.status === RoomStatus.VACANT_CLEAN).length ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit();
      }}
      className="relative flex h-full w-full cursor-pointer flex-col rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 dark:border-zinc-800 dark:bg-[var(--surface-muted)]"
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl font-bold text-zinc-900 dark:text-white">
          {room.number}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
          {isBus ? (
            <CarFront className="h-4 w-4" />
          ) : restaurant ? (
            <UtensilsCrossed className="h-4 w-4" />
          ) : (
            <BedDouble className="h-4 w-4" />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">
          {room.roomTypeName}
        </span>

        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {roomType?.capacity || "?"} {isBus ? "o'rindiq" : "kishi"}
          </span>
          {roomType?.bedType && (
            <span className="flex items-center gap-1 text-zinc-400">
              · {roomType.bedType}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
        {!restaurant && (
          <div>
            <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
              {isBus ? "1 chiptaga:" : "1 kechaga:"}
            </span>
            <div className="font-semibold text-brand-700 dark:text-brand-300 mt-0.5">
              {roomType ? formatMoney(roomType.basePrice) : "—"}
            </div>
          </div>
        )}

        {beds && onManageBeds && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManageBeds();
            }}
            className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-[var(--surface-muted)] dark:text-zinc-300"
          >
            <BedSingle className="h-3 w-3" aria-hidden />
            {freeBeds}/{beds.length} bo'sh
          </button>
        )}
      </div>
    </div>
  );
}
