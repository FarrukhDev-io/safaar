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
import { useAuthStore } from "../../../../_stores/auth-store";
import {
  useCreateRoom,
  useDeleteRoom,
  useRooms,
  useUpdateRoom,
} from "../../../../_hooks/use-rooms";
import { useRoomTypes } from "../../../../_hooks/use-room-types";
import { useGenerateBeds } from "../../../../_hooks/use-beds";
import { RoomStatus, type Room } from "../../../../_lib/domain/types";
import { roomStatusLabel } from "../../../../_components/domain/room-status-badge";
import { getPartnerLabels, hasBeds } from "../../../../_lib/utils/partner-labels";

const schema = z.object({
  number: z
    .string()
    .min(1, "Raqamni kiriting")
    .regex(/^[0-9]+$/, "Faqat raqamlar"),
  floor: z.number().int().min(1).max(50),
  roomTypeId: z.string().min(1, "Turini tanlang"),
  status: z.enum(RoomStatus),
  isListed: z.boolean(),
  nightlyPrice: z.number().int().positive().optional(),
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
  const { data: rooms } = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const generateBeds = useGenerateBeds();
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const isHostel = hasBeds(partnerType);
  const labels = getPartnerLabels(partnerType);
  const unitCap = labels.unitSingular.charAt(0).toUpperCase() + labels.unitSingular.slice(1);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      number: "",
      floor: 1,
      roomTypeId: roomTypes[0]?.id ?? "",
      status: RoomStatus.VACANT_CLEAN,
      isListed: true,
      nightlyPrice: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              number: editing.number,
              floor: editing.floor,
              roomTypeId: editing.roomTypeId,
              status: editing.status,
              isListed: editing.isListed,
              nightlyPrice: editing.nightlyPrice,
            }
          : {
              number: "",
              floor: 1,
              roomTypeId: roomTypes[0]?.id ?? "",
              status: RoomStatus.VACANT_CLEAN,
              isListed: true,
              nightlyPrice: undefined,
            },
      );
    }
  }, [open, editing, form, roomTypes]);

  const onSubmit = form.handleSubmit(async (values) => {
    const duplicate = rooms.some(
      (room) => room.number === values.number && room.id !== editing?.id,
    );
    if (duplicate) {
      toast.error(`${unitCap} ${values.number} allaqachon mavjud.`);
      return;
    }
    try {
      if (editing) {
        await updateRoom.mutateAsync({ id: editing.id, values });
        toast.success(`${unitCap} ${values.number} yangilandi`);
      } else {
        const created = await createRoom.mutateAsync(values);
        if (isHostel) {
          const roomType = roomTypes.find((rt) => rt.id === values.roomTypeId);
          await generateBeds.mutateAsync({
            roomId: created.id,
            count: roomType?.capacity ?? 1,
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
  const selectedRoomTypeId = useWatch({ control: form.control, name: "roomTypeId" });
  const selectedRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId);

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
            <Label htmlFor="r-number">{unitCap} raqami</Label>
            <Input
              id="r-number"
              placeholder="101"
              inputMode="numeric"
              aria-invalid={Boolean(err.number)}
              {...form.register("number")}
            />
            {err.number && (
              <p className="text-xs text-red-600">{err.number.message}</p>
            )}
          </div>

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

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="r-type">{labels.unitTypeLabel}</Label>
            <select
              id="r-type"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:border-brand-600 focus:outline-none"
              {...form.register("roomTypeId")}
            >
              {roomTypes.length === 0 ? (
                <option value="">{`Avval ${labels.unitTypeLabel.toLowerCase()}ni yarating`}</option>
              ) : (
                roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} — {rt.basePrice.toLocaleString("uz-UZ")} so&apos;m
                  </option>
                ))
              )}
            </select>
            {err.roomTypeId && (
              <p className="text-xs text-red-600">{err.roomTypeId.message}</p>
            )}
          </div>

          {editing && !isHostel && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-status">{unitCap} holati</Label>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="r-price">
              Maxsus narx <span className="text-[var(--muted-foreground)]">(ixtiyoriy)</span>
            </Label>
            <Input
              id="r-price"
              type="number"
              min={0}
              placeholder={
                selectedRoomType
                  ? `${selectedRoomType.basePrice.toLocaleString("uz-UZ")} so'm (${labels.unitTypeLabel.toLowerCase()} narxi)`
                  : `${labels.unitTypeLabel} narxi ishlatiladi`
              }
              aria-invalid={Boolean(err.nightlyPrice)}
              {...form.register("nightlyPrice", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined
                    ? undefined
                    : Number(v),
              })}
            />
            {err.nightlyPrice && (
              <p className="text-xs text-red-600">{err.nightlyPrice.message}</p>
            )}
          </div>

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
              disabled={roomTypes.length === 0 || submitting}
            >
              {editing ? "Saqlash" : "Qo'shish"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
