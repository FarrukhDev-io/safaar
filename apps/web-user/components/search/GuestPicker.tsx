"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function GuestPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 bg-slate-50 text-slate-800 transition-all duration-150 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 active:scale-90 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-800"
        aria-label="Kamaytirish"
      >
        <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
      </button>
      <span className="min-w-6 text-center text-base font-bold tabular-nums text-slate-900">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={value >= 20}
        className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 bg-slate-50 text-slate-800 transition-all duration-150 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 active:scale-90 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-800"
        aria-label="Oshirish"
      >
        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}
