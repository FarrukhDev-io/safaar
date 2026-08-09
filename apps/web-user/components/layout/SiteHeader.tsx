import Link from "next/link";
// No icons needed for clean desktop layout
import type { Locale } from "@/i18n/config";
import type { CommonDict } from "@/i18n/dictionaries";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { ScrollNav, type ScrollNavItem } from "./ScrollNav";
import { LocaleSwitcher } from "./LocaleSwitcher";

function AuthButtons({
  authed,
  locale,
  dict,
  orientation = "horizontal",
}: {
  authed: boolean;
  locale: Locale;
  dict: CommonDict;
  orientation?: "horizontal" | "vertical";
}) {
  const base = `/${locale}`;
  const isCol = orientation === "vertical";

  if (authed) {
    return (
      <div className={`flex gap-1.5 ${isCol ? "flex-col" : "items-center"}`}>
        <Link
          href={`${base}/account`}
          className="inline-flex h-10 items-center justify-center rounded-full px-4 text-base font-bold text-slate-900 transition-colors hover:bg-slate-100"
        >
          {dict.actions.account}
        </Link>
        <form action={logoutAction.bind(null, locale)} className={isCol ? "w-full flex" : ""}>
          <Button size="sm" variant="secondary" type="submit" className={isCol ? "w-full flex-1" : ""}>
            {dict.actions.logout}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isCol ? "flex-col" : "items-center"}`}>
      <Link
        href={`${base}/login`}
        className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 font-bold text-slate-900 shadow-[0_3px_0_rgb(203,213,225),0_4px_8px_rgba(0,0,0,0.04)] transition-all duration-150 hover:bg-slate-50 hover:text-primary-500 active:translate-y-[3px] active:shadow-none ${isCol ? "h-11 text-base" : "h-10 text-sm"}`}
      >
        {dict.actions.login}
      </Link>
      <Link
        href={`${base}/register`}
        className={`inline-flex items-center justify-center rounded-full bg-primary-500 px-5 font-bold text-white shadow-[0_3px_0_rgb(79,123,7),0_4px_10px_rgba(135,201,13,0.3)] transition-all duration-150 hover:bg-primary-400 hover:shadow-[0_3px_0_rgb(63,98,5),0_4px_12px_rgba(135,201,13,0.4)] active:translate-y-[3px] active:shadow-none ${isCol ? "h-11 text-base" : "h-10 text-sm"}`}
      >
        {dict.actions.register}
      </Link>
    </div>
  );
}

export function SiteHeader({
  locale,
  dict,
  authed,
}: {
  locale: Locale;
  dict: CommonDict;
  authed: boolean;
}) {
  const base = `/${locale}`;
  const navDict = dict.nav as typeof dict.nav & {
    transport?: string;
    carRent?: string;
    transfers?: string;
    vipTaxi?: string;
  };

  const desktopItems: ScrollNavItem[] = [
    { href: `${base}/hotels`, label: dict.nav.hotels },
    { href: `${base}/transport`, label: navDict.transport ?? "Transport" },
    { href: `${base}/restaurants`, label: dict.nav.restaurants ?? "Restaurants" },
    { href: `${base}/attractions`, label: dict.nav.attractions },
  ];

  const localeSwitcherLight = <LocaleSwitcher current={locale} light />;
  const authActions = <AuthButtons authed={authed} locale={locale} dict={dict} orientation="horizontal" />;
  const authActionsLight = <AuthButtons authed={authed} locale={locale} dict={dict} orientation="vertical" />;

  const actions = (
    <div className="flex items-center gap-2">
      {localeSwitcherLight}
      {authActions}
    </div>
  );

  return (
    <ScrollNav
      items={desktopItems}
      brand={dict.brand}
      brandHref={base}
      actions={actions}
      localeSwitcher={localeSwitcherLight}
      authActions={authActionsLight}
    />
  );
}
