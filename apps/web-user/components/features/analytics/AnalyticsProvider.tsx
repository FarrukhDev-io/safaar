"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { GA_TRACKING_ID, trackPageView } from "@/lib/services/analytics/tracker";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({
  children,
  nonce,
}: {
  children: React.ReactNode;
  /**
   * SECURITY-P3 (A12-4): the per-request CSP nonce from middleware.ts
   * (read via headers() in the root layout, since this is a client
   * component and cannot call next/headers itself). Passed straight
   * through to next/script so both tags below run under script-src's
   * nonce instead of needing 'unsafe-inline'.
   */
  nonce?: string;
}) {
  return (
    <>
      {/* GA4 Script Ingestion */}
      {GA_TRACKING_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            strategy="afterInteractive"
            nonce={nonce}
          />
          <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', '${GA_TRACKING_ID}');
            `}
          </Script>
        </>
      )}

      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>

      {children}
    </>
  );
}
