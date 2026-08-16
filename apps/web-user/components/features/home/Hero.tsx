import type { HomeDict } from "@/i18n/dictionaries";
import { ShieldCheck, CalendarCheck, Headphones, ShieldCheck as ShieldCheck2, Gift } from "lucide-react";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative overflow-hidden -mt-24 pt-32 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32">
      {/* Background Image Container with rich overlay */}
      <div className="absolute inset-0 -z-20 bg-slate-950">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95 scale-105 transition-all duration-[10000ms] ease-out select-none"
          style={{ backgroundImage: "url('/images/destinations/samarqand-registan.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1128]/95 via-[#0a1128]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-transparent opacity-100 h-full top-0" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex w-full justify-between items-center">
          
          {/* Left Text Column */}
          <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-[4.5rem] leading-[1.05]">
              Orzuyingizdagi <br />
              <span className="text-[#3b82f6]">sayohatni</span> <br />
              bugun boshlang
            </h1>
            
            <p className="max-w-xl text-lg font-medium leading-relaxed text-slate-200">
              Mehmonxonalar, restoranlar va ko'ngilochar joylarni kafolatlangan eng arzon narxlarda kashf eting.
            </p>

            {/* Feature row */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4 sm:grid-cols-4 lg:pt-6 w-max">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-white stroke-[1.5]" />
                <span className="text-xs font-semibold leading-snug text-slate-200 whitespace-pre-line">
                  Eng yaxshi{"\n"}narx kafolati
                </span>
              </div>

              <div className="flex items-center gap-3">
                <CalendarCheck className="h-6 w-6 text-white stroke-[1.5]" />
                <span className="text-xs font-semibold leading-snug text-slate-200 whitespace-pre-line">
                  Tez va oson{"\n"}bron qilish
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Headphones className="h-6 w-6 text-white stroke-[1.5]" />
                <span className="text-xs font-semibold leading-snug text-slate-200 whitespace-pre-line">
                  24/7 qo'llab-{"\n"}quvvatlash
                </span>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck2 className="h-6 w-6 text-white stroke-[1.5]" />
                <span className="text-xs font-semibold leading-snug text-slate-200 whitespace-pre-line">
                  Xavfsiz to'lov{"\n"}va ma'lumotlar
                </span>
              </div>
            </div>
          </div>

          {/* Right Floating Promotional Box */}
          <div className="hidden lg:block w-[340px]">
            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
                <Gift className="h-6 w-6 stroke-[1.5]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">
                Aksiyalar va chegirmalar
              </h3>
              <p className="mb-6 text-sm font-medium leading-relaxed text-slate-300">
                Har kuni yangi takliflar va maxsus chegirmalarni kashf eting.
              </p>
              <button 
                type="button"
                className="w-full rounded-2xl bg-white/15 py-3 text-center text-sm font-bold text-white transition-all hover:bg-white/25 active:scale-95"
              >
                Batafsil
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
