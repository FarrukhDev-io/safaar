"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../../_hooks/use-body-scroll-lock";
import { useMounted } from "../../_hooks/use-mounted";
import { cn } from "../../_lib/utils/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
}

const sizes = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

/**
 * O'ngdan chiquvchi slide-over drawer. Modern PMS/CMS'larda ishlatiladigan
 * pattern (Airbnb Host, Vercel, Linear...).
 *
 * Portal orqali `document.body`ga renderlanadi — ajdodlardagi `transform`
 * fixed positioning'ni buzmasin.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  size = "lg",
  footer,
}: DrawerProps) {
  const mounted = useMounted();
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100]",
        !open && "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          "absolute right-0 top-0 flex h-full w-full flex-col border-l border-[var(--border)] bg-[var(--panel-gradient)] shadow-2xl transition-transform duration-300 ease-out",
          sizes[size],
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-muted)] px-6 py-4">
          <div className="flex flex-col gap-1">
            <h2
              id="drawer-title"
              className="text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm text-[var(--muted-foreground)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="-mr-2 rounded-md p-1.5 text-zinc-500 transition-all hover:-translate-y-px hover:bg-[var(--surface)] hover:text-zinc-900 hover:shadow-sm dark:hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-muted)] px-6 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
