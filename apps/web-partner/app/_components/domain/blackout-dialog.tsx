"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { TODAY_ISO } from "../../_lib/utils/date";
import { useAuthStore } from "../../_stores/auth-store";
import { useRooms } from "../../_hooks/use-rooms";
import { getPartnerLabels, isDacha } from "../../_lib/utils/partner-labels";
import { blackoutDates } from "../../_lib/api/endpoints/partners";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  roomNumber: z.string().min(1, "Xonani tanlang"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface BlackoutDialogProps {
  open: boolean;
  onClose: () => void;
  hotelId: string | undefined;
}

export function BlackoutDialog({ open, onClose, hotelId }: BlackoutDialogProps) {
  const { data: rooms } = useRooms();
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);
  const unitCap = labels.unitSingular.charAt(0).toUpperCase() + labels.unitSingular.slice(1);
  const dacha = isDacha(partnerType);
  
  const queryClient = useQueryClient();
  
  const defaultCheckIn = TODAY_ISO;
  const dachaRoom = dacha ? rooms[0] : undefined;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      roomNumber: dachaRoom?.number ?? "",
      startDate: defaultCheckIn,
      endDate: defaultCheckIn,
      reason: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        roomNumber: dachaRoom?.number ?? "",
        startDate: defaultCheckIn,
        endDate: defaultCheckIn,
        reason: "",
      });
    }
  }, [open, dachaRoom, form, defaultCheckIn]);

  const mutation = useMutation({
    mutationFn: async (values: Values) => {
      if (!hotelId) throw new Error("Hotel ID mavjud emas");
      await blackoutDates(hotelId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Inventar muvaffaqiyatli yopildi");
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi");
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    if (new Date(values.endDate).getTime() < new Date(values.startDate).getTime()) {
      toast.error("Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas");
      return;
    }
    mutation.mutate(values);
  });

  const err = form.formState.errors;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Inventarni yopish (Blackout)"
      description="Ta'mirlash yoki boshqa sabablarga ko'ra sotuvni vaqtincha to'xtatish."
      size="sm"
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        {!dacha && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="roomNumber">{unitCap}</Label>
            <select
              id="roomNumber"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:border-brand-600 focus:outline-none"
              {...form.register("roomNumber")}
            >
              <option value="">{unitCap}ni tanlang</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.number}>
                  {r.number} {r.roomTypeName ? `(${r.roomTypeName})` : ''}
                </option>
              ))}
            </select>
            {err.roomNumber && <p className="text-xs text-red-600">{err.roomNumber.message}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">Boshlanish</Label>
            <Input id="startDate" type="date" {...form.register("startDate")} />
            {err.startDate && <p className="text-xs text-red-600">{err.startDate.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endDate">Tugash</Label>
            <Input id="endDate" type="date" {...form.register("endDate")} />
            {err.endDate && <p className="text-xs text-red-600">{err.endDate.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reason">Sabab (ixtiyoriy)</Label>
          <Input id="reason" placeholder="Masalan: Ta'mirlash ishlari" {...form.register("reason")} />
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4 mt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            loading={mutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Sotuvni to'xtatish
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
