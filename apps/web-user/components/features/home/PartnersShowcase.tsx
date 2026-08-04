import Image from "next/image";
import { api } from "@/lib/api";
import type { HomeDict } from "@/i18n/dictionaries";

export async function PartnersShowcase({
  dict,
}: {
  dict: HomeDict["partners"];
}) {
  const partners = await api.catalog.getPartnersShowcase();

  if (!partners || partners.length === 0) return null;

  return (
    <section
      aria-labelledby="partners-showcase-heading"
      className="relative overflow-hidden border-t border-slate-200/80 bg-slate-50/60 py-12 sm:py-16 dark:border-slate-800/80 dark:bg-slate-950/40"
    >
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
            ★ {dict.title}
          </span>
          <h2
            id="partners-showcase-heading"
            className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
          >
            {dict.subtitle}
          </h2>
        </div>

        {/* Logo showcase */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="group relative flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-xs backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500/30 hover:bg-card hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-primary-500/40 dark:hover:bg-slate-900"
            >
              {partner.logoUrl ? (
                <div className="relative h-7 w-28 sm:h-8">
                  <Image
                    src={partner.logoUrl}
                    alt={partner.companyName}
                    fill
                    sizes="120px"
                    className="object-contain opacity-80 transition-opacity duration-200 group-hover:opacity-100"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    {partner.companyName.charAt(0)}
                  </span>
                  <span className="text-xs font-bold tracking-tight text-slate-700 transition-colors group-hover:text-primary-600 dark:text-slate-300 dark:group-hover:text-primary-400 sm:text-sm">
                    {partner.companyName}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
