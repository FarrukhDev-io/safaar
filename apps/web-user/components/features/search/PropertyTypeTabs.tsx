"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PT_TYPES, PT_ICONS } from "./constants";
import type { PropertyType } from "./types";
import { Button } from "@/components/ui/Button";

interface Props {
  activeType: PropertyType;
  onChange: (type: PropertyType) => void;
  labels: Record<PropertyType, string>;
}

export function PropertyTypeTabs({ activeType, onChange, labels }: Props) {
  const idx = PT_TYPES.indexOf(activeType);

  function prev() {
    const i = (idx - 1 + PT_TYPES.length) % PT_TYPES.length;
    onChange(PT_TYPES[i]);
  }

  function next() {
    const i = (idx + 1) % PT_TYPES.length;
    onChange(PT_TYPES[i]);
  }

  return (
    <>
      {/* ═══ Desktop: row ═══ */}
      <div className="hidden items-center gap-1.5 sm:flex">
        {PT_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            variant={activeType === type ? "primary" : "ghost"}
            size="sm"
            rounded="full"
            onClick={() => onChange(type)}
            className="gap-1.5 border-none"
          >
            <span className="text-sm">{PT_ICONS[type]}</span>
            <span>{labels[type]}</span>
          </Button>
        ))}
      </div>

      {/* ═══ Mobil: slider ═══ */}
      <div className="flex items-center justify-center gap-3 sm:hidden">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          rounded="full"
          onClick={prev}
          className="h-9 w-9 min-h-0 p-0 flex items-center justify-center border-slate-350"
          aria-label="Oldingi"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm">
          <span>{PT_ICONS[activeType]}</span>
          <span>{labels[activeType]}</span>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          rounded="full"
          onClick={next}
          className="h-9 w-9 min-h-0 p-0 flex items-center justify-center border-slate-350"
          aria-label="Keyingi"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </>
  );
}
