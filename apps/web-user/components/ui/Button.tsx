"use client";

import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";
type Rounded = "full" | "2xl" | "xl" | "lg" | "md" | "sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-md hover:shadow-lg hover:bg-primary-500 active:scale-[0.98] transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none",
  accent:
    "bg-accent-600 text-white shadow-md hover:shadow-lg hover:bg-accent-500 active:scale-[0.98] transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none",
  secondary:
    "border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-150 disabled:bg-white disabled:border-slate-100 disabled:text-slate-300 disabled:shadow-none",
  ghost:
    "text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition-all duration-150 disabled:bg-transparent disabled:text-slate-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-[44px] h-9 px-3.5 text-xs font-bold sm:min-h-[36px] sm:h-9",
  md: "min-h-[44px] h-11 px-4.5 text-sm font-bold",
  lg: "min-h-[48px] h-12 px-6 text-base font-extrabold",
};

const roundedClasses: Record<Rounded, string> = {
  full: "rounded-full",
  "2xl": "rounded-2xl",
  xl: "rounded-xl",
  lg: "rounded-lg",
  md: "rounded-md",
  sm: "rounded-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  rounded?: Rounded;
  /** Yuklanish holati: spinner ko'rsatadi, tugmani o'chiradi (aria-busy). */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  rounded = "xl",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses[rounded],
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
