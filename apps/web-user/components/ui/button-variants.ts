import { cn } from "@/lib/cn";

export type Variant = "primary" | "accent" | "secondary" | "ghost";
export type Size = "sm" | "md" | "lg";
export type Rounded = "full" | "2xl" | "xl" | "lg" | "md" | "sm";

export const variantClasses: Record<Variant, string> = {
  // ── Safaar Blue (Primary CTA) ─────────────────────────────
  primary:
    "bg-primary-600 text-white font-bold " +
    "shadow-sm hover:shadow-md " +
    "hover:bg-primary-700 hover:-translate-y-[1px] " +
    "active:translate-y-0 active:shadow-sm " +
    "transition-all duration-200 ease-out " +
    "disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0",

  // ── Safaar Amber (Secondary CTA — Premium, Deals) ─────────────────────────────
  accent:
    "bg-accent-500 text-accent-950 font-extrabold " +
    "shadow-sm hover:shadow-md " +
    "hover:bg-accent-600 hover:-translate-y-[1px] text-white " +
    "active:translate-y-0 active:shadow-sm " +
    "transition-all duration-200 ease-out " +
    "disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0",

  // ── White Outlined (Secondary) ────────────────────────────────────
  secondary:
    "bg-white text-slate-800 border border-slate-200 " +
    "shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-[1px] hover:shadow-md " +
    "active:translate-y-0 active:shadow-sm " +
    "dark:bg-slate-900 dark:text-white dark:border-slate-700 " +
    "dark:hover:bg-slate-800 transition-all duration-200 ease-out " +
    "disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:border-slate-100 disabled:translate-y-0",

  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] " +
    "dark:text-slate-300 dark:hover:bg-slate-800 " +
    "transition-all duration-150 disabled:bg-transparent disabled:text-slate-300",
};

export const sizeClasses: Record<Size, string> = {
  sm: "min-h-[40px] h-10 px-3.5 text-xs font-bold",
  md: "min-h-[44px] h-11 px-4.5 text-sm font-bold",
  lg: "min-h-[48px] h-12 px-6 text-base font-extrabold",
};

export const roundedClasses: Record<Rounded, string> = {
  full: "rounded-full",
  "2xl": "rounded-2xl",
  xl: "rounded-xl",
  lg: "rounded-lg",
  md: "rounded-md",
  sm: "rounded-sm",
};

export const baseButtonClasses = 
  "inline-flex items-center justify-center gap-2 font-bold transition-all focus-visible:outline-none disabled:pointer-events-none";

export function buttonVariants({
  variant = "primary",
  size = "md",
  rounded = "lg",
  className,
}: {
  variant?: Variant;
  size?: Size;
  rounded?: Rounded;
  className?: string;
} = {}) {
  return cn(
    baseButtonClasses,
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses[rounded],
    className,
  );
}
