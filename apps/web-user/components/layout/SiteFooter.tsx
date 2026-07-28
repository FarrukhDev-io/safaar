import Link from "next/link";
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

  return (
    <footer className="mt-auto bg-white border-t border-slate-100">
      <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-8">
        {/* Main row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 py-8">
          {/* Left: Brand & Contact */}
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <Link
              href={base}
              className="text-lg font-bold text-slate-800 tracking-tight hover:text-blue-600 transition-colors"
            >
              {dict.brand}
            </Link>
            <p className="text-sm text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <a
                href={`tel:${dict.footer.phone.replace(/\s+/g, "")}`}
                className="hover:text-slate-700 transition-colors"
              >
                {dict.footer.phone}
              </a>
              <span aria-hidden="true" className="text-slate-300 select-none">·</span>
              <a
                href={`mailto:${dict.footer.email}`}
                className="hover:text-slate-700 transition-colors"
              >
                {dict.footer.email}
              </a>
            </p>
          </div>

          {/* Right: Core links */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap justify-center gap-5 text-sm font-medium text-slate-500"
          >
            <Link
              href={`${base}/about`}
              className="hover:text-slate-800 transition-colors"
            >
              {dict.nav.about}
            </Link>
            <Link
              href={`${base}/help`}
              className="hover:text-slate-800 transition-colors"
            >
              {dict.nav.help}
            </Link>
            <Link
              href={`${base}/terms`}
              className="hover:text-slate-800 transition-colors"
            >
              {dict.nav.terms}
            </Link>
            <a
              href="https://partner.safaar.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800 transition-colors"
            >
              {dict.footer.partner}
            </a>
          </nav>
        </div>

        {/* Copyright bar */}
        <p className="text-xs text-slate-400 mt-0 pt-4 pb-6 border-t border-slate-100 text-center md:text-left">
          © {year} {dict.brand}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
