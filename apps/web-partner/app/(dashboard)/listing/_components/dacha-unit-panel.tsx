"use client";

import { Home, Pencil, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../_components/ui/button";
import { Card, CardBody } from "../../../_components/ui/card";
import { RoomDialog } from "../../settings/rooms/_dialogs/room-dialog";
import { RoomTypeDialog } from "../../settings/rooms/_dialogs/room-type-dialog";
import { useRooms } from "../../../_hooks/use-rooms";
import { useRoomTypes } from "../../../_hooks/use-room-types";
import { formatMoney } from "../../../_lib/utils/format";

/** Dacha uchun: xona turi/xona CRUD o'rniga bitta soddalashtirilgan birlik kartasi. */
export function DachaUnitPanel({ listingName }: { listingName: string }) {
  const { data: roomTypes } = useRoomTypes();
  const { data: rooms } = useRooms();
  const roomType = roomTypes[0];
  const room = rooms[0];
  const [editing, setEditing] = useState(false);
  const [addingRoom, setAddingRoom] = useState(false);

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-300">
            Dacha ma'lumotlari
          </span>
          <h2 className="mt-1 text-xl font-semibold">Narx va sig'im</h2>
        </div>

        {roomType ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
              <Home className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold">{roomType.name}</p>
              <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {roomType.capacity} kishigacha
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--muted-foreground)]">1 kechaga</p>
            <p className="text-base font-semibold text-brand-700 dark:text-brand-300">
              {formatMoney(roomType.basePrice)}
            </p>
          </div>
          <div className="flex gap-2">
            {!room && (
              <Button variant="outline" size="sm" onClick={() => setAddingRoom(true)}>
                <Home className="h-4 w-4" aria-hidden />
                Birlik yaratish
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Tahrirlash
            </Button>
          </div>
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              {listingName || "Dacha"} uchun narx va sig'im hali kiritilmagan.
            </p>
            <Button className="mt-3" size="sm" onClick={() => setEditing(true)}>
              <Home className="h-4 w-4" aria-hidden />
              Narx va sig'im kiritish
            </Button>
          </div>
        )}
      </CardBody>

      <RoomTypeDialog open={editing} onClose={() => setEditing(false)} editing={roomType} />
      <RoomDialog open={addingRoom} onClose={() => setAddingRoom(false)} editing={null} />
    </Card>
  );
}
