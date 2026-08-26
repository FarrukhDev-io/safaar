import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSession } from "@/lib/auth/session";
import { AccountNav } from "@/components/account/AccountNav";

// Shaxsiy bo'lim — qidiruv tizimlari indekslamasin.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const session = await getSession();
  if (!session) {
    redirect(
      `/${locale}/login?next=${encodeURIComponent(`/${locale}/account`)}`,
    );
  }

  const dict = await getDictionary(locale, "account");

  return (
    <main className="mx-auto flex w-full md:w-[96%] max-w-[1536px] flex-1 flex-col gap-6 px-3 sm:px-4 md:px-8 py-6 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight">{dict.title}</h1>
      <AccountNav locale={locale} dict={dict.nav} />
      <div className="flex flex-col gap-4">{children}</div>
    </main>
  );
}
