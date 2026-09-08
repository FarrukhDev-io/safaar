import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./_providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Safaar — Hamkor Kabineti",
  description:
    "Safaar platformasidagi mehmonxona va mashina ijarasi hamkorlari uchun boshqaruv paneli.",
};

// SECURITY-P3 (A12-4): nonce-based CSP correctness requires per-request
// rendering. Next.js only stamps its own hydration/RSC bootstrap scripts
// with the nonce it finds in the CSP response header at the moment a page
// is actually rendered -- for a statically prerendered page that "moment"
// is build time, when no request (and so no per-request nonce) exists yet,
// so those scripts would ship with no nonce at all and get blocked once
// CSP is enforced. Verified live: before this, most routes here were
// prerendered as static (see docs/product/security-product-readiness-report.md).
// This is an authenticated internal dashboard (not SEO/cache-sensitive
// public content), so trading static prerendering for correct per-request
// nonces is the safe choice.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SECURITY-P3 (A12-4): per-request nonce set by proxy.ts, threaded down
  // to next-themes' inline theme-flash-prevention script (the only inline
  // script this app renders itself) via ThemeProvider's `nonce` prop.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="uz"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] font-sans text-[var(--foreground)] selection:bg-brand-200 selection:text-brand-900">
        <Providers nonce={nonce}>{children}</Providers>
      </body>
    </html>
  );
}
