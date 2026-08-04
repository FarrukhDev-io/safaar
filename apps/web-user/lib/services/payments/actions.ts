'use server';

import { redirect } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { getSession } from '@/lib/auth/session';
import { defaultLocale, isLocale } from '@/i18n/config';
import type { PaymentProvider } from './payments';

export interface RetryPaymentState {
  error?: string;
  url?: string;
}

export async function createPaymentSessionAction(
  _prev: RetryPaymentState,
  formData: FormData,
): Promise<RetryPaymentState> {
  const rawLocale = String(formData.get('locale') ?? defaultLocale);
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const bookingId = String(formData.get('bookingId') ?? '').trim();
  const provider = String(
    formData.get('paymentMethod') ?? 'click',
  ) as PaymentProvider;

  const session = await getSession();

  if (!bookingId) {
    return { error: 'INVALID_BOOKING' };
  }

  if (provider === 'cash') {
    redirect(`/${locale}/booking/${bookingId}?status=confirmed&payment=cash`);
  }

  let checkoutUrl = '';
  try {
    const result = await api.payments.createPaymentSession(
      bookingId,
      provider,
      {
        token: session?.accessToken,
      },
    );
    if (result.paymentUrl) {
      checkoutUrl = result.paymentUrl;
    }
  } catch (error) {
    return {
      error: error instanceof ApiRequestError ? error.message : 'ERROR',
    };
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }

  redirect(
    `/${locale}/booking/${bookingId}?payment=pending&provider=${provider}`,
  );
}
