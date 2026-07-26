"use client";

import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-btn hover:bg-primary-500 hover:shadow-btn-hover active:bg-primary-700 active:shadow-btn-active active:scale-[0.97] transition-all duration-150",
  accent:
    "bg-accent-600 text-white shadow-btn hover:bg-accent-500 hover:shadow-btn-hover active:bg-accent-700 active:shadow-btn-active active:scale-[0.97] transition-all duration-150",
  secondary:
    "border border-slate-200 bg-white text-slate-900 shadow-btn hover:bg-slate-50 hover:border-slate-300 hover:shadow-btn-hover active:bg-slate-100 active:shadow-btn-active active:scale-[0.97] transition-all duration-150",
  ghost:
    "text-slate-700 hover:bg-slate-100 active:bg-slate-200 active:scale-[0.97] transition-all duration-150",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-[44px] h-9 px-3.5 text-xs font-bold sm:min-h-[36px] sm:h-9",
  md: "min-h-[44px] h-11 px-4.5 text-sm font-bold",
  lg: "min-h-[48px] h-12 px-6 text-base font-extrabold",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Yuklanish holati: spinner ko'rsatadi, tugmani o'chiradi (aria-busy). */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-900",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
