"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export function Checkbox({ className, label, description, ...props }: CheckboxProps) {
  return (
    <label className={cn("group flex items-start gap-3 cursor-pointer", className)}>
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
          {...props}
        />
        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-semibold text-slate-900 dark:text-white group-active:scale-[0.99] transition-transform">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
