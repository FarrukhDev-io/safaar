import { NextResponse } from 'next/server';
import { clearRefreshCookie } from '../_shared';

/** Chiqishda httpOnly refresh-token cookie'sini tozalaydi. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearRefreshCookie(res);
  return res;
}
