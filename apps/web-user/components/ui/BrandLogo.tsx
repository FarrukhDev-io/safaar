import Link from "next/link";
import { Compass } from "lucide-react";
import { cn } from "@/lib/cn";

interface BrandLogoProps {
  href: string;
  brand: string;
  className?: string;
  variant?: "dark" | "light";
}

export function BrandLogo({ href, brand, className, variant = "light" }: BrandLogoProps) {
  const isDark = variant === "dark";

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2 overflow-hidden rounded-xl py-1 pl-1 pr-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-transform active:scale-95",
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:-rotate-12 dark:bg-primary-500">
        <Compass className="h-5 w-5" />
      </div>
      
      <span className={cn(
        "relative font-black tracking-wide text-xl sm:text-2xl transition-colors",
        isDark ? "text-white" : "text-slate-900 dark:text-white"
      )}>
        {brand}
        <span 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-600 to-transparent bg-clip-text text-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:via-primary-400"
          aria-hidden="true"
        >
          {brand}
        </span>
      </span>
    </Link>
  );
}
