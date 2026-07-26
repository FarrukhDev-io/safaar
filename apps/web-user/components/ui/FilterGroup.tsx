"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FilterGroupProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function FilterGroup({
  title,
  defaultExpanded = true,
  children,
}: FilterGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-slate-100 py-3 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-2.5 flex flex-col gap-2 transition-all">
          {children}
        </div>
      )}
    </div>
  );
}
