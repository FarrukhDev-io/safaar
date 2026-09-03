import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionHeaderProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-5 sm:mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end", className)}>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-2xl text-sm font-medium text-slate-500 sm:text-base dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
