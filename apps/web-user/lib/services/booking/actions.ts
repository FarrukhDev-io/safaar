'use server';

import { redirect } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { clearSession, getSession } from '@/lib/auth/session';
import { defaultLocale, isLocale } from '@/i18n/config';

const SESSION_EXPIRED_CODES = new Set([
  'AUTH_TOKEN_INVALID',
  'AUTH_SESSION_REVOKED',
]);

async function redirectToLoginIfSessionExpired(
  error: unknown,
  locale: string,
): Promise<void> {
  if (
    error instanceof ApiRequestError &&
    (error.statusCode === 401 ||
      (error.code && SESSION_EXPIRED_CODES.has(error.code)))
  ) {
    await clearSession();
    redirect(`/${locale}/login?next=/${locale}/booking&reason=session_expired`);
  }
}

/**
 * `GET /bookings/:id` login talab qiladi (IDOR himoyasi) — guest (login
 * qilmagan) mijoz o'zi yaratgan bronni ko'ra olmaydi, faqat bron raqami +
 * email orqali (`lookupBooking`). Shuning uchun guest checkout'dan keyingi
 * yo'naltirishga shu ikkalasi query param sifatida qo'shiladi — tasdiqlash
 * sahifasi buni ko'rib, `getBooking` o'rniga `lookupBooking` chaqiradi.
 */
function guestConfirmationQuery(
  isGuest: boolean,
  bookingNumber: string,
  email?: string,
): string {
  if (!isGuest || !bookingNumber || !email) return '';
  return `&bn=${encodeURIComponent(bookingNumber)}&ge=${encodeURIComponent(email)}`;
}

export interface CheckoutState {
  error?: string;
}

export async function createBookingAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const rawLocale = String(formData.get('locale') ?? defaultLocale);
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const session = await getSession();

  const paymentMethod = String(formData.get('paymentMethod') ?? 'click') as
    | 'click'
    | 'payme'
    | 'uzcard'
    | 'humo'
    | 'cash';

  // Guest (login qilmagan) mijoz uchun ism/familiya/email/telefon —
  // `CheckoutForm`da `isGuest` bo'lsa HTML `required` orqali majburiy
  // qilinadi; login qilgan mijoz esa faqat `fullName` yuboradi. Shuning
  // uchun bu yerda ikkalasi ham ixtiyoriy — backend ham guest
  // ma'lumotlarini majburiy talab qilmaydi.
  const input = {
    hotelId: String(formData.get('hotelId') ?? ''),
    roomId: String(formData.get('roomId') ?? ''),
    checkIn: String(formData.get('checkIn') ?? ''),
    checkOut: String(formData.get('checkOut') ?? ''),
    guests: Number(formData.get('guests') ?? 1),
    paymentMethod,
    firstName: formData.get('firstName') ? String(formData.get('firstName')) : undefined,
    lastName: formData.get('lastName') ? String(formData.get('lastName')) : undefined,
    fullName: formData.get('fullName') ? String(formData.get('fullName')) : undefined,
    email: formData.get('email') ? String(formData.get('email')) : undefined,
    phone: formData.get('phone') ? String(formData.get('phone')) : undefined,
  };
  let bookingId = '';
  let bookingNumber = '';
  let checkoutUrl = '';

  try {
    const booking = await api.bookings.createHotelBooking(input, {
      token: session?.accessToken,
    });
    bookingId = booking.id;
    bookingNumber = booking.bookingNumber;
    checkoutUrl = booking.payment?.url ?? '';

    try {
      if (!checkoutUrl && paymentMethod !== 'cash') {
        const paymentSession = await api.payments.createPaymentSession(
          bookingId,
          paymentMethod,
          {
            token: session?.accessToken,
          },
        );
        if (paymentSession.paymentUrl) {
          checkoutUrl = paymentSession.paymentUrl;
        }
      }
    } catch {
      // Fall back to booking details page if payment session fails
    }
  } catch (error) {
    if (session) {
      await redirectToLoginIfSessionExpired(error, locale);
    }
    return {
      error: error instanceof ApiRequestError ? error.message : 'ERROR',
    };
  }

  if (!bookingId) {
    return { error: 'ERROR' };
  }

  const guestQuery = guestConfirmationQuery(!session, bookingNumber, input.email);

  if (paymentMethod === 'cash') {
    redirect(`/${locale}/booking/${bookingId}?status=confirmed&payment=cash${guestQuery}`);
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  redirect(
    `/${locale}/booking/${bookingId}?payment=pending&provider=${paymentMethod}${guestQuery}`,
  );
}

export interface BusCheckoutState {
  error?: string;
}

export async function createBusBookingAction(
  _prev: BusCheckoutState,
  formData: FormData,
): Promise<BusCheckoutState> {
  const rawLocale = String(formData.get('locale') ?? defaultLocale);
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const tripId = String(formData.get('tripId') ?? '');
  const seats = String(formData.get('seats') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const paymentMethod = String(formData.get('paymentMethod') ?? 'click') as
    | 'click'
    | 'payme'
    | 'uzcard'
    | 'humo'
    | 'cash';

  if (!tripId || seats.length === 0) {
    return { error: 'NO_SEATS' };
  }

  let bookingId = '';
  let checkoutUrl = '';
  try {
    const booking = await api.bookings.createBusBooking(
      {
        tripId,
        seats,
        paymentMethod,
      },
      { token: session.accessToken },
    );
    bookingId = booking.id;

    if (paymentMethod === 'cash') {
      redirect(`/${locale}/booking/${bookingId}?status=confirmed&payment=cash`);
    }

    try {
      const paymentSession = await api.payments.createPaymentSession(
        bookingId,
        paymentMethod,
        {
          token: session.accessToken,
        },
      );
      if (paymentSession.paymentUrl) {
        checkoutUrl = paymentSession.paymentUrl;
      }
    } catch {
      // Fall back to booking details page
    }
  } catch (error) {
    await redirectToLoginIfSessionExpired(error, locale);
    return {
      error: error instanceof ApiRequestError ? error.message : 'ERROR',
    };
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  redirect(
    `/${locale}/booking/${bookingId}?payment=pending&provider=${paymentMethod}`,
  );
}

export interface VehicleCheckoutState {
  error?: string;
}

/**
 * Mashina ijarasi (rent-a-car) broni — `createBookingAction` (hotel) bilan
 * bir xil naqsh: guest (login qilmagan) mijoz uchun ism/familiya/email/
 * telefon `CheckoutForm`da `required` orqali majburiy, login qilgan mijoz
 * faqat `fullName` yuboradi. Chipta-asosli `createBusBookingAction`dan
 * farqli, login shart emas.
 */
export async function createVehicleBookingAction(
  _prev: VehicleCheckoutState,
  formData: FormData,
): Promise<VehicleCheckoutState> {
  const rawLocale = String(formData.get('locale') ?? defaultLocale);
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const session = await getSession();

  const paymentMethod = String(formData.get('paymentMethod') ?? 'click') as
    | 'click'
    | 'payme'
    | 'uzcard'
    | 'humo'
    | 'cash';

  const input = {
    vehicleId: String(formData.get('vehicleId') ?? ''),
    checkIn: String(formData.get('checkIn') ?? ''),
    checkOut: String(formData.get('checkOut') ?? ''),
    paymentMethod,
    firstName: formData.get('firstName') ? String(formData.get('firstName')) : undefined,
    lastName: formData.get('lastName') ? String(formData.get('lastName')) : undefined,
    fullName: formData.get('fullName') ? String(formData.get('fullName')) : undefined,
    email: formData.get('email') ? String(formData.get('email')) : undefined,
    phone: formData.get('phone') ? String(formData.get('phone')) : undefined,
  };
  let bookingId = '';
  let bookingNumber = '';
  let checkoutUrl = '';

  try {
    const booking = await api.bookings.createVehicleBooking(input, {
      token: session?.accessToken,
    });
    bookingId = booking.id;
    bookingNumber = booking.bookingNumber;
    checkoutUrl = booking.payment?.url ?? '';

    try {
      if (!checkoutUrl && paymentMethod !== 'cash') {
        const paymentSession = await api.payments.createPaymentSession(
          bookingId,
          paymentMethod,
          {
            token: session?.accessToken,
          },
        );
        if (paymentSession.paymentUrl) {
          checkoutUrl = paymentSession.paymentUrl;
        }
      }
    } catch {
      // Fall back to booking details page if payment session fails
    }
  } catch (error) {
    if (session) {
      await redirectToLoginIfSessionExpired(error, locale);
    }
    return {
      error: error instanceof ApiRequestError ? error.message : 'ERROR',
    };
  }

  if (!bookingId) {
    return { error: 'ERROR' };
  }

  const guestQuery = guestConfirmationQuery(!session, bookingNumber, input.email);

  if (paymentMethod === 'cash') {
    redirect(`/${locale}/booking/${bookingId}?status=confirmed&payment=cash${guestQuery}`);
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  redirect(
    `/${locale}/booking/${bookingId}?payment=pending&provider=${paymentMethod}${guestQuery}`,
  );
}
