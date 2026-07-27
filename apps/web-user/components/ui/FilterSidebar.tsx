"use client";

import React, { useEffect } from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface FilterSidebarProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  applyLabel?: string;
  resetLabel?: string;
  children: React.ReactNode;
}

export function FilterSidebar({
  title = "Filtrlar",
  isOpen,
  onClose,
  onApply,
  onReset,
  applyLabel = "Qo'llash",
  resetLabel = "Tozalash",
  children,
}: FilterSidebarProps) {
  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-full flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:flex lg:sticky lg:top-24 lg:h-fit">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-1">{children}</div>

        <div className="flex gap-2 pt-3">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onApply}
            className="flex-1 rounded-xl"
          >
            {applyLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onReset}
            aria-label={resetLabel}
            className="rounded-xl"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer (Bottom Sheet / Modal overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />

          {/* Drawer content sheet */}
          <div className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  {title}
                </h2>
              </span>
              <Button
                type="button"
                variant="ghost"
                rounded="full"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 min-h-0 p-0 flex items-center justify-center border-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <div className="flex flex-col gap-1">{children}</div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onReset}
                className="flex-1 rounded-xl"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{resetLabel}</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  onApply();
                  onClose();
                }}
                className="flex-1 rounded-xl"
              >
                {applyLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
