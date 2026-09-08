"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({
  children,
  nonce,
}: {
  children: ReactNode;
  /**
   * SECURITY-P3 (A12-4): next-themes injects its own inline
   * theme-flash-prevention <script> into <head> before hydration/paint.
   * Without this it has no nonce and gets blocked under an enforced
   * script-src -- caught live via Playwright, not by static reading (see
   * docs/product/security-product-readiness-report.md).
   */
  nonce?: string;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  );
}
