import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Safaar Admin — Boshqaruv paneli",
    template: "%s | Safaar Admin",
  },
  description: "Safaar platformasining super admin boshqaruv paneli. Foydalanuvchilar, hamkorlar, bronlar va moliyani boshqaring.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
