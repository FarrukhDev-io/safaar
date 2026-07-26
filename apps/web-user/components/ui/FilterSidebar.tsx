"use client";

import React, { useEffect } from "react";
import { Filter, X, RotateCcw } from "lucide-react";

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
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-95"
          >
            {applyLabel}
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label={resetLabel}
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
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
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <div className="flex flex-col gap-1">{children}</div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={onReset}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <RotateCcw className="h-4 w-4" />
                {resetLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply();
                  onClose();
                }}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700"
              >
                {applyLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
