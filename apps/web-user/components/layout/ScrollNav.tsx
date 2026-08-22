"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/ui/BrandLogo";

export type ScrollNavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  exact?: boolean;
  children?: ScrollNavItem[];
};

interface Props {
  items: ScrollNavItem[];
  brand: string;
  brandHref: string;
  actions: React.ReactNode;
  localeSwitcher?: React.ReactNode;
  authActions?: React.ReactNode;
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}



function getNavLinkClasses(active: boolean, mobile = false) {
  if (mobile) {
    return cn(
      "font-extrabold transition-all duration-150 outline-none flex h-12 items-center gap-3 w-full rounded-2xl px-4 text-[15px]",
      active
        ? "bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400"
        : "text-slate-900 hover:bg-slate-100/80 hover:text-primary-600 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
    );
  }
  
  return cn(
    "relative inline-flex h-10 items-center justify-center gap-1.5 px-3 text-[15px] font-extrabold transition-colors duration-200 outline-none",
    "after:absolute after:bottom-1 after:left-3 after:right-3 after:h-[2px] after:rounded-full after:transition-transform after:duration-300 after:origin-center",
    active
      ? "text-primary-600 after:scale-x-100 after:bg-primary-600 dark:text-primary-400 dark:after:bg-primary-400"
      : "text-slate-900 hover:text-primary-600 after:scale-x-0 hover:after:scale-x-100 after:bg-primary-600 dark:text-slate-200 dark:hover:text-primary-400 dark:after:bg-primary-400"
  );
}

function getChildNavLinkClasses(active: boolean) {
  return cn(
    "flex items-center gap-2.5 font-bold transition-all duration-150 rounded-xl w-full h-11 px-3.5 text-[15px] outline-none",
    active
      ? "bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400"
      : "text-slate-900 hover:bg-slate-100/80 hover:text-primary-600 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
  );
}

function NavDropdown({ item, pathname }: { item: ScrollNavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setOpen(true);
  }

  function handleMouseLeave() {
    hoverTimeout.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const activeChild = item.children?.find(
    (c) => isActive(pathname, c.href, c.exact),
  );
  const displayItem = activeChild ?? item;
  const active = Boolean(activeChild) || isActive(pathname, item.href, item.exact);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={displayItem.label}
        className={getNavLinkClasses(active, false)}
      >
        {displayItem.icon}
        <span className="text-base font-bold tracking-wide">{displayItem.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-slate-400 dark:text-slate-500", open && "rotate-180")} />

      </button>

      {open && item.children && (
        <div
          role="menu"
          aria-label={item.label}
          className="absolute left-0 top-full mt-1.5 w-56 rounded-2xl border border-slate-200 bg-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {item.children.map((child) => {
            const childActive = isActive(pathname, child.href, child.exact);
            return (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={getChildNavLinkClasses(childActive)}
              >
                <span className="flex h-5 w-5 items-center justify-center">{child.icon}</span>
                <span className="text-sm font-bold">{child.label}</span>

              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileAccordionGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: ScrollNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const isGroupActive = item.children?.some((child) =>
    isActive(pathname, child.href, child.exact),
  );
  const [expanded, setExpanded] = useState(isGroupActive ?? false);

  return (
    <div className="py-1 border-b border-slate-100 last:border-0 dark:border-slate-800/60">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors rounded-xl",
          isGroupActive ? "text-primary-600 bg-primary-50/80 dark:bg-primary-950/40" : "text-slate-500 hover:bg-slate-50",
        )}
      >
        <span className="flex items-center gap-2">
          {item.icon}
          <span>{item.label}</span>
        </span>
        <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-90")} />
      </button>

      {expanded && item.children && (
        <div className="mt-1 grid grid-cols-1 gap-1 pl-3">
          {item.children.map((child) => {
            const childActive = isActive(pathname, child.href, child.exact);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                aria-current={childActive ? "page" : undefined}
                className={getChildNavLinkClasses(childActive)}
              >
                <span className="flex h-5 w-5 items-center justify-center">{child.icon}</span>
                <span className="text-sm font-bold">{child.label}</span>

              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ScrollNav({ items, brand, brandHref, actions, localeSwitcher, authActions }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Body Scroll Lock for Mobile Drawer
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Keyboard Escape listener for Mobile Drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <>
      {/* ═══ Mobile header ═══ */}
      <header className="mt-2 sticky top-2 z-100 mx-4 flex h-14 items-center justify-between rounded-2xl bg-white/95 px-5 text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.15)] backdrop-blur-md md:hidden dark:bg-slate-950/95 dark:text-white">
        <BrandLogo href={brandHref} brand={brand} />
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ═══ Mobile drawer ═══ */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-90 bg-slate-950/60 backdrop-blur-sm transition-opacity md:hidden animate-in fade-in duration-200"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav
            aria-label="Mobil navigatsiya"
            className="fixed inset-x-3.5 top-18 z-100 max-h-[calc(100vh-5.5rem)] overflow-y-auto overflow-x-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-4.5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-3 duration-200 dark:border-slate-800 dark:bg-slate-900/95"
          >
            {/* Header label inside drawer */}
            <div className="mb-3 flex items-center justify-between px-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Menyu
              </span>
              <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              {items.map((item) => {
                if (item.children && item.children.length > 0) {
                  return (
                    <MobileAccordionGroup
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  );
                }
                const active = isActive(pathname, item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-12.5 items-center justify-between w-full rounded-2xl px-3 text-[15px] font-bold transition-all duration-150 active:scale-[0.98]",
                      active
                        ? "bg-primary-50 text-primary-700 shadow-xs dark:bg-primary-950/40 dark:text-primary-400"
                        : "text-slate-800 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon && (
                        <span
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150",
                            active
                              ? "bg-primary-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          )}
                        >
                          {item.icon}
                        </span>
                      )}
                      <span className="text-[15px] font-bold tracking-tight">{item.label}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform duration-150",
                        active ? "text-primary-600 translate-x-0.5" : "text-slate-300 group-hover:text-slate-500"
                      )}
                    />
                  </Link>
                );
              })}
            </div>

            <hr className="my-4 border-slate-100 dark:border-slate-800" />
            <div className="space-y-3 px-0.5">
              {localeSwitcher && (
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-2 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="pl-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Til / Language
                  </span>
                  {localeSwitcher}
                </div>
              )}
              {authActions && (
                <div className="flex flex-col gap-2 pt-1">
                  {authActions}
                </div>
              )}
            </div>
          </nav>
        </>
      )}

      {/* ═══ Desktop navbar ═══ */}
      <nav className="mt-4 sticky top-4 z-100 hidden mx-4 md:mx-auto w-[96%] max-w-[1536px] rounded-2xl bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.15)] backdrop-blur-md md:block dark:bg-slate-950/95">
        <div className="mx-auto flex h-14 w-full items-center justify-between px-6 md:px-8">
          <BrandLogo href={brandHref} brand={brand} className="shrink-0" />

          <div className="flex items-center gap-1">
            {items.map((item) => {
              if (item.children) {
                return <NavDropdown key={item.href} item={item} pathname={pathname} />;
              }
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={getNavLinkClasses(active, false)}
                >
                  {item.icon}
                  <span className="text-base font-bold tracking-wide">{item.label}</span>

                </Link>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
        </div>
      </nav>
    </>
  );
}
