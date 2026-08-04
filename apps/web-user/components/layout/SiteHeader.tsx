import Link from 'next/link';
import { Car, Hotel, MountainSnow, UtensilsCrossed } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import type { CommonDict } from '@/i18n/dictionaries';
import { logoutAction } from '@/lib/auth/actions';
import { Button } from '@/components/ui/Button';
import { ScrollNav, type ScrollNavItem } from './ScrollNav';
import { LocaleSwitcher } from './LocaleSwitcher';

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
    {
      href: `${base}/hotels`,
      label: dict.nav.hotels,
      icon: <Hotel className="h-4 w-4" />,
    },
    {
      href: `${base}/transport`,
      label: navDict.transport ?? 'Transport',
      icon: <Car className="h-4 w-4" />,
    },
    {
      href: `${base}/restaurants`,
      label: dict.nav.restaurants ?? 'Restaurants',
      icon: <UtensilsCrossed className="h-4 w-4" />,
    },
    {
      href: `${base}/attractions`,
      label: dict.nav.attractions,
      icon: <MountainSnow className="h-4 w-4" />,
    },
  ];

  const localeSwitcher = <LocaleSwitcher current={locale} />;
  const localeSwitcherLight = <LocaleSwitcher current={locale} light />;

  const authActions = authed ? (
    <div className="flex items-center gap-1.5">
      <Link
        href={`${base}/account`}
        className="inline-flex h-10 items-center justify-center rounded-full px-4 text-base font-bold text-white transition-colors hover:bg-white/20"
      >
        {dict.actions.account}
      </Link>
      <form action={logoutAction.bind(null, locale)}>
        <Button size="sm" variant="secondary" type="submit">
          {dict.actions.logout}
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link
        href={`/${locale}/login`}
        className="inline-flex h-10 items-center justify-center rounded-full border border-white/60 bg-white/10 px-5 text-sm font-bold text-white shadow-xs backdrop-blur-md transition-all duration-150 hover:bg-white/20 active:scale-[0.97]"
      >
        {dict.actions.login}
      </Link>
      <Link
        href={`/${locale}/register`}
        className="inline-flex h-10 items-center justify-center rounded-full bg-card px-5 text-sm font-bold text-primary-700 shadow-xs transition-all duration-150 hover:bg-white/95 active:scale-[0.97]"
      >
        {dict.actions.register}
      </Link>
    </div>
  );

  const authActionsLight = authed ? (
    <div className="flex items-center gap-1.5">
      <Link
        href={`${base}/account`}
        className="inline-flex h-10 items-center justify-center rounded-full px-4 text-base font-bold text-slate-900 transition-colors hover:bg-slate-100"
      >
        {dict.actions.account}
      </Link>
      <form action={logoutAction.bind(null, locale)}>
        <Button size="sm" variant="secondary" type="submit">
          {dict.actions.logout}
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      <Link
        href={`/${locale}/login`}
        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-card px-5 text-base font-bold text-slate-900 shadow-xs transition-all duration-150 hover:bg-slate-50 active:scale-[0.97]"
      >
        {dict.actions.login}
      </Link>
      <Link
        href={`/${locale}/register`}
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary-500 px-5 text-base font-bold text-white shadow-xs transition-all duration-150 hover:bg-primary-600 active:scale-[0.97]"
      >
        {dict.actions.register}
      </Link>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      {localeSwitcher}
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
