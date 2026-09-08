import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeaderBrandProps {
  href: string;
  brand: string;
  className?: string;
}

export function HeaderBrand({ href, brand, className }: HeaderBrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex shrink-0 items-center gap-2 focus-visible:outline-none",
        className
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-105 group-active:scale-95 sm:h-10 sm:w-10">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-primary-600 sm:text-2xl dark:text-white">
        {brand}
      </span>
    </Link>
  );
}
