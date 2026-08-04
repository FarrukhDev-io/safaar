"use client";

import React from "react";
import { X } from "lucide-react";

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface ActiveFiltersProps {
  chips: ActiveFilterChip[];
  onClearAll: () => void;
  clearAllLabel?: string;
  className?: string;
}

export function ActiveFilters({
  chips,
  onClearAll,
  clearAllLabel = "Hammasini o'chirish",
  className = "",
}: ActiveFiltersProps) {
  if (chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.label}`}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50/70 px-3 py-1.5 text-xs font-semibold text-primary-900 transition-all hover:bg-primary-100 hover:border-primary-300 active:scale-[0.97] dark:border-primary-900/50 dark:bg-primary-950/40 dark:text-primary-300"
        >
          <span>{chip.label}</span>
          <X className="h-3.5 w-3.5 stroke-[2.5] text-primary-600 dark:text-primary-400" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded-lg border border-slate-200 bg-card px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {clearAllLabel}
      </button>
    </div>
  );
}
