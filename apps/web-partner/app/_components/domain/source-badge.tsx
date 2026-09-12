import { Globe, Hotel, Phone, UserPlus } from "lucide-react";
import { ReservationSource } from "../../_lib/domain/types";

const config: Record<
  ReservationSource,
  { label: string; icon: typeof Globe; className: string }
> = {
  [ReservationSource.UZBRON]: {
    label: "Safaar",
    icon: Globe,
    className: "bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
  },
  [ReservationSource.WALK_IN]: {
    label: "Walk-in",
    icon: UserPlus,
    className:
      "bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200",
  },
  [ReservationSource.PHONE]: {
    label: "Telefon",
    icon: Phone,
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  [ReservationSource.BOOKING_COM]: {
    label: "Booking.com",
    icon: Hotel,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200",
  },
};

export function SourceBadge({ source }: { source: ReservationSource }) {
  const c = config[source];
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${c.className}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {c.label}
    </span>
  );
}
