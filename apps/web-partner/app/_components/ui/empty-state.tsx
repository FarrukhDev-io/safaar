import type { ReactNode } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "../../_lib/utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-card px-6 py-10 text-center",
        "before:absolute before:inset-x-8 before:top-4 before:h-px before:bg-gradient-to-r before:from-transparent before:via-brand-200 before:to-transparent dark:before:via-brand-800",
        className,
      )}
    >
      {icon && (
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-brand-50 to-accent-50 text-brand-600 ring-1 ring-brand-100 dark:from-brand-950/40 dark:to-accent-950/30 dark:text-brand-300 dark:ring-brand-900/60">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function LoadingState({ title = "Yuklanmoqda...", description = "Iltimos kutib turing", className }: { title?: string; description?: string; className?: string }) {
  return (
    <EmptyState 
      className={className}
      icon={<Loader2 className="animate-spin h-6 w-6" />} 
      title={title} 
      description={description} 
    />
  );
}

export function ErrorState({ title = "Xatolik yuz berdi", description, action, className }: { title?: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <EmptyState 
      className={className}
      icon={<AlertCircle className="h-6 w-6 text-red-500" />} 
      title={title} 
      description={description} 
      action={action} 
    />
  );
}
