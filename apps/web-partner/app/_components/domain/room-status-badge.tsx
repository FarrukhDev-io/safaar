import { RoomStatus } from "../../_lib/domain/types";
import { cn } from "../../_lib/utils/cn";

const labels: Record<RoomStatus, string> = {
  [RoomStatus.VACANT_CLEAN]: "Bo'sh & Tayyor",
  [RoomStatus.VACANT_DIRTY]: "Tozalanmoqda",
  [RoomStatus.OCCUPIED]: "Band",
  [RoomStatus.OUT_OF_SERVICE]: "Ta'mirda",
  [RoomStatus.BLOCKED]: "Bloklangan",
};

const classes: Record<RoomStatus, string> = {
  [RoomStatus.VACANT_CLEAN]:
    "bg-accent-100 text-accent-700 ring-accent-200/60",
  [RoomStatus.VACANT_DIRTY]: "bg-amber-100 text-amber-800 ring-amber-200/60",
  [RoomStatus.OCCUPIED]: "bg-brand-100 text-brand-800 ring-brand-200/60",
  [RoomStatus.OUT_OF_SERVICE]: "bg-red-100 text-red-800 ring-red-200/60",
  [RoomStatus.BLOCKED]: "bg-zinc-200 text-zinc-700 ring-zinc-300/60",
};

export function RoomStatusBadge({
  status,
  className,
}: {
  status: RoomStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        classes[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}

export const roomStatusLabel = (s: RoomStatus) => labels[s];
