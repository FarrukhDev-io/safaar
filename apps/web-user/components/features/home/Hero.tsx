import Image from "next/image";
import type { HomeDict } from "@/i18n/dictionaries";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative flex min-h-[42vh] min-h-[420px] w-full flex-col items-center justify-center overflow-hidden -mt-16 md:-mt-[72px]">
      {/* Background image */}
      <Image
        src="/samarqans.jpg"
        alt="Safaar — Samarqand"
        fill
        priority
        className="object-cover object-top"
        sizes="100vw"
        quality={85}
      />

      {/* Gradient overlay — from design system (from-black/65 via-black/20 to-transparent) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/10" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-[128px] pb-28 text-center sm:px-6 lg:pt-[172px] lg:pb-36">
        {/* H1 — Display scale: Manrope 900, tracking tight */}
        <h1
          className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl
            drop-shadow-md
            animate-in fade-in zoom-in-95 duration-700"
          style={{ fontFamily: "var(--font-manrope, sans-serif)" }}
        >
          {dict.title}
        </h1>

        {/* Subtitle — Body LG: Inter 400 */}
        <p
          className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-white/85 sm:text-lg
            animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both
            drop-shadow-sm"
        >
          {dict.subtitle}
        </p>
      </div>
    </section>
  );
}
