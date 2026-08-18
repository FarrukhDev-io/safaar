import Image from "next/image";
import type { HomeDict } from "@/i18n/dictionaries";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative flex min-h-[40vh] min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4">
      {/* Orqa fon rasmi */}
      <Image
        src="/samarqans.jpg"
        alt="Safaar Samarqand"
        fill
        priority
        className="object-cover object-top"
        sizes="100vw"
        quality={85}
      />
      
      {/* Matn o'qilishi uchun qora gradient qoplama */}
      <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-16 pb-24 text-center sm:px-6 lg:pt-24 lg:pb-32">
        {/* Title */}
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl md:text-6xl animate-in fade-in zoom-in-95 duration-1000 drop-shadow-lg">
          {dict.title}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-slate-100 sm:text-lg md:text-xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both drop-shadow-md">
          {dict.subtitle}
        </p>
      </div>
    </section>
  );
}
