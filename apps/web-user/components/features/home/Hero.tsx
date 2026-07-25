import type { HomeDict } from "@/i18n/dictionaries";
import { ShieldCheck, Zap, Award } from "lucide-react";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16">
      {/* Background ambient gradient glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[400px] w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-600/20 via-sky-400/15 to-emerald-500/15 blur-3xl sm:h-[480px] sm:w-[850px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        {/* Title */}
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
          <span className="bg-gradient-to-r from-blue-700 via-blue-900 to-emerald-700 bg-clip-text text-transparent dark:from-white dark:via-blue-200 dark:to-emerald-300">
            {dict.title}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-relaxed text-slate-700 sm:text-lg md:text-xl dark:text-slate-300">
          {dict.subtitle}
        </p>

        {/* Glassmorphism Trust Chips */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-extrabold text-slate-900 shadow-2xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 dark:text-white sm:text-sm">
            <Zap className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
            <span>{dict.trustChip1}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-extrabold text-slate-900 shadow-2xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 dark:text-white sm:text-sm">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
            <span>{dict.trustChip2}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-extrabold text-slate-900 shadow-2xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 dark:text-white sm:text-sm">
            <Award className="h-4 w-4 text-amber-500 shrink-0" aria-hidden />
            <span>100% Kafolatlangan Bron</span>
          </span>
        </div>
      </div>
    </section>
  );
}
