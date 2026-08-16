import Link from "next/link";
import { Mail, MapPin, Camera, Send } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { CommonDict } from "@/i18n/dictionaries";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function SiteFooter({
  locale,
  dict,
}: {
  locale: Locale;
  dict: CommonDict;
}) {
  const base = `/${locale}`;
  const year = new Date().getFullYear();
  const footerData = dict.footer as Record<string, unknown>;
  const sections = (footerData.sections as Record<string, string>) || {
    platform: "Platforma",
    company: "Kompaniya",
    partners: "Hamkorlik",
    contact: "Aloqa",
  };

  return (
    <footer className="mt-auto bg-black text-slate-300">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5 lg:gap-12">
          {/* Col 1: Brand & Intro */}
          <div className="flex flex-col gap-5 md:col-span-2">
            <BrandLogo href={base} brand={dict.brand} variant="dark" />
            <p className="text-sm leading-relaxed text-slate-400 pr-4 max-w-sm">
              Safaar - O'zbekistonning eng ishonchli va zamonaviy sayohat platformasi. Orzuingizdagi sayohatni biz bilan boshlang.
            </p>
            <div className="mt-2 flex items-center gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Instagram"
              >
                <Camera className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Telegram"
              >
                <Send className="h-5 w-5 -ml-0.5 mt-0.5" />
              </a>
            </div>
          </div>

          {/* Col 2: Sayohat */}
          <div className="flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sayohat</h3>
            <nav className="flex flex-col gap-3.5 text-sm text-slate-400">
              <Link href={`${base}/hotels`} className="transition-colors hover:text-white">Mehmonxonalar</Link>
              <Link href={`${base}/restaurants`} className="transition-colors hover:text-white">Restoranlar</Link>
              <Link href={`${base}/transport`} className="transition-colors hover:text-white">Transport</Link>
              <Link href={`${base}/attractions`} className="transition-colors hover:text-white">Ko'ngilochar joylar</Link>
            </nav>
          </div>

          {/* Col 3: Yordam */}
          <div className="flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yordam</h3>
            <nav className="flex flex-col gap-3.5 text-sm text-slate-400">
              <Link href={`${base}/faq`} className="transition-colors hover:text-white">FAQ</Link>
              <Link href={`${base}/support`} className="transition-colors hover:text-white">Qo'llab-quvvatlash</Link>
              <Link href={`${base}/booking`} className="transition-colors hover:text-white">Bron qilish</Link>
            </nav>
          </div>

          {/* Col 4: Legal & Safaar */}
          <div className="flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Safaar & Legal</h3>
            <nav className="flex flex-col gap-3.5 text-sm text-slate-400">
              <Link href={`${base}/about`} className="transition-colors hover:text-white">Biz haqimizda</Link>
              <Link href={`${base}/contact`} className="transition-colors hover:text-white">Biz bilan bog'lanish</Link>
              <Link href={`${base}/privacy`} className="transition-colors hover:text-white">Maxfiylik siyosati</Link>
              <Link href={`${base}/terms`} className="transition-colors hover:text-white">Foydalanish shartlari</Link>
            </nav>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {year} {dict.brand}. {dict.footer.rights}
          </p>
          <div className="text-xs text-slate-400">
            {dict.footer.secureBooking}
          </div>
        </div>
      </div>
    </footer>
  );
}
