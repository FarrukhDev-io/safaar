'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Phone, FlaskConical } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { Input } from '../../_components/ui/input';
import { Label } from '../../_components/ui/label';
import {
  usePartnerPhoneOtpRequest,
  usePartnerPhoneOtpVerify,
} from '../../_hooks/use-auth';

// ─── Demo tur tanlash ─────────────────────────────────────────────────────────
const DEMO_PHONE = '+998901234567';

const DEMO_TYPES = [
  { value: 'hotel',      emoji: '🏨', label: 'Mehmonxona' },
  { value: 'hostel',     emoji: '🛏️', label: 'Hostel' },
  { value: 'dacha',      emoji: '🏡', label: 'Dacha' },
  { value: 'restaurant', emoji: '🍽️', label: 'Restoran' },
  { value: 'bus',        emoji: '🚗', label: 'Rent Car' },
  { value: 'guesthouse', emoji: '🏠', label: 'Mehmon uyi' },
  { value: 'motel',      emoji: '🛣️', label: 'Motel' },
] as const;
// ─────────────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Telefon raqam kiriting')
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length === 9 || (digits.startsWith('998') && digits.length === 12);
    }, "Noto'g'ri telefon raqami formati. Masalan: +998901234567"),
  code: z.string().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

interface PhoneChallenge {
  phone: string;
  challengeId: string;
  partnerType?: string;
  devCode?: string;
}

export function LoginForm() {
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const [demoType, setDemoType] = useState<string>('hotel');
  const [watchedPhone, setWatchedPhone] = useState('');
  const otpRequest = usePartnerPhoneOtpRequest();
  const otpVerify = usePartnerPhoneOtpVerify();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '+998', code: '' },
  });

  const isDemo = watchedPhone.trim() === DEMO_PHONE || watchedPhone.replace(/\D/g, '') === '998901234567';

  const onSubmit = form.handleSubmit(async (values) => {
    if (!challenge) {
      try {
        const result = await otpRequest.mutateAsync(values.phone);
        setChallenge({
          phone: result.phone,
          challengeId: result.challengeId,
          // Demo rejimda foydalanuvchi tanlagan turni ishlatamiz
          partnerType: (result.phone === DEMO_PHONE || result.phone.replace(/\D/g, '') === '998901234567') ? demoType : result.partnerType,
          devCode: result.devCode,
        });
        form.setValue('phone', result.phone);
      } catch (error) {
        form.setError('phone', {
          message:
            error instanceof Error
              ? error.message
              : 'Kod yuborishda xatolik yuz berdi',
        });
      }
      return;
    }

    const code = String(values.code ?? '').trim();
    if (code.length < 4) {
      form.setError('code', {
        message: 'Telefon raqamga yuborilgan kodni kiriting',
      });
      return;
    }

    try {
      await otpVerify.mutateAsync({
        phone: challenge.phone,
        code,
        challengeId: challenge.challengeId,
        partnerType: challenge.partnerType,
      });
    } catch (error) {
      form.setError('code', {
        message:
          error instanceof Error
            ? error.message
            : "Kod noto'g'ri yoki muddati tugagan",
      });
    }
  });

  const resetChallenge = () => {
    setChallenge(null);
    form.setValue('code', '');
    form.setFocus('phone');
  };

  const loading = otpRequest.isPending || otpVerify.isPending;

  return (
    <form
      className="flex flex-col gap-4 fade-in"
      onSubmit={onSubmit}
      aria-label="Telefon raqam bilan kirish"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-xs font-medium text-slate-300">
          Telefon raqam
        </label>
        <div className="relative">
          <Phone
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+998 90 123 45 67"
            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all disabled:opacity-50"
            disabled={Boolean(challenge)}
            aria-invalid={Boolean(form.formState.errors.phone)}
            aria-describedby="phone-help phone-error"
            {...form.register('phone', {
              onChange: (e) => setWatchedPhone(e.target.value),
            })}
          />
        </div>
        <p id="phone-help" className="text-[11px] text-slate-400">
          Admin tasdiqlagan telefon raqam bilan kabinetga kirasiz.
        </p>
        {form.formState.errors.phone && (
          <p id="phone-error" role="alert" className="text-xs text-rose-400 font-medium">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      {/* ── Demo rejim: tur tanlash paneli ──────────────────────────────── */}
      {isDemo && !challenge && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 flex flex-col gap-2.5 backdrop-blur-md">
          <p className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <FlaskConical className="h-4 w-4 text-amber-400 animate-bounce" />
            Demo rejim — Sinov uchun hamkor turini tanlang:
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {DEMO_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setDemoType(t.value)}
                className={[
                  'flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center text-xs transition-all cursor-pointer',
                  demoType === t.value
                    ? 'border-amber-400 bg-amber-400/20 font-bold text-amber-200 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-400 hover:text-slate-200',
                ].join(' ')}
              >
                <span className="text-lg leading-none">{t.emoji}</span>
                <span className="leading-tight text-[11px]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {challenge ? (
        <div className="flex flex-col gap-1.5 animate-fade-in">
          <label htmlFor="code" className="text-xs font-medium text-slate-300">
            Tasdiqlash kodi
          </label>
          <div className="relative">
            <KeyRound
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="code"
              type="text"
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder={challenge.phone === DEMO_PHONE || challenge.phone.replace(/\D/g, '') === '998901234567' ? '000000' : '6 xonali kod'}
              className="w-full pl-10 pr-4 py-3 tracking-[0.3em] font-mono text-center text-lg rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
              aria-invalid={Boolean(form.formState.errors.code)}
              aria-describedby="code-help code-error"
              {...form.register('code', {
                onChange: (event) => {
                  event.target.value = event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6);
                },
              })}
            />
          </div>
          <p id="code-help" className="text-[11px] text-slate-400">
            {challenge.phone === DEMO_PHONE || challenge.phone.replace(/\D/g, '') === '998901234567'
              ? '🎮 Demo rejim: kodni kiriting → 000000'
              : `Kod ${challenge.phone} raqamiga yuborildi.`}
          </p>
          
          {challenge.devCode && (
            <div className="mt-1 rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/30">
              <p className="text-xs font-medium text-emerald-300 flex items-center justify-between">
                <span>🛠️ Dasturlash rejimi kodi:</span>
                <strong className="text-sm tracking-widest bg-emerald-950 border border-emerald-500/40 text-emerald-200 px-2 py-0.5 rounded-lg">{challenge.devCode}</strong>
              </p>
            </div>
          )}

          {form.formState.errors.code && (
            <p id="code-error" role="alert" className="text-xs text-rose-400 font-medium">
              {form.formState.errors.code.message}
            </p>
          )}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          challenge ? 'Kabinetga kirish' : 'SMS Kodini yuborish'
        )}
      </button>

      {challenge ? (
        <button
          type="button"
          disabled={loading}
          onClick={resetChallenge}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          Telefon raqamini o'zgartirish
        </button>
      ) : null}
    </form>
  );
}
