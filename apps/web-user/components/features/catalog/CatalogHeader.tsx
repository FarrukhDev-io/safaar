import { type ReactNode } from "react";

export interface CatalogHeaderProps {
  icon: ReactNode;
  badge: string;
  title: string;
  subtitle: string;
  searchControls?: ReactNode;
  filterControls?: ReactNode;
}

export function CatalogHeader({
  icon,
  badge,
  title,
  subtitle,
  searchControls,
  filterControls,
}: CatalogHeaderProps) {
  return (
    <div className="mb-8 border-b border-slate-200 pb-6 dark:border-slate-800">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        {icon}
        <span>{badge}</span>
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
        {subtitle}
      </p>

      {/* Filter Controls Bar */}
      {(searchControls || filterControls) && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {searchControls && <div className="relative flex-1">{searchControls}</div>}
          {filterControls}
        </div>
      )}
    </div>
  );
}
