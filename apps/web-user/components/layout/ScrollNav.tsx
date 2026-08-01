"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type ScrollNavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
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
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
          active
            ? "border border-white/60 bg-white/20 text-white shadow-xs"
            : "text-white/95 hover:bg-white/15 hover:text-white",
        )}
      >
        {displayItem.icon}
        <span className="text-sm font-bold tracking-wide">{displayItem.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-white/90", open && "rotate-180")} />
      </button>

      {open && item.children && (
        <div
          role="menu"
          aria-label={item.label}
          className="absolute left-0 top-full mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {item.children.map((child) => {
            const childActive = isActive(pathname, child.href, child.exact);
            return (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all",
                  childActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
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
          isGroupActive ? "text-blue-600 bg-blue-50/80 dark:bg-blue-950/40" : "text-slate-500 hover:bg-slate-50",
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
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                  childActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                )}
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
      <header className="sticky top-0 z-100 flex h-14 items-center justify-between border-b border-sky-300/30 bg-blue-600 px-4 text-white md:hidden shadow-xs backdrop-blur-md">
        <Link href={brandHref} className="font-black tracking-wide text-lg sm:text-xl text-white">
          {brand}
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Menyuni yopish" : "Menyuni ochish"}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ═══ Mobile drawer ═══ */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-90 bg-black/50 backdrop-blur-xs transition-opacity md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav
            aria-label="Mobil navigatsiya"
            className="fixed inset-x-3 top-16 z-100 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl md:hidden animate-in fade-in slide-in-from-top-2 duration-150 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="space-y-1">
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
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors",
                      active
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800",
                    )}
                  >
                    <span className="flex h-6 w-6 items-center justify-center">{item.icon}</span>
                    <span className="text-sm font-bold">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <hr className="my-4 border-slate-100 dark:border-slate-800" />
            <div className="space-y-3 px-1 py-1">
              {localeSwitcher && (
                <div className="flex justify-center">{localeSwitcher}</div>
              )}
              {authActions && (
                <div className="flex flex-col gap-2">
                  {authActions}
                </div>
              )}
            </div>
          </nav>
        </>
      )}

      {/* ═══ Desktop navbar ═══ */}
      <nav className="sticky top-0 z-100 hidden border-b border-sky-300/30 bg-blue-600 shadow-md md:block">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href={brandHref} className="shrink-0 font-black tracking-wide text-lg sm:text-xl text-white">
            {brand}
          </Link>

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
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                    active
                      ? "border border-white/60 bg-white/20 text-white shadow-xs"
                      : "text-white/95 hover:bg-white/15 hover:text-white",
                  )}
                >
                  {item.icon}
                  <span className="text-sm font-bold tracking-wide">{item.label}</span>
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
