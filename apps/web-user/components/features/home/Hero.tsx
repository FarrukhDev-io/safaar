import type { HomeDict } from "@/i18n/dictionaries";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative w-full bg-white pt-16 pb-12 sm:pt-20 sm:pb-16 lg:pt-28 lg:pb-20 text-center flex flex-col items-center justify-center">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[4rem] leading-tight sm:leading-tight lg:leading-[1.1] max-w-4xl mx-auto">
          {dict.title1} <span className="text-blue-600">{dict.titleHighlight}</span> {dict.title2}
        </h1>
        <p className="mt-4 sm:mt-6 text-base text-slate-500 font-medium sm:text-xl max-w-2xl mx-auto leading-relaxed">
          {dict.subtitle}
        </p>
      </div>
    </section>
  );
}
