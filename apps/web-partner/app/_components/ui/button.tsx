import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../_lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Yuklanmoqda holati — spinner ko'rsatadi va o'chirib qo'yadi. */
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 hover:brightness-110 active:brightness-95 disabled:bg-brand-300 disabled:from-brand-300 disabled:to-brand-300 disabled:shadow-none border border-white/10",
  secondary:
    "bg-zinc-800 text-white hover:bg-zinc-900 shadow-sm border border-zinc-700 active:bg-zinc-950 disabled:bg-zinc-400 disabled:border-transparent dark:bg-white/10 dark:hover:bg-white/15 dark:border-white/5",
  outline:
    "border-2 border-[var(--border)] bg-transparent text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-hover)]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-hover)]",
  subtle:
    "bg-[var(--surface-muted)] text-[var(--foreground)] border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-hover)]",
  danger:
    "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:brightness-110 active:brightness-95 disabled:from-red-300 disabled:to-red-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-xs gap-1.5 rounded-[var(--radius-button)]",
  md: "h-10 px-5 text-sm gap-2 rounded-[var(--radius-button)]",
  lg: "h-12 px-6 text-base gap-2.5 rounded-[var(--radius-button)]",
  icon: "h-10 w-10 rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    type = "button",
    loading,
    disabled,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[var(--background)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      {children}
    </button>
  );
});
