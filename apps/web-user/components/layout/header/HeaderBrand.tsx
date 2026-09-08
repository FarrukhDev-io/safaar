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
        "group flex shrink-0 items-center focus-visible:outline-none",
        className
      )}
    >
      <span className="text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-primary-600 sm:text-2xl dark:text-white">
        {brand}
      </span>
    </Link>
  );
}
