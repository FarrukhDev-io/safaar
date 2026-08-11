import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
}

export function Input({ className, error, ...props }: InputProps) {
  const hasError = Boolean(error);
  return (
    <div className="flex w-full flex-col gap-1">
      <input
        aria-invalid={hasError || undefined}
        className={cn(
          "min-h-[44px] h-11 w-full rounded-full border bg-white px-5 text-sm font-bold text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 hover:border-slate-400 focus-visible:outline-hidden dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500",
          hasError
            ? "border-red-500 text-red-900 focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-500/20 dark:border-red-500 dark:text-red-100"
            : "border-slate-300 focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500/20 dark:border-slate-700",
          className,
        )}
        {...props}
      />
      {typeof error === "string" && error.length > 0 && (
        <span role="alert" className="text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
