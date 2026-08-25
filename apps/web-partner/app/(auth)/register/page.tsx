'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../_components/ui/button';
import { Input } from '../../_components/ui/input';
import { Label } from '../../_components/ui/label';
import { access } from '../../_lib/api';
import {
  isValidPhone,
  maskPhone,
  normalizePhone,
} from '../../_lib/utils/phone';

const schema = z.object({
  type: z.enum([
    'hotel',
    'bus',
    'hostel',
    'guesthouse',
    'motel',
    'dacha',
    'restaurant',
  ]),
  companyName: z.string().min(2, 'Obyekt/Kompaniya nomini kiriting'),
  contactPerson: z.string().min(2, "Mas'ul shaxsni kiriting"),
  phone: z
    .string()
    .min(1, 'Telefon raqamni kiriting')
    .refine(isValidPhone, "Telefon noto'g'ri formatda"),
  email: z.string().email("Email noto'g'ri"),
  city: z.string().min(2, 'Shaharni kiriting'),
  address: z.string().min(5, 'Manzilni kiriting'),
  taxId: z
    .string()
    .min(9, "STIR 9 ta raqamdan iborat bo'lishi kerak")
    .max(9, "STIR 9 ta raqamdan iborat bo'lishi kerak")
    .regex(/^\d{9}$/, 'Faqat raqamlar kiriting'),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const [error, setError] = useState('');
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'hotel',
      companyName: '',
      contactPerson: '',
      phone: '+998 ',
      email: '',
      city: '',
      address: '',
      taxId: '',
      note: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError('');
    try {
      const result = await access.submitPartnerApplication({
        ...values,
        phone: normalizePhone(values.phone),
      });
      setSubmitted({ id: result.item.id });
    } catch (cause: any) {
      if (cause?.payload?.fields) {
        for (const [field, message] of Object.entries(cause.payload.fields)) {
          form.setError(field as any, {
            type: 'server',
            message: message as string,
          });
        }
        setError(
          cause.payload.message || "Iltimos formadagi xatoliklarni to'g'irlang",
        );
      } else {
        setError(
          cause instanceof Error ? cause.message : 'Ariza yuborishda xatolik',
        );
      }
    }
  });

  if (submitted) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Ariza yuborildi
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Arizangiz web-admin paneliga tushdi. Admin tasdiqlagandan keyin shu
            email bilan tizimga kira olasiz.
          </p>
        </div>
        <Link href="/login">
          <Button className="w-full" size="lg">
            Login sahifasiga o'tish
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-1">
        <Link
          href="/login"
          className="mb-2 inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Login sahifasi
        </Link>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand-700" aria-hidden />
          <h2 className="text-xl font-semibold tracking-tight">
            Hamkorlik arizasi
          </h2>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          Ma'lumotlarni yuboring. Admin tasdiqlagandan keyin kabinet ochiladi.
        </p>
      </div>

      <Field id="type" label="Obyekt turi" error={form.formState.errors.type?.message}>
        <select
          id="type"
          {...form.register('type')}
          className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm shadow-sm transition-all focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="hotel">Mehmonxona</option>
          <option value="hostel">Yotoqxona (Hostel)</option>
          <option value="guesthouse">Mehmon uyi</option>
          <option value="motel">Motel</option>
          <option value="dacha">Dacha</option>
          <option value="restaurant">Restoran</option>
          <option value="bus">Transport (Mashina Ijarasi)</option>
        </select>
      </Field>
      <Field
        id="companyName"
        label="Obyekt yoki Kompaniya nomi"
        error={form.formState.errors.companyName?.message}
      >
        <Input
          id="companyName"
          {...form.register('companyName')}
          placeholder="Grand Samarkand Hotel"
        />
      </Field>
      <Field
        id="contactPerson"
        label="Mas'ul shaxs"
        error={form.formState.errors.contactPerson?.message}
      >
        <Input
          id="contactPerson"
          {...form.register('contactPerson')}
          placeholder="Ali Valiyev"
        />
      </Field>
      <Field id="phone" label="Telefon" error={form.formState.errors.phone?.message}>
        <Input
          id="phone"
          type="tel"
          {...form.register('phone', {
            onChange: (e) => {
              e.target.value = maskPhone(e.target.value);
            },
          })}
        />
      </Field>
      <Field id="email" label="Email" error={form.formState.errors.email?.message}>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          placeholder="hotel@example.com"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city" label="Shahar" error={form.formState.errors.city?.message}>
          <Input id="city" {...form.register('city')} placeholder="Samarqand" />
        </Field>
        <Field id="taxId" label="STIR" error={form.formState.errors.taxId?.message}>
          <Input
            id="taxId"
            inputMode="numeric"
            maxLength={9}
            {...form.register('taxId', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
              },
            })}
            placeholder="123456789"
          />
        </Field>
      </div>
      <Field id="address" label="Manzil" error={form.formState.errors.address?.message}>
        <Input
          id="address"
          {...form.register('address')}
          placeholder="Registon ko'chasi 10"
        />
      </Field>
      <Field id="note" label="Izoh" error={form.formState.errors.note?.message}>
        <Input id="note" {...form.register('note')} placeholder="Qo'shimcha ma'lumot" />
      </Field>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
        Arizani yuborish
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
