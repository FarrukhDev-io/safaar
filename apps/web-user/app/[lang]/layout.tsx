import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import "../globals.css";
import {
  defaultLocale,
  isLocale,
  locales,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import dynamic from "next/dynamic";
import NextTopLoader from "nextjs-toploader";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { Toaster } from "sonner";
import { config } from "@/lib/config";
import { ClickSpark } from "@/components/ui/ClickSpark";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const SITE_URL = config.siteUrl;

const OG_LOCALE: Record<Locale, string> = {
  uz: "uz_UZ",
  ru: "ru_RU",
  en: "en_US",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const common = await getDictionary(locale, "common");

  const title = `${common.brand} — ${common.footer.tagline}`;
  const description = common.footer.tagline;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — ${common.brand}` },
    description,
    applicationName: "Safaar",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "Safaar", statusBarStyle: "default" },
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])) as Record<string, string>,
    },
    openGraph: {
      type: "website",
      siteName: "Safaar",
      locale: OG_LOCALE[locale],
      title,
      description,
      url: `/${locale}`,
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#059669" };

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  // P2-5 FIX: PWA o'rnatish bannerini joriy locale'da ko'rsatish uchun
  // shu locale lug'atidagi `pwa` bo'limi olinadi (SSR — server komponenti
  // ichida, mijoz tomonida qo'shimcha so'rovsiz). Agar lug'atda `pwa`
  // umuman bo'lmasa (masalan eski keshlangan build) — xavfsiz o'zbekcha
  // standart qiymatga qaytiladi, hech qachon bo'sh matn ko'rsatilmaydi.
  const common = await getDictionary(lang as Locale, "common");
  const pwaDict = common.pwa ?? {
    title: "Safaar ilovasini o'rnating",
    subtitle: "Tezkor kirish va offlayn rejim",
    install: "O'rnatish",
  };

  // SECURITY-P3 (A12-4): per-request nonce set by middleware.ts, threaded
  // down to the one inline script this app renders (AnalyticsProvider's
  // GTM snippet) so it can run under a strict, non-'unsafe-inline'
  // script-src. See docs/product/security-product-readiness-report.md.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={lang}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${manrope.variable} h-full overflow-x-hidden subpixel-antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-slate-100/60 text-slate-900 subpixel-antialiased dark:bg-slate-950 dark:text-slate-100">
        <NextTopLoader color="linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)" showSpinner={false} shadow="0 0 10px #8b5cf6,0 0 5px #ec4899" />
        <AnalyticsProvider nonce={nonce}>
          <ClickSpark global />
          <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            {children}
            <Toaster position="top-right" richColors />
            <ServiceWorkerRegister />
            <PwaInstallBanner dict={pwaDict} />
          </div>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
