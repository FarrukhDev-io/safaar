"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function Select({
  label,
  options,
  placeholder,
  className,
  id,
  "aria-label": ariaLabel,
  ...rest
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/ /g, "-");
  // A3 FIX: bir nechta filtr <select>lari (masalan /users, /partners/list,
  // /bookings/hotels) faqat `placeholder` bilan ishlatilgan — ko'zga
  // ko'rinadigan (vizual) yorliq yo'q va hech qanday aria-label ham
  // berilmagan edi, natijada screen reader uchun butunlay nomsiz element
  // qolardi. Chaqiruvchi allaqachon aniq `label` yoki `aria-label` bergan
  // bo'lsa — bu yerga tegilmaydi (ortiqcha/qo'sh ARIA bo'lmasligi uchun);
  // faqat ikkalasi ham yo'q bo'lgan holatda, allaqachon vizual jihatdan
  // maqsadni bildiruvchi `placeholder` matni fallback sifatida ishlatiladi.
  const resolvedAriaLabel = ariaLabel ?? (!label ? placeholder : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-label={resolvedAriaLabel}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)]",
            "bg-white text-[var(--text-primary)] appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]",
            "transition-all duration-150",
            "pr-9",
            className
          )}
          {...rest}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
        />
      </div>
    </div>
  );
}
