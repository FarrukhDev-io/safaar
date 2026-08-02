"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
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

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* GA4 Script Ingestion */}
      {GA_TRACKING_ID && (
        <GoogleAnalytics gaId={GA_TRACKING_ID} />
      )}

      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>

      {children}
    </>
  );
}
