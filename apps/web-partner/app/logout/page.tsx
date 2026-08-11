'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Spinner } from '../_components/ui/spinner';
import { AUTH_STORAGE_KEY, useAuthStore } from '../_stores/auth-store';
import { useDataStore } from '../_stores/data-store';

export default function LogoutPage() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const resetData = useDataStore((s) => s.reset);
  const queryClient = useQueryClient();

  useEffect(() => {
    clearSession();
    resetData();
    queryClient.clear();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.replace('/login');
  }, [clearSession, resetData, queryClient, router]);

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[var(--background)]"
      role="status"
      aria-label="Sessiya tozalanmoqda"
    >
      <Spinner size="lg" label="Sessiya tozalanmoqda" />
    </main>
  );
}
