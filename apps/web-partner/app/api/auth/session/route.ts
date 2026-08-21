import { NextRequest, NextResponse } from 'next/server';
import { setRefreshCookie } from '../_shared';

/**
 * Login/OTP-verify muvaffaqiyatli bo'lgach chaqiriladi: brauzer JS
 * backend'dan olgan `refreshToken`ni shu yerga topshiradi, biz uni
 * httpOnly cookie'ga yozamiz va javobda QAYTARMAYMIZ — shu daqiqadan
 * boshlab u faqat shu server tomonida mavjud.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { refreshToken?: string }
    | null;
  const refreshToken = body?.refreshToken;

  if (!refreshToken || typeof refreshToken !== 'string') {
    return NextResponse.json(
      { error: 'refreshToken required' },
      { status: 400 },
    );
  }

  const res = NextResponse.json({ ok: true });
  setRefreshCookie(res, refreshToken);
  return res;
}
