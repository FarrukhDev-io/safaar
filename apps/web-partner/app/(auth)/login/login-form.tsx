'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Mail } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { Input } from '../../_components/ui/input';
import { Label } from '../../_components/ui/label';
import {
  usePartnerEmailOtpRequest,
  usePartnerEmailOtpVerify,
} from '../../_hooks/use-auth';

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
  const otpRequest = usePartnerEmailOtpRequest();
  const otpVerify = usePartnerEmailOtpVerify();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', code: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!challenge) {
      try {
        const result = await otpRequest.mutateAsync(values.email);
        setChallenge({
          email: result.email,
          challengeId: result.challengeId,
          partnerType: result.partnerType,
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
            {...form.register('email')}
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
              placeholder="6 xonali kod"
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
            Kod {challenge.email} manziliga yuborildi.
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
