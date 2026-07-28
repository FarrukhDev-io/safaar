"use client";

import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../_components/ui/button";
import { Drawer } from "../../../_components/ui/drawer";
import {
  useListing,
  useUpdateListingAmenities,
} from "../../../_hooks/use-listing";
import { useAuthStore } from "../../../_stores/auth-store";
import { isRestaurant } from "../../../_lib/utils/partner-labels";
import { AMENITY_GROUPS, RESTAURANT_AMENITY_GROUPS } from "../../../_lib/domain/listing";
import { cn } from "../../../_lib/utils/cn";

export function AmenitiesEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data } = useListing();
  const updateAmenities = useUpdateListingAmenities();
  const partnerType = useAuthStore((s) => s.user?.partnerType);
  const groups = isRestaurant(partnerType) ? RESTAURANT_AMENITY_GROUPS : AMENITY_GROUPS;
  const selected = new Set(data.amenities);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Qulayliklar"
      description={`${selected.size} ta belgilangan. O'zgarishlar avtomatik saqlanadi.`}
      size="lg"
      footer={
        <Button onClick={onClose}>Yopish</Button>
      }
    >
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.key} className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              {group.label}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.items.map((item) => {
                const isOn = selected.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const next = isOn
                        ? data.amenities.filter((id) => id !== item.id)
                        : [...data.amenities, item.id];
                      updateAmenities.mutate(next, {
                        onError: (error) => {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Qulayliklarni saqlab bo'lmadi",
                          );
                        },
                      });
                    }}
                    disabled={updateAmenities.isPending}
                    aria-pressed={isOn}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all",
                      isOn
                        ? "border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100"
                        : "border-[var(--border)] bg-[var(--surface)] text-zinc-700 hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] dark:text-zinc-300",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                        isOn
                          ? "border-brand-600 bg-brand-600"
                          : "border-zinc-300 dark:border-zinc-600",
                      )}
                    >
                      {isOn && (
                        <Check
                          className="h-3 w-3 text-white"
                          aria-hidden
                          strokeWidth={3}
                        />
                      )}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
}
