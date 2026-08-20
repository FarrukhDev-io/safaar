import type { PromoView } from "@safaar/api-client";
import { PromoCodeCard } from "./PromoCodeCard";

export function PromoCodesSection({ promos }: { promos: PromoView[] }) {
  if (promos.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          Promo-kodlar
        </h2>
        <p className="mt-0.5 text-xs font-semibold text-slate-600 sm:text-sm dark:text-slate-400">
          Bron qilishda ushbu kodlardan foydalanib chegirma oling
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {promos.map((promo) => (
          <PromoCodeCard key={promo.code} promo={promo} />
        ))}
      </div>
    </section>
  );
}
