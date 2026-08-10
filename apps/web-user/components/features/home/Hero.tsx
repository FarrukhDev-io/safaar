import type { HomeDict } from "@/i18n/dictionaries";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16">
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        {/* Title */}
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          {dict.title}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-relaxed text-slate-600 sm:text-lg md:text-xl">
          {dict.subtitle}
        </p>
      </div>
    </section>
  );
}
