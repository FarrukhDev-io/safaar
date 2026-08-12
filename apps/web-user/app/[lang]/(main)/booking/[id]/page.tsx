import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { getSession } from '@/lib/auth/session';
import { api, ApiRequestError } from '@/lib/api';
import { formatSum } from '@/lib/money';
import { BackButton } from '@/components/ui/BackButton';
import { RetryPaymentForm } from './_components/RetryPaymentForm';
import { BookingActions } from './_components/BookingActions';
import { BookingChat } from './_components/BookingChat';
import type { BookingView } from '@/types/view';
import type { PaymentProvider } from '@/lib/services/payments/payments';

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function getBookingOrNull(id: string, token?: string) {
  try {
    return await api.bookings.getBooking(id, token ? { token } : undefined);
  } catch (error) {
    if (error instanceof ApiRequestError && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const sp = await searchParams;

  const providerQuery = one(sp.provider);

  const [dict, session] = await Promise.all([
    getDictionary(locale, 'booking'),
    getSession(),
  ]);

  const booking: BookingView | null = await getBookingOrNull(
    id,
    session?.accessToken,
  );

  if (!booking) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          {dict.error}
        </p>
      </main>
    );
  }

  const statuses = dict.statuses as Record<string, string>;
  const paymentStatuses = dict.paymentStatuses as Record<string, string>;
  // Backend `booking.status`ni har doim kichik harfda qaytaradi
  // (masalan "confirmed", "pending"), lekin lug'at kalitlari katta
  // harfda yozilgan ("CONFIRMED", "PENDING") — bu ikkalasi hech qachon
  // mos kelmas, va foydalanuvchi doim tarjima qilinmagan xom inglizcha
  // so'zni ko'rardi.
  const statusKey = booking.status.toUpperCase();
  const statusLabel = statuses[statusKey] ?? booking.status;
  const payment = booking.payment;

  // MUHIM: bu yerda faqat backend'dan kelgan HAQIQIY holat (booking.status,
  // payment.status) ishlatiladi — URL query parametrlariga (`?status=...`,
  // `?payment=...`) hech qanday ishonch YO'Q, chunki ularni foydalanuvchi
  // manzil satrida qo'lda o'zgartirib, to'lov muvaffaqiyatli bo'lmagan
  // holatda ham "tasdiqlandi" degan xabarni ko'rsatishga majburlashi
  // mumkin edi.
  const isConfirmed =
    booking.status === 'confirmed' ||
    booking.status === 'awaiting_partner_confirmation' ||
    payment?.status === 'paid';

  const isFailed = payment?.status === 'failed';
  const isAwaitingCash = payment?.status === 'awaiting_cash';

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <BackButton className="fixed left-4 top-16 z-50 md:left-8 md:top-20" />

      {isConfirmed ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-100 sm:text-2xl">
              Broningiz muvaffaqiyatli tasdiqlandi!
            </h1>
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Tafsilotlar va vaucher ma'lumotlari shaxsiy kabinetingizda
            saqlanadi.
          </p>
        </div>
      ) : isFailed ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50/80 p-6 shadow-sm dark:border-red-900/50 dark:bg-red-950/40">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 shrink-0 text-red-600 dark:text-red-400" />
            <h1 className="text-xl font-extrabold tracking-tight text-red-950 dark:text-red-100 sm:text-2xl">
              To'lov tranzaksiyasi amalga oshmadi
            </h1>
          </div>
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Tranzaksiya bekor qilindi yoki xatolik yuz berdi. Quyida to'lov
            usulini qayta tanlab urinib ko'rishingiz mumkin.
          </p>
        </div>
      ) : isAwaitingCash ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-6 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 shrink-0 text-amber-600 dark:text-amber-400" />
            <h1 className="text-xl font-extrabold tracking-tight text-amber-950 dark:text-amber-100 sm:text-2xl">
              Joyida to'lash usuli tanlandi
            </h1>
          </div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Joyingiz band qilindi. To'lov mehmonxonaga kelganda qabulxonada
            amalga oshiriladi.
          </p>
        </div>
      ) : (
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {dict.title}
        </h1>
      )}

      <section
        aria-label="Receipt Summary"
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Kvitansiya xulosasi
          </span>
          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-800 dark:bg-primary-950 dark:text-primary-300">
            {statusLabel}
          </span>
        </div>

        <Row label={dict.number} value={booking.bookingNumber || id} />

        {booking.createdAt && (
          <Row label="Yaratilgan sana">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {new Date(booking.createdAt).toLocaleString(locale)}
            </span>
          </Row>
        )}

        <Row label={dict.total} value={formatSum(booking.totalSum)} />

        {payment && (
          <Row label={dict.payment}>
            <span className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
              {payment.provider ? `${payment.provider.toUpperCase()} · ` : ''}
              {paymentStatuses[payment.status] ?? payment.status}
            </span>
          </Row>
        )}
      </section>

      {(!isConfirmed && !isAwaitingCash) || isFailed ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-card p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              To'lov usulini tanlang
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Payme, Click, Uzcard/Humo yoki joyida to'lash usullari orqali
            to'lovni amalga oshiring.
          </p>

          <RetryPaymentForm
            bookingId={booking.id}
            locale={locale}
            initialProvider={(providerQuery as PaymentProvider) ?? 'click'}
          />
        </section>
      ) : null}

      <BookingActions
        locale={locale}
        isConfirmed={isConfirmed}
        bookingId={booking.id}
        totalSum={booking.totalSum}
        paymentMethod={payment?.provider || 'online'}
        token={session?.accessToken}
        dict={{
          voucher: dict.voucher,
          backHome: dict.backHome,
        }}
      />

      <section className="mt-8">
        <BookingChat bookingId={booking.id} token={session?.accessToken} />
      </section>
    </main>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children ?? (
        <span className="font-semibold text-slate-900 dark:text-white">
          {value}
        </span>
      )}
    </div>
  );
}
