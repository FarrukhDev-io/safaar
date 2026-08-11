import { cn } from "@/lib/cn";

export type Variant = "primary" | "accent" | "secondary" | "ghost";
export type Size = "sm" | "md" | "lg";
export type Rounded = "full" | "2xl" | "xl" | "lg" | "md" | "sm";

export const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-white shadow-sm hover:shadow-md hover:bg-primary-600 active:scale-[0.98] transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:scale-100",
  accent:
    "bg-accent-500 text-white shadow-sm hover:shadow-md hover:bg-accent-600 active:scale-[0.98] transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:scale-100",
  secondary:
    "border border-slate-300 bg-white text-slate-900 shadow hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 active:scale-[0.98] transition-all duration-150 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:scale-100",
  ghost:
    "text-slate-700 hover:bg-slate-100 active:scale-[0.98] transition-all duration-150 disabled:bg-transparent disabled:text-slate-300 disabled:scale-100",
};

export const sizeClasses: Record<Size, string> = {
  sm: "min-h-[44px] h-9 px-3.5 text-xs font-bold sm:min-h-[36px] sm:h-9",
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
  rounded = "xl",
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
