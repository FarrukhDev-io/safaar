import Link from "next/link";
import { Mail, Phone, MapPin, Camera, Send } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { CommonDict } from "@/i18n/dictionaries";

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
  const sections = footerData.sections || {
    platform: "Platforma",
    company: "Kompaniya",
    partners: "Hamkorlik",
    contact: "Aloqa",
  };

  return (
    <footer className="mt-auto bg-[#013E94] text-slate-300">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 lg:gap-12">
          {/* Col 1: Brand & Intro */}
          <div className="flex flex-col gap-5">
            <Link
              href={base}
              className="text-3xl font-black tracking-tight text-white transition-opacity hover:opacity-90"
            >
              {dict.brand}
            </Link>
            <p className="text-sm leading-relaxed text-slate-300 pr-4">
              {dict.footer.tagline}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Instagram"
              >
                <Camera className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Telegram"
              >
                <Send className="h-5 w-5 -ml-0.5 mt-0.5" />
              </a>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-white">{sections.platform}</h3>
            <nav className="flex flex-col gap-3 text-sm">
              <Link
                href={`${base}/hotels`}
                className="transition-colors hover:text-white hover:underline"
              >
                {dict.nav.hotels}
              </Link>
              <Link
                href={`${base}/dachas`}
                className="transition-colors hover:text-white hover:underline"
              >
                {dict.nav.dachas}
              </Link>
              <Link
                href={`${base}/transport`}
                className="transition-colors hover:text-white hover:underline"
              >
                {dict.nav.transport}
              </Link>
              <Link
                href={`${base}/attractions`}
                className="transition-colors hover:text-white hover:underline"
              >
                {dict.nav.attractions}
              </Link>
            </nav>
          </div>

          {/* Col 3: Company */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-white">{sections.company}</h3>
            <nav className="flex flex-col gap-3 text-sm">
              <Link
                href={`${base}/about`}
                className="transition-colors hover:text-white hover:underline"
              >
                {dict.nav.about}
              </Link>
              <Link
                href={`${base}/help`}
                className="transition-colors hover:text-white hover:underline"
              >
                {dict.nav.help}
              </Link>
              <Link
                href={`${base}/terms`}
                className="transition-colors hover:text-white hover:underline"
              >
                {dict.nav.terms}
              </Link>
              <a
                href="https://partner.safaar.uz"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 font-semibold text-amber-400 transition-colors hover:text-amber-300 hover:underline"
              >
                {dict.footer.partner}
              </a>
            </nav>
          </div>

          {/* Col 4: Contact */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-white">{sections.contact}</h3>
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
                <span className="leading-relaxed">
                  O'zbekiston, Toshkent shahri,<br />Yunusobod tumani
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-white/70" />
                <a
                  href={`tel:${dict.footer.phone.replace(/\s+/g, "")}`}
                  className="transition-colors hover:text-white hover:underline"
                >
                  {dict.footer.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-white/70" />
                <a
                  href={`mailto:${dict.footer.email}`}
                  className="transition-colors hover:text-white hover:underline"
                >
                  {dict.footer.email}
                </a>
              </li>
            </ul>
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
