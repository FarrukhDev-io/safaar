import { cn } from "@/lib/cn";

export type Variant = "primary" | "accent" | "secondary" | "ghost";
export type Size = "sm" | "md" | "lg";
export type Rounded = "full" | "2xl" | "xl" | "lg" | "md" | "sm";

export const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_0_#0369a1,0_6px_12px_rgba(2,132,199,0.25)] hover:bg-primary-500 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_0_0_#0369a1,0_8px_16px_rgba(2,132,199,0.35)] active:translate-y-1 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_0_0_#0369a1] transition-all duration-150 ease-out disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0",
  accent:
    "bg-amber-500 text-slate-950 font-extrabold shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_3px_0_0_#b45309,0_6px_12px_rgba(245,158,11,0.25)] hover:bg-amber-400 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_4px_0_0_#b45309,0_8px_16px_rgba(245,158,11,0.35)] active:translate-y-1 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_0_0_#b45309] transition-all duration-150 ease-out disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0",
  secondary:
    "bg-white text-slate-800 border border-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_3px_0_0_#cbd5e1,0_6px_12px_rgba(0,0,0,0.06)] hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_0_0_#94a3b8,0_8px_16px_rgba(0,0,0,0.08)] active:translate-y-1 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08),0_1px_0_0_#cbd5e1] dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_3px_0_0_#1e293b,0_6px_12px_rgba(0,0,0,0.35)] dark:hover:bg-slate-800 transition-all duration-150 ease-out disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0",
  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.97] dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-150 disabled:bg-transparent disabled:text-slate-300",
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
