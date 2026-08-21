'use client';

import { useEffect } from 'react';
import {
  Mail,
  PauseCircle,
  Save,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '../../../_components/ui/card';
import { Button } from '../../../_components/ui/button';
import { Input } from '../../../_components/ui/input';
import { Label } from '../../../_components/ui/label';
import { partners } from '../../../_lib/api';
import type { PartnerAccessStatus } from '../../../_lib/api/endpoints/access';
import { useAuthStore } from '../../../_stores/auth-store';

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email kiriting')
    .email("Email noto'g'ri formatda")
    .transform((value) => value.toLowerCase()),
});

type Values = z.infer<typeof schema>;

function normalizeAccessStatus(
  status: string | null | undefined,
): PartnerAccessStatus {
  if (
    status === 'approved' ||
    status === 'blocked' ||
    status === 'suspended' ||
    status === 'rejected' ||
    status === 'submitted' ||
    status === 'reviewing' ||
    status === 'not_found'
  ) {
    return status;
  }
  if (status === 'under_review') {
    return 'reviewing';
  }
  return 'new';
}

function accessStatusMeta(status: PartnerAccessStatus) {
  if (status === 'blocked') {
    return {
      label: 'Bloklangan',
      description:
        'Admin accessni bloklagan. Profil va yordam chatidan foydalanishingiz mumkin.',
      Icon: ShieldX,
      className: 'bg-red-100 text-red-700',
    };
  }

  if (status === 'suspended') {
    return {
      label: "To'xtatilgan",
      description:
        "Access vaqtincha to'xtatilgan. Profil va yordam chatidan foydalanishingiz mumkin.",
      Icon: PauseCircle,
      className: 'bg-amber-100 text-amber-700',
    };
  }

  if (status === 'approved') {
    return {
      label: 'Tasdiqlangan',
      description: 'Bu profil admin tomonidan tasdiqlangan email orqali ishlaydi.',
      Icon: ShieldCheck,
      className: 'bg-emerald-100 text-emerald-700',
    };
  }

  return {
    label: 'Tasdiq kutilmoqda',
    description: 'Access holati admin tomonidan yakuniy tasdiqlanmagan.',
    Icon: ShieldAlert,
    className: 'bg-slate-100 text-slate-700',
  };
}

export function ProfileSettingsView() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.tokens?.accessToken);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ['partner', 'profile'],
    queryFn: () => partners.getProfile(token),
    enabled: Boolean(token),
  });
  const profile = profileQuery.data;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      email: profile?.email ?? user?.email ?? '',
    },
  });

  const updateEmail = useMutation({
    mutationFn: (values: Values) =>
      partners.updateProfile({ email: values.email }, token),
    onSuccess: (updated, values) => {
      updateUser({ email: values.email });
      void queryClient.invalidateQueries({ queryKey: ['partner', 'profile'] });
      toast.success("Profil ma'lumotlari saqlandi");
      form.reset(values);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Saqlashda xatolik yuz berdi");
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    updateEmail.mutate(values);
  });

  useEffect(() => {
    if (!profile) return;

    updateUser({
      email: profile.email ?? user?.email,
      accessStatus: normalizeAccessStatus(profile.status),
    });
  }, [profile, updateUser, user?.email]);

  if (!user) {
    return null;
  }

  const err = form.formState.errors;
  const accessStatus = normalizeAccessStatus(
    profile?.status ?? user.accessStatus,
  );
  const accessMeta = accessStatusMeta(accessStatus);
  const AccessIcon = accessMeta.Icon;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="email">Access emaili</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(err.email)}
                {...form.register('email')}
              />
              {err.email ? (
                <p className="text-xs text-red-600">{err.email.message}</p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={!form.formState.isDirty || updateEmail.isPending}
              >
                <Save className="h-4 w-4" aria-hidden />
                {updateEmail.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${accessMeta.className}`}
            >
              <AccessIcon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Access holati: {accessMeta.label}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {accessMeta.description}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <Mail className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Kirish usuli</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Tasdiqlangan email bilan kabinetga kiriladi.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
