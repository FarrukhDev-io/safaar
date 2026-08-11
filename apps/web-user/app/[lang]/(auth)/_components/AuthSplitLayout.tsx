import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { AuthDict } from "@/i18n/dictionaries";
import { BackButton } from "@/components/ui/BackButton";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import MaskedHeading from "@/components/reactbits/MaskedHeading";

interface AuthSplitLayoutProps {
  children: ReactNode;
  locale: Locale;
  dict: AuthDict;
}

/**
  * AuthSplitLayout - Kop ishlatiladigan 50/50 split desktop dizayni uchun wrapper.
  * Chap tomonda premium brending banneri, o'ng tomonda esa forma,
  * orqaga qaytish va til almashtirish tugmalari joylashgan.
  */
export function AuthSplitLayout({ children, locale, dict }: AuthSplitLayoutProps) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row w-full bg-card">
      {/* Left panel: Safaar branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center text-center p-16 bg-primary-600 text-white relative select-none rounded-r-[2.5rem] border-r-8 border-black shadow-lg">
        {/* Brand & Hero Slogan Grouped (Vertically Centered) */}
        <div className="my-auto max-w-md space-y-8 relative z-10">
          {/* Brand indicator */}
          <div className="flex justify-center items-center gap-2 w-full">
            <MaskedHeading
              text="SAFAAR"
              src="/Bukhara-old-city-golden-hour.jpeg"
              reveal="rise"
              duration={1.2}
              align="center"
              weight={900}
              textScale={0.16}
            />
          </div>

          {/* Hero slogan / value proposition */}
          <div className="w-full flex justify-center items-center mt-6">
            <MaskedHeading
              text={dict.bannerTitle}
              src="/Samarkand-Registan-cinematic.jpeg"
              reveal="wipe"
              duration={1.5}
              align="center"
              weight={800}
              textScale={0.085}
            />
          </div>
        </div>
      </div>

      {/* Right panel: Auth form */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-12 lg:w-1/2 lg:px-12 relative pt-24 lg:pt-12 bg-slate-50">
        {/* Actions header (Back button + Locale switcher) */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
          <BackButton />
          <LocaleSwitcher current={locale} light />
        </div>
        
        <div className="w-full max-w-[420px] space-y-6 bg-card border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.07),_0_10px_20px_-10px_rgba(0,0,0,0.04)] rounded-3xl p-6 sm:p-8 transition-all duration-300">
          {children}
        </div>
      </div>
    </div>
  );
}
