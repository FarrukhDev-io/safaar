"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface CategoryTab {
  key: string;
  href?: string;
  label: string;
  icon?: React.ElementType;
  isActive?: boolean;
  onClick?: () => void;
}

export interface CategoryTabsProps {
  tabs: CategoryTab[];
}

export function CategoryTabs({ tabs }: CategoryTabsProps) {
  const pathname = usePathname();

  return (
    <div className="relative mb-4 w-full">
      {/* Fade gradients for scrolling indication - Left */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-4 z-10 w-8 bg-gradient-to-r from-slate-50 to-transparent md:hidden" />

      <div className="scrollbar-none relative z-0 flex w-full gap-3 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory px-4 md:justify-center md:px-0">
        {tabs.map((tab) => {
          const isTabActive = tab.isActive !== undefined 
            ? tab.isActive 
            : (tab.href && pathname ? (pathname === tab.href || pathname.startsWith(tab.href + "?")) : false);
          
          const Icon = tab.icon;
          
          const className = cn(
            "group relative flex shrink-0 cursor-pointer snap-center items-center justify-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200",
            isTabActive
              ? "bg-primary-50 text-primary-700 ring-1 ring-primary-600 shadow-sm"
              : "bg-white text-slate-600 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.08)] border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
          );

          const content = (
            <>
              {Icon && (
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isTabActive 
                      ? "text-primary-600" 
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                  strokeWidth={isTabActive ? 2.5 : 2}
                />
              )}
              <span>{tab.label}</span>
            </>
          );

          return tab.href ? (
            <Link key={tab.key} href={tab.href} className={className} onClick={tab.onClick}>
              {content}
            </Link>
          ) : (
            <button key={tab.key} type="button" onClick={tab.onClick} className={className}>
              {content}
            </button>
          );
        })}
      </div>
      
      {/* Fade gradients for scrolling indication - Right */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-4 z-10 w-12 bg-gradient-to-l from-slate-50 to-transparent md:hidden" />
    </div>
  );
}
