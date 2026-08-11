import type { HomeDict } from "@/i18n/dictionaries";
import HeroSectionTextHover from "@/components/animata/hero/hero-section-text-hover";
import SoftBlurIn from "@/components/animata/text/soft-blur-in";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative overflow-hidden pt-6 pb-2 sm:pt-8 sm:pb-4 lg:pt-10 lg:pb-6">
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        {/* Title */}
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          <HeroSectionTextHover />
        </h1>

        {/* Subtitle */}
        <div className="mx-auto mt-4 max-w-2xl text-base font-bold leading-relaxed text-slate-600 sm:text-lg md:text-xl">
          <SoftBlurIn text={dict.subtitle} holdMs={999999} />
        </div>
      </div>
    </section>
  );
}
