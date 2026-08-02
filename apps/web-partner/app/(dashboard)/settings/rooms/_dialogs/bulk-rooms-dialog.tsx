"use client";

import { Info, Sparkles } from "lucide-react";
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
import { useBulkCreateRooms } from "../../../../_hooks/use-rooms";
import { useRoomTypes } from "../../../../_hooks/use-room-types";
import { useGenerateBeds } from "../../../../_hooks/use-beds";
import { getPartnerLabels, hasBeds } from "../../../../_lib/utils/partner-labels";

const schema = z.object({
  floor: z.number().int().min(1).max(50),
  startNumber: z.number().int().min(1).max(9999),
  count: z.number().int().min(1).max(200),
  roomTypeId: z.string().min(1, "Xona turini tanlang"),
});

type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BulkRoomsDialog({ open, onClose }: Props) {
  const { data: roomTypes } = useRoomTypes();
  const bulkCreateRooms = useBulkCreateRooms();
  const generateBeds = useGenerateBeds();
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      floor: 1,
      startNumber: 101,
      count: 10,
      roomTypeId: roomTypes[0]?.id ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        floor: 1,
        startNumber: 101,
        count: 10,
        roomTypeId: roomTypes[0]?.id ?? "",
      });
    }
  }, [open, form, roomTypes]);

  const values = useWatch({ control: form.control });
  const count = values.count ?? 0;
  const start = values.startNumber ?? 0;
  const previewNumbers = Array.from(
    { length: Math.min(count, 5) },
    (_, i) => start + i,
  );
  const showEllipsis = count > 5;
  const lastNumber = start + count - 1;

  const onSubmit = form.handleSubmit(async (v) => {
    const roomType = roomTypes.find((rt) => rt.id === v.roomTypeId);
    if (!roomType) {
      toast.error(`${labels.unitTypeLabel} topilmadi`);
      return;
    }
    try {
      const result = await bulkCreateRooms.mutateAsync({
        ...v,
        basePrice: roomType.basePrice,
        capacity: roomType.capacity,
      });
      if (!result.ok && result.added === 0) {
        toast.error(result.reason ?? "Xato yuz berdi");
        return;
      }
      if (hasBeds(partnerType)) {
        await Promise.all(
          result.rooms.map((room) =>
            generateBeds.mutateAsync({
              roomId: room.id,
              count: roomType.capacity,
            }),
          ),
        );
      }
      toast.success(`${result.added} ta ${labels.unitSingular} qo'shildi`);
      if (result.reason) {
        toast.warning(result.reason);
      }
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Xonalarni yaratib bo'lmadi",
      );
    }
  });

  const err = form.formState.errors;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Ko'p ${labels.unitSingular}ni birdaniga qo'shish`}
      description={`Bir ${labels.floorSingular}dagi ketma-ket ${labels.unitPlural}ni tez yaratish.`}
      size="lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-floor">
              {labels.floorSingular.charAt(0).toUpperCase()}{labels.floorSingular.slice(1)}
            </Label>
            <Input
              id="bulk-floor"
              type="number"
              min={1}
              max={50}
              {...form.register("floor", { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-start">Boshlanish raqami</Label>
            <Input
              id="bulk-start"
              type="number"
              min={1}
              max={9999}
              placeholder="101"
              {...form.register("startNumber", { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-count">Soni</Label>
            <Input
              id="bulk-count"
              type="number"
              min={1}
              max={200}
              {...form.register("count", { valueAsNumber: true })}
            />
            {err.count && (
              <p className="text-xs text-red-600">{err.count.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bulk-type">{labels.unitTypeLabel}</Label>
          <select
            id="bulk-type"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:border-brand-600 focus:outline-none"
            {...form.register("roomTypeId")}
          >
            {roomTypes.length === 0 ? (
              <option value="">Avval {labels.unitTypeLabel.toLowerCase()}ni yarating</option>
            ) : (
              roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} — {rt.basePrice.toLocaleString("uz-UZ")} so&apos;m
                </option>
              ))
            )}
          </select>
        </div>

        {/* Preview */}
        <div className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm dark:border-brand-900/50 dark:bg-brand-950/30">
          <Sparkles
            className="mt-0.5 h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300"
            aria-hidden
          />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-brand-900 dark:text-brand-100">
              Yaratiladigan {labels.unitPlural}
            </p>
            <p className="text-brand-800 dark:text-brand-200">
              {previewNumbers.join(", ")}
              {showEllipsis && ", ..., "}
              {showEllipsis && lastNumber}
              {" — jami "}
              <strong>{values.count || 0} ta {labels.unitSingular}</strong>
            </p>
          </div>
        </div>

        {/* Conflict warning */}
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p>
            Agar ba'zi raqamlar mavjud bo'lsa — ular avtomatik o'tkazib
            yuboriladi. Holat: barcha yangi {labels.unitPlural} "Toza & bo'sh".
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            type="submit"
            disabled={
              roomTypes.length === 0 ||
              bulkCreateRooms.isPending ||
              generateBeds.isPending
            }
          >
            Yaratish
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
