'use client';

import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { QueryProvider } from './query-provider';
import { RealtimeListener } from './realtime-listener';
import { SessionExpiryHandler } from './session-expiry-handler';
import { ThemeProvider } from './theme-provider';

/**
 * Barcha global provider'lar shu yerda birlashtiriladi.
 * Root layout uchun yagona kirish nuqtasi.
 */
export function Providers({
  children,
  nonce,
}: {
  children: ReactNode;
  nonce?: string;
}) {
  return (
    <ThemeProvider nonce={nonce}>
      <QueryProvider>
        <SessionExpiryHandler />
        <RealtimeListener />
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="system"
          toastOptions={{
            classNames: {
              toast:
                'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-lg',
            },
          }}
        />
      </QueryProvider>
    </ThemeProvider>
  );
}
