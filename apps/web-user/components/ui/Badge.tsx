import * as React from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "border-transparent bg-primary-600 text-white hover:bg-primary-700 font-bold",
    secondary:
      "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200 font-bold",
    destructive:
      "border-transparent bg-red-600 text-white hover:bg-red-700 font-black",
    outline:
      "border-slate-300 text-slate-900 bg-white/95 backdrop-blur-md font-bold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 shadow-2xs",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
