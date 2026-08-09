import { cn } from "@/lib/cn";

export type Variant = "primary" | "accent" | "secondary" | "ghost";
export type Size = "sm" | "md" | "lg";
export type Rounded = "full" | "2xl" | "xl" | "lg" | "md" | "sm";

export const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-white shadow-[0_3px_0_rgb(86,132,23),0_4px_10px_rgba(125,184,44,0.3)] hover:shadow-[0_3px_0_rgb(71,109,19),0_4px_12px_rgba(125,184,44,0.4)] hover:bg-primary-600 active:translate-y-[3px] active:shadow-none transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0",
  accent:
    "bg-accent-500 text-white shadow-[0_3px_0_rgb(180,83,9),0_4px_10px_rgba(245,158,11,0.3)] hover:shadow-[0_3px_0_rgb(146,64,14),0_4px_12px_rgba(245,158,11,0.4)] hover:bg-accent-600 active:translate-y-[3px] active:shadow-none transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0",
  secondary:
    "border border-slate-200 bg-white text-slate-900 shadow-[0_3px_0_rgb(203,213,225),0_4px_8px_rgba(0,0,0,0.04)] hover:bg-slate-50 hover:text-primary-500 active:translate-y-[3px] active:shadow-none transition-all duration-150 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0",
  ghost:
    "text-slate-700 hover:bg-slate-100 active:translate-y-[2px] transition-all duration-150 disabled:bg-transparent disabled:text-slate-300 disabled:translate-y-0",
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
    "inline-flex items-center justify-center gap-2 font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none",
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses[rounded],
    className,
  );
}
