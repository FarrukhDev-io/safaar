/**
 * Natijalar sahifasi yuklanayotganda darhol ko'rinadigan skeleton (CWV uchun).
 * Layout darhol chiqadi, ma'lumot kelguncha shu fallback ko'rsatiladi.
 */
export default function HotelsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      {/* Search Bar / Header Skeleton */}
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
      
      <div className="flex flex-col gap-2">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800/80" />
        <div className="h-4 w-32 animate-pulse rounded-md bg-slate-200/50 dark:bg-slate-800/50" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters Sidebar Skeleton */}
        <div className="hidden lg:block h-[600px] animate-pulse rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800" />
        
        {/* Hotel Cards Grid Skeleton */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-col gap-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-1/2 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="h-4 w-16 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="h-6 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
