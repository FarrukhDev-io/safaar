'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Mail, FlaskConical } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { Input } from '../../_components/ui/input';
import { Label } from '../../_components/ui/label';
import {
  usePartnerEmailOtpRequest,
  usePartnerEmailOtpVerify,
} from '../../_hooks/use-auth';

// ─── Demo tur tanlash ─────────────────────────────────────────────────────────
const DEMO_EMAIL = 'demo@safaar.uz';

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
  email: z
    .string()
    .trim()
    .min(1, 'Email kiriting')
    .email("Email noto'g'ri formatda")
    .transform((value) => value.toLowerCase()),
  code: z.string().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

interface EmailChallenge {
  email: string;
  challengeId: string;
  partnerType?: string;
}

export function LoginForm() {
  const [challenge, setChallenge] = useState<EmailChallenge | null>(null);
  const [demoType, setDemoType] = useState<string>('hotel');
  const [watchedEmail, setWatchedEmail] = useState('');
  const otpRequest = usePartnerEmailOtpRequest();
  const otpVerify = usePartnerEmailOtpVerify();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', code: '' },
  });

  const isDemo = watchedEmail.trim().toLowerCase() === DEMO_EMAIL;

  const onSubmit = form.handleSubmit(async (values) => {
    if (!challenge) {
      try {
        const result = await otpRequest.mutateAsync(values.email);
        setChallenge({
          email: result.email,
          challengeId: result.challengeId,
          // Demo rejimda foydalanuvchi tanlagan turni ishlatamiz
          partnerType: result.email === DEMO_EMAIL ? demoType : result.partnerType,
        });
        form.setValue('email', result.email);
      } catch (error) {
        form.setError('email', {
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
        message: 'Emailga yuborilgan kodni kiriting',
      });
      return;
    }

    try {
      await otpVerify.mutateAsync({
        email: challenge.email,
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
    form.setFocus('email');
  };

  const loading = otpRequest.isPending || otpVerify.isPending;

  return (
    <form
      className="flex flex-col gap-4 fade-in"
      onSubmit={onSubmit}
      aria-label="Email bilan kirish"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="email@example.com"
            className="pl-9"
            disabled={Boolean(challenge)}
            aria-invalid={Boolean(form.formState.errors.email)}
            aria-describedby="email-help email-error"
            {...form.register('email', {
              onChange: (e) => setWatchedEmail(e.target.value),
            })}
          />
        </div>
        <p id="email-help" className="text-xs text-[var(--muted-foreground)]">
          Admin tasdiqlagan email bilan kabinetga kirasiz.
        </p>
        {form.formState.errors.email && (
          <p id="email-error" role="alert" className="text-xs text-red-600">
            {form.formState.errors.email.message}
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
              placeholder={challenge.email === DEMO_EMAIL ? '000000' : '6 xonali kod'}
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
            {challenge.email === DEMO_EMAIL
              ? '🎮 Demo rejim: kodni kiriting → 000000'
              : `Kod ${challenge.email} manziliga yuborildi.`}
          </p>
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
          Emailni o'zgartirish
        </Button>
      ) : null}
    </form>
  );
}
