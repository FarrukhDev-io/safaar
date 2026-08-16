import type { HomeDict } from "@/i18n/dictionaries";
import Image from "next/image";
import { ShieldCheck, Zap, Headphones, Lock } from "lucide-react";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative w-full overflow-hidden bg-[#0F172A] pt-32 pb-48 lg:pt-40 lg:pb-56 xl:pt-48 xl:pb-64">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Samarkand-Registan-cinematic.jpeg"
          alt="Samarkand Registan - Premium Travel"
          fill
          priority
          className="object-cover object-center opacity-80"
          quality={100}
        />
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/90 via-[#0F172A]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/5 to-transparent opacity-100" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          <h1 className="text-[48px] font-extrabold tracking-tight text-white leading-[1.1] md:text-[60px] lg:text-[72px]">
            Orzuingizdagi <br />
            <span className="text-[#3B82F6]">sayohatni</span> <br />
            bugun boshlang.
          </h1>
          
          <p className="max-w-xl text-lg font-medium leading-relaxed text-slate-300 md:text-xl">
            Mehmonxonalar, restoranlar, transport va unutilmas maskanlarni bir platformada toping.
          </p>

          <div className="grid grid-cols-2 gap-y-6 gap-x-8 pt-4 md:grid-cols-4 md:pt-8 w-max">
            {[
              { icon: ShieldCheck, text: "Eng yaxshi narxlar" },
              { icon: Zap, text: "Tez va oson bron qilish" },
              { icon: Headphones, text: "24/7 qo'llab-quvvatlash" },
              { icon: Lock, text: "Xavfsiz to'lov" },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <Icon className="h-6 w-6 shrink-0 text-[#3B82F6] stroke-[2]" />
                  <span className="text-sm font-semibold leading-tight text-white md:text-[15px]">
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
