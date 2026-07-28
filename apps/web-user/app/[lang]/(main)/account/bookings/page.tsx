import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSession } from "@/lib/auth/session";
import { api } from "@/lib/api";
import { formatSum } from "@/lib/money";
import { bookingStatusTone, statusBadgeClasses } from "@/lib/bookingStatus";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarX } from "lucide-react";
import type { BookingView } from "@/types/view";

export default async function AccountBookingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  // SENIOR OPTIMIZATION: Parallelize session & dictionary loading
  const [session, dict] = await Promise.all([
    getSession(),
    getDictionary(locale, "account"),
  ]);

  if (!session) {
    redirect(
      `/${locale}/login?next=${encodeURIComponent(`/${locale}/account/bookings`)}`,
    );
  }

  const bookings: BookingView[] = await api.users.getMyBookings({ token: session.accessToken });

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<CalendarX className="h-10 w-10 text-slate-400 dark:text-slate-500" />}
        title={dict.bookings.empty}
        description="Sizda hali tasdiqlangan bronlar mavjud emas. Toshkent, Samarqand yoki Buxorodagi ajoyib mehmonxonalardan birini band qiling!"
        actionLabel="Mehmonxonalarni ko'rish"
        actionHref={`/${locale}/hotels`}
      />
    );
  }

  const statuses = dict.bookings.statuses as Record<string, string>;
  const typeLabels: Record<string, string> = {
    hotel: dict.bookings.hotel,
  };

  return (
    <ul className="flex flex-col gap-4">
      {bookings.map((booking) => {
        const statusLabel = statuses[booking.status] ?? booking.status;
        const typeLabel = typeLabels[booking.type] ?? booking.type;
        const tone = bookingStatusTone(booking.status);
        return (
          <li key={booking.id}>
            <Card>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {booking.bookingNumber}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {typeLabel}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[tone]}`}
                    >
                      {statusLabel}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatSum(booking.totalSum)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/${locale}/booking/${booking.id}`}
                  className="shrink-0"
                >
                  <Button variant="secondary">{dict.bookings.view}</Button>
                </Link>
              </CardBody>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
