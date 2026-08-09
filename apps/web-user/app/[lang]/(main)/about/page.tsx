import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Card, CardBody } from "@/components/ui/Card";
import { api, ApiRequestError } from "@/lib/api";

const ABOUT_PAGE_SLUGS: Record<Locale, string[]> = {
  uz: ["biz-haqimizda", "about"],
  ru: ["o-nas", "about"],
  en: ["about", "biz-haqimizda"],
};

async function getCmsAboutPage(locale: Locale) {
  for (const slug of ABOUT_PAGE_SLUGS[locale]) {
    try {
      return await api.cms.getPage(locale, slug);
    } catch (error) {
      if (error instanceof ApiRequestError && error.statusCode === 404) {
        continue;
      }
      return null;
    }
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const locale = lang as Locale;
  const [dict, cmsPage] = await Promise.all([
    getDictionary(locale, "static"),
    getCmsAboutPage(locale),
  ]);
  return {
    title: cmsPage?.seoTitle || cmsPage?.title || dict.about.title,
    description: cmsPage?.seoDescription || dict.about.intro,
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [dict, cmsPage] = await Promise.all([
    getDictionary(locale, "static"),
    getCmsAboutPage(locale),
  ]);
  const { about } = dict;
  const title = cmsPage?.title || about.title;
  const intro = cmsPage?.content || about.intro;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-6 py-12">
      {/* Hero */}
      <section className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {title}
        </h1>
        <p className="max-w-3xl whitespace-pre-line text-lg text-slate-600 dark:text-slate-400">
          {intro}
        </p>
      </section>

      {/* Maqsad */}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{about.missionTitle}</h2>
        <p className="max-w-3xl text-slate-600 dark:text-slate-400">
          {about.mission}
        </p>
      </section>

      {/* Qadriyatlar */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{about.valuesTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {about.values.map((value, index) => (
            <Card key={index}>
              <CardBody className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{value.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {value.text}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
