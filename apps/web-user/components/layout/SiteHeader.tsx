import Link from "next/link";
// No icons needed for clean desktop layout
import type { Locale } from "@/i18n/config";
import type { CommonDict } from "@/i18n/dictionaries";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/cn";
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
  const sizeClass = isCol ? "w-full min-h-[44px]" : "";

  if (authed) {
    return (
      <div className={`flex gap-1.5 ${isCol ? "flex-col" : "items-center"}`}>
        <Link
          href={`${base}/account`}
          className={buttonVariants({ variant: "ghost", rounded: "full", className: sizeClass })}
        >
          {dict.actions.account}
        </Link>
        <form action={logoutAction.bind(null, locale)} className={isCol ? "w-full flex" : ""}>
          <Button size="sm" variant="secondary" rounded="full" type="submit" className={isCol ? "w-full flex-1 min-h-[44px]" : ""}>
            {dict.actions.logout}
          </Button>
        </form>
      </div>
    );
  }

  const loginClasses = buttonVariants({ 
    variant: "secondary", 
    rounded: "full", 
    className: cn(sizeClass, "!h-10 min-h-[40px] px-4 text-[15px] font-bold") 
  });
  
  const registerClasses = buttonVariants({ 
    variant: "primary", 
    rounded: "full", 
    className: cn(sizeClass, "!h-10 min-h-[40px] px-4 text-[15px] font-bold") 
  });

  return (
    <div className={`flex gap-2 ${isCol ? "flex-col" : "items-center"}`}>
      <Link href={`${base}/login`} className={loginClasses}>
        {dict.actions.login}
      </Link>
      <Link href={`${base}/register`} className={registerClasses}>
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
    { href: `${base}/restaurants`, label: navDict.restaurants ?? "Restaurants" },
    { href: `${base}/transport`, label: navDict.transport ?? "Transport" },
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
