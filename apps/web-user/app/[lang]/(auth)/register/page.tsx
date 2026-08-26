import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSession } from "@/lib/auth/session";
import { RegisterForm } from "../_components/RegisterForm";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const sp = await searchParams;
  const nextRaw = sp.next;
  const next = typeof nextRaw === "string" && nextRaw.startsWith("/")
    ? nextRaw
    : "";

  const social = typeof sp.social === "string" ? sp.social : "";
  const registrationToken =
    typeof sp.registrationToken === "string" ? sp.registrationToken : "";
  const socialEmail = typeof sp.email === "string" ? sp.email : "";
  const socialFirstName = typeof sp.firstName === "string" ? sp.firstName : "";
  const socialLastName = typeof sp.lastName === "string" ? sp.lastName : "";

  // SENIOR OPTIMIZATION: Parallelize session check and dictionary loading
  const [session, dict] = await Promise.all([
    getSession(),
    getDictionary(locale, "auth"),
  ]);

  if (session) {
    redirect(next || `/${locale}`);
  }

  return (
    <RegisterForm
      locale={locale}
      next={next}
      dict={dict}
      socialProvider={social && registrationToken ? social : undefined}
      registrationToken={registrationToken || undefined}
      socialEmail={socialEmail || undefined}
      socialFirstName={socialFirstName || undefined}
      socialLastName={socialLastName || undefined}
    />
  );
}
