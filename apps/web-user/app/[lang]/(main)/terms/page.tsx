import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang as Locale, "static");
  return { title: dict.terms.title };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const dict = await getDictionary(locale, "static");
  const { terms } = dict;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {terms.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {terms.updated}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {terms.sections.map((section, index) => (
          <section key={index} className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{section.heading}</h2>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
