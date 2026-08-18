"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../_components/ui/button";
import { Dialog } from "../../../_components/ui/dialog";
import { useRooms, useUpdateRoom } from "../../../_hooks/use-rooms";
import { toast } from "sonner";
import { getPartnerLabels } from "../../../_lib/utils/partner-labels";
import { useAuthStore } from "../../../_stores/auth-store";

export function PublishRoomsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const labels = getPartnerLabels(partnerType);
  
  const { data: rooms } = useRooms();
  const updateRoom = useUpdateRoom();
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && rooms) {
      const initial = new Set<string>();
      rooms.forEach(r => {
        if (r.isListed) initial.add(r.id);
      });
      setSelectedIds(initial);
    }
  }, [open, rooms]);

  const handleSave = async () => {
    if (!rooms) return;
    setIsSaving(true);
    try {
      const promises = rooms.map(room => {
        const shouldBeListed = selectedIds.has(room.id);
        if (room.isListed !== shouldBeListed) {
          return updateRoom.mutateAsync({
            id: room.id,
            values: { ...room, isListed: shouldBeListed },
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      toast.success("E'longa chiqarish muvaffaqiyatli saqlandi");
      onClose();
    } catch (err) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      title={`${labels.unitPlural}ni e'longa chiqarish`}
      description={`Qaysi ${labels.unitPlural.toLowerCase()}ni turistlarga ko'rsatishni tanlang. Ro'yxatda faqat "Xonalar" bo'limida yaratilganlari chiqadi.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Bekor
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            Saqlash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {!rooms || rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Hali hech qanday {labels.unitSingular.toLowerCase()} yaratilmagan. Avval chap paneldagi "Xonalar" bo'limidan qo'shing.
          </p>
        ) : (
          rooms.map((room) => (
            <label
              key={room.id}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--border)] p-4 transition-colors hover:bg-[var(--surface-hover)]"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{labels.unitSingular} {room.number}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{room.roomTypeName}</span>
              </div>
              <input 
                type="checkbox"
                className="h-4 w-4"
                checked={selectedIds.has(room.id)}
                onChange={() => toggle(room.id)}
              />
            </label>
          ))
        )}
      </div>
    </Dialog>
  );
}
