import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSession } from "@/lib/auth/session";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookingsListLive } from "@/components/features/account/BookingsListLive";
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
    <BookingsListLive
      initialBookings={bookings}
      statuses={statuses}
      typeLabels={typeLabels}
      viewLabel={dict.bookings.view}
      locale={locale}
    />
  );
}
