import type { HomeDict } from "@/i18n/dictionaries";
import { ShieldCheck, Zap, Award } from "lucide-react";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16">
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        {/* Title */}
        <h1 className="mt-5 text-3xl font-black tracking-tight text-blue-700 sm:text-5xl md:text-6xl dark:text-blue-400">
          {dict.title}
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
