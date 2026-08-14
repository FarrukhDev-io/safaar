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
        <Label htmlFor="phone">Telefon raqam</Label>
        <div className="relative">
          <Phone
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+998 90 123 45 67"
            className="pl-9"
            disabled={Boolean(challenge)}
            aria-invalid={Boolean(form.formState.errors.phone)}
            aria-describedby="phone-help phone-error"
            {...form.register('phone', {
              onChange: (e) => setWatchedPhone(e.target.value),
            })}
          />
        </div>
        <p id="phone-help" className="text-xs text-[var(--muted-foreground)]">
          Admin tasdiqlagan telefon raqam bilan kabinetga kirasiz.
        </p>
        {form.formState.errors.phone && (
          <p id="phone-error" role="alert" className="text-xs text-red-600">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      {/* ── Demo rejim: tur tanlash paneli ──────────────────────────────── */}
      {isDemo && !challenge && (
        <div className="rounded-lg border border-dashed border-amber-400/60 bg-amber-50/40 dark:bg-amber-900/10 p-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Demo rejim — hamkor turini tanlang:
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {DEMO_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setDemoType(t.value)}
                className={[
                  'flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-center text-xs transition-all',
                  demoType === t.value
                    ? 'border-amber-500 bg-amber-100 dark:bg-amber-800/30 font-semibold text-amber-800 dark:text-amber-300'
                    : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-400',
                ].join(' ')}
              >
                <span className="text-base leading-none">{t.emoji}</span>
                <span className="leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {challenge ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Tasdiqlash kodi</Label>
          <div className="relative">
            <KeyRound
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <Input
              id="code"
              type="text"
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder={challenge.phone === DEMO_PHONE || challenge.phone.replace(/\D/g, '') === '998901234567' ? '000000' : '6 xonali kod'}
              className="pl-9 tracking-[0.25em]"
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
          <p id="code-help" className="text-xs text-[var(--muted-foreground)]">
            {challenge.phone === DEMO_PHONE || challenge.phone.replace(/\D/g, '') === '998901234567'
              ? '🎮 Demo rejim: kodni kiriting → 000000'
              : `Kod ${challenge.phone} raqamiga yuborildi.`}
          </p>
          
          {challenge.devCode && (
            <div className="mt-1 rounded-md bg-green-50 dark:bg-green-900/20 p-2 border border-green-200 dark:border-green-900/50">
              <p className="text-xs font-medium text-green-800 dark:text-green-300">
                🛠️ Dasturlash rejimi: Kod <strong className="text-base tracking-widest bg-white dark:bg-black px-1.5 py-0.5 rounded ml-1">{challenge.devCode}</strong>
              </p>
            </div>
          )}

          {form.formState.errors.code && (
            <p id="code-error" role="alert" className="text-xs text-red-600">
              {form.formState.errors.code.message}
            </p>
          )}
        </div>
      ) : null}

      <Button type="submit" size="lg" loading={loading} className="mt-2">
        {challenge ? 'Kirish' : 'Kod yuborish'}
      </Button>

      {challenge ? (
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={resetChallenge}
        >
          Telefonni o'zgartirish
        </Button>
      ) : null}
    </form>
  );
}
