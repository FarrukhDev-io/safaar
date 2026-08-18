"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "../../../../_components/ui/button";
import { Dialog } from "../../../../_components/ui/dialog";
import { Input } from "../../../../_components/ui/input";
import { Label } from "../../../../_components/ui/label";
import Link from "next/link";
import { useAuthStore } from "../../../../_stores/auth-store";
import {
  useCreateRoom,
  useDeleteRoom,
  useRooms,
  useUpdateRoom,
} from "../../../../_hooks/use-rooms";
import { useRoomTypes, useCreateRoomType, useUpdateRoomType } from "../../../../_hooks/use-room-types";
import { useGenerateBeds } from "../../../../_hooks/use-beds";
import { RoomStatus, type Room } from "../../../../_lib/domain/types";
import { roomStatusLabel } from "../../../../_components/domain/room-status-badge";
import { getPartnerLabels, hasBeds, hasBuses, isRestaurant } from "../../../../_lib/utils/partner-labels";

const schema = z.object({
  number: z.string().min(1, "Raqam/nomini kiriting"),
  floor: z.number().int().min(1).max(50),
  capacity: z.number().int().min(1).max(50, "Sig'imni kiriting"),
  basePrice: z.number().int().min(0).optional(),
  status: z.enum(RoomStatus),
  isListed: z.boolean(),
});

const roomStatusOptions = Object.values(RoomStatus);

type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Room | null;
}

export function RoomDialog({ open, onClose, editing }: Props) {
  const { data: roomTypes } = useRoomTypes();
  const { data: rooms, allRooms } = useRooms();
  const createRoomType = useCreateRoomType();
  const updateRoomType = useUpdateRoomType();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const generateBeds = useGenerateBeds();
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const isHostel = hasBeds(partnerType);
  const isBus = hasBuses(partnerType);
  const restaurant = isRestaurant(partnerType);
  const labels = getPartnerLabels(partnerType);
  const unitCap = labels.unitSingular.charAt(0).toUpperCase() + labels.unitSingular.slice(1);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      number: "",
      floor: 1,
      capacity: 2,
      basePrice: restaurant ? 0 : undefined,
      status: RoomStatus.VACANT_CLEAN,
      isListed: true,
    },
  });

  useEffect(() => {
    if (open) {
      const rt = roomTypes.find((r) => r.id === editing?.roomTypeId);
      form.reset(
        editing
          ? {
              number: editing.number,
              floor: editing.floor,
              capacity: rt?.capacity ?? 2,
              basePrice: rt?.basePrice ?? 0,
              status: editing.status,
              isListed: editing.isListed,
            }
          : {
              number: "",
              floor: 1,
              capacity: 2,
              basePrice: restaurant ? 0 : undefined,
              status: RoomStatus.VACANT_CLEAN,
              isListed: true,
            },
      );
    }
  }, [open, editing, form, roomTypes]);

  const onSubmit = form.handleSubmit(async (values) => {
    // Check for duplicates in active rooms
    const activeDuplicate = rooms.find(
      (room) => room.number === values.number && room.id !== editing?.id,
    );
    if (activeDuplicate) {
      toast.error(`${unitCap} ${values.number} allaqachon mavjud.`);
      return;
    }

    // Check for soft-deleted room with same number
    const inactiveDuplicate = !editing 
      ? allRooms.find(r => r.number === values.number && (r as any)._rawStatus === 'inactive')
      : undefined;

    try {
      let finalRoomTypeId = editing?.roomTypeId;

      if (!restaurant && values.basePrice === undefined) {
        toast.error("Narxni kiriting");
        return;
      }

      if (editing && finalRoomTypeId) {
        // Update existing room type
        await updateRoomType.mutateAsync({
          id: finalRoomTypeId,
          values: {
            name: `${unitCap} ${values.number}`,
            capacity: values.capacity,
            basePrice: values.basePrice ?? 0,
            amenities: roomTypes.find(r => r.id === finalRoomTypeId)?.amenities ?? [],
          },
        });
      } else {
        // Create new room type
        const newRoomType = await createRoomType.mutateAsync({
          name: restaurant ? `${values.capacity} kishilik stol` : `${unitCap} ${values.number}`,
          capacity: values.capacity,
          basePrice: values.basePrice ?? 0,
          amenities: [],
        });
        finalRoomTypeId = newRoomType.id;
      }

      const submitValues = {
        number: values.number,
        floor: values.floor,
        status: values.status,
        isListed: values.isListed,
        roomTypeId: finalRoomTypeId!,
      };

      if (editing) {
        await updateRoom.mutateAsync({ id: editing.id, values: submitValues });
        toast.success(`${unitCap} ${values.number} yangilandi`);
      } else if (inactiveDuplicate) {
        await updateRoom.mutateAsync({ id: inactiveDuplicate.id, values: submitValues });
        if (isHostel) {
          await generateBeds.mutateAsync({
            roomId: inactiveDuplicate.id,
            count: values.capacity,
          });
        }
        toast.success(`${unitCap} ${values.number} tiklandi va qo'shildi`);
      } else {
        const created = await createRoom.mutateAsync(submitValues as any);
        if (isHostel) {
          await generateBeds.mutateAsync({
            roomId: created.id,
            count: values.capacity,
          });
        }
        toast.success(`${unitCap} ${values.number} qo'shildi`);
      }
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Xonani saqlab bo'lmadi",
      );
    }
  });

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm(`Rostdan ham ${labels.unitSingular} ${editing.number} ni o'chirmoqchimisiz?`)) return;
    try {
      await deleteRoom.mutateAsync(editing.id);
      toast.success(`${unitCap} ${editing.number} o'chirildi.`);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "O'chirib bo'lmadi",
      );
    }
  };

  const submitting =
    createRoom.isPending ||
    updateRoom.isPending ||
    deleteRoom.isPending ||
    generateBeds.isPending;

  const err = form.formState.errors;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? `${unitCap} ${editing.number}` : `Yangi ${labels.unitSingular}`}
      description={
        editing
          ? `${unitCap} ma'lumotlarini tahrirlash`
          : isHostel
            ? "Yotoqlar soni tanlangan xona turining sig'imiga qarab avtomatik yaratiladi."
            : `Ro'yxatingizga yangi ${labels.unitSingular} qo'shish`
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="r-number">{labels.unitIdentifierLabel}</Label>
            <Input
              id="r-number"
              placeholder={labels.unitIdentifierPlaceholder}
              aria-invalid={Boolean(err.number)}
              {...form.register("number")}
            />
            {err.number && (
              <p className="text-xs text-red-600">{err.number.message}</p>
            )}
          </div>
          {!isBus && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-floor">{labels.floorSingular.charAt(0).toUpperCase() + labels.floorSingular.slice(1)}</Label>
              <Input
                id="r-floor"
                type="number"
                min={1}
                max={50}
                {...form.register("floor", { valueAsNumber: true })}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="r-capacity">Sig'imi (necha kishilik)</Label>
            <Input
              id="r-capacity"
              type="number"
              min={1}
              max={50}
              placeholder="Masalan: 2"
              aria-invalid={Boolean(err.capacity)}
              {...form.register("capacity", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined
                    ? undefined
                    : Number(v),
              })}
            />
            {err.capacity && (
              <p className="text-xs text-red-600">{err.capacity.message}</p>
            )}
          </div>

          {editing && !isHostel && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-status">{labels.unitStatusLabel}</Label>
              <select
                id="r-status"
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:border-brand-600 focus:outline-none"
                {...form.register("status")}
              >
                {roomStatusOptions.map((s) => (
                  <option key={s} value={s}>
                    {roomStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!restaurant && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="r-price">Narxi (1 kecha uchun)</Label>
              <Input
                id="r-price"
                type="number"
                min={0}
                placeholder="Masalan: 400000"
                aria-invalid={Boolean(err.basePrice)}
                {...form.register("basePrice", {
                  setValueAs: (v) =>
                    v === "" || v === null || v === undefined
                      ? undefined
                      : Number(v),
                })}
              />
              {err.basePrice && (
                <p className="text-xs text-red-600">{err.basePrice.message}</p>
              )}
            </div>
          )}

          <label
            htmlFor="r-listed"
            className="flex items-center gap-2 sm:col-span-2 cursor-pointer select-none"
          >
            <input
              id="r-listed"
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--border)] accent-brand-700"
              {...form.register("isListed")}
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Sotuvda ko&apos;rsatilsin (mijozlarga ko&apos;rinadi)
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
          {editing ? (
            <Button
              type="button"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={handleDelete}
              disabled={submitting}
            >
              O&apos;chirish
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {editing ? "Saqlash" : "Qo'shish"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
