import type { ReactNode } from "react";
import { Building2, Sparkles, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white p-4 sm:p-6 md:p-10">
      {/* Dynamic Ambient Background Elements */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
        
        {/* Glowing gradient orbs */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-brand-600/30 via-indigo-600/20 to-transparent blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-emerald-600/25 via-teal-600/20 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/3 right-1/4 h-[350px] w-[350px] rounded-full bg-brand-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Branding Hero Showcase (visible on lg screens) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between h-full py-6 pr-4">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
                <Building2 className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Safaar <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">Partner</span>
                </h1>
                <p className="text-xs text-slate-400">Hamkorlar Paneli v2.5</p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                Biznesingizni <br />
                <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                  Raqamli Darajaga
                </span> Olib Chiqing
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Mehmonxona, Dacha, Hostel, Restoran va Rent-Car biznesingizni yagona portal orqali oson va samarali boshqaring.
              </p>

              {/* Feature Pills */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Avtomatlashtirilgan Kalendar</p>
                    <p className="text-[11px] text-slate-400">Bron va bandlik kunlarini jonli rejimda kuzating</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">100% Xavfsiz To'lovlar</p>
                    <p className="text-[11px] text-slate-400">Moliya va pul yechib olish hisobotlari shaffof</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="pt-8 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Safaar Platform.</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Tizim ishlamoqda
            </span>
          </div>
        </div>

        {/* Right Side: Glassmorphic Auth Form Container */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="relative rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl ring-1 ring-black/50">
            {/* Top mobile brand header */}
            <div className="lg:hidden flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
                <Building2 className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Safaar Hamkor Kabineti</h1>
                <p className="text-xs text-slate-400">Boshqaruv paneliga kirish</p>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

