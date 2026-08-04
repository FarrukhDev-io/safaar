"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-within:outline-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-950",
          className
        )}
      >
        <input
          type="checkbox"
          role="switch"
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <div className="pointer-events-none h-6 w-11 rounded-full bg-slate-200 transition-colors duration-200 ease-in-out peer-checked:bg-primary-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:bg-slate-800" />
        <div
          className="pointer-events-none absolute left-0.5 h-5 w-5 translate-x-0 rounded-full bg-card shadow-sm ring-0 transition-transform duration-200 ease-in-out peer-checked:translate-x-5"
        />
      </label>
    );
  }
);
Switch.displayName = "Switch";
