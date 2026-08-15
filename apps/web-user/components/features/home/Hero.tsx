import type { HomeDict } from "@/i18n/dictionaries";
import { ShieldCheck, CalendarRange, Headset, Lock } from "lucide-react";

export function Hero({ dict }: { dict: HomeDict["hero"] }) {
  return (
    <section className="relative overflow-hidden -mt-20 pt-28 pb-12 sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20">
      {/* Background Image Container with rich overlay */}
      <div className="absolute inset-0 -z-20 bg-slate-950">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90 scale-105 transition-all duration-[10000ms] ease-out select-none"
          style={{ backgroundImage: "url('/Samarkand-Registan-cinematic.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-8 space-y-6">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
              Orzuyingizdagi <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                sayohatni
              </span> <br />
              bugun boshlang
            </h1>
            
            <p className="max-w-xl text-base font-medium leading-relaxed text-slate-300 sm:text-lg">
              {dict.subtitle}
            </p>

            {/* Feature row */}
            <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4 lg:pt-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-400 backdrop-blur-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[13px] font-semibold leading-snug text-slate-300">
                  Eng yaxshi narx kafolati
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-400 backdrop-blur-xs">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <span className="text-[13px] font-semibold leading-snug text-slate-300">
                  Tez va oson bron qilish
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-400 backdrop-blur-xs">
                  <Headset className="h-5 w-5" />
                </div>
                <span className="text-[13px] font-semibold leading-snug text-slate-300">
                  24/7 qo'llab-quvvatlash
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-400 backdrop-blur-xs">
                  <Lock className="h-5 w-5" />
                </div>
                <span className="text-[13px] font-semibold leading-snug text-slate-300">
                  Xavfsiz to'lov va ma'lumotlar
                </span>
              </div>
            </div>
          </div>

          {/* Right Floating Promotional Box */}
          <div className="lg:col-span-4 flex justify-end">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md dark:border-slate-800/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 3a2 2 0 100-4H4a2 2 0 100 4m16 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9m16 0H4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white">
                  Aksiyalar va chegirmalar
                </h3>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-300">
                Har kuni yangi takliflar va maxsus chegirmalarni kashf eting.
              </p>
              <button 
                type="button"
                className="w-full rounded-2xl bg-white/10 py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-95"
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
