"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function GuestPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        rounded="full"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="h-7 w-7 min-h-0 p-0 flex items-center justify-center border-slate-350"
        aria-label="Kamaytirish"
      >
        <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
      </Button>
      <span className="min-w-6 text-center text-sm font-bold tabular-nums text-slate-900">
        {value}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        rounded="full"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={value >= 20}
        className="h-7 w-7 min-h-0 p-0 flex items-center justify-center border-slate-350"
        aria-label="Oshirish"
      >
        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
      </Button>
    </div>
  );
}
