import Link from "next/link";
import type { HotelsDict } from "@/i18n/dictionaries";

export function HotelsPagination({
  basePath,
  params,
  page,
  totalPages,
  dict,
}: {
  basePath: string;
  params: Record<string, string>;
  page: number;
  totalPages: number;
  dict: HotelsDict["pagination"];
}) {
  if (totalPages <= 1) return null;

  function href(target: number): string {
    const q = new URLSearchParams(params);
    if (target <= 1) q.delete("page");
    else q.set("page", String(target));
    const s = q.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  }

  const label = dict.pageOf
    .replace("{page}", String(page))
    .replace("{total}", String(totalPages));

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-3"
      aria-label="Pagination"
    >
      <PageLink href={href(page - 1)} disabled={page <= 1}>
        {dict.prev}
      </PageLink>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-700" aria-current="page">
        {label}
      </span>
      <PageLink href={href(page + 1)} disabled={page >= totalPages}>
        {dict.next}
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const base = "rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-150 shadow-2xs";
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${base} border-slate-200 text-slate-300 bg-card opacity-40`}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} border-slate-300 bg-card text-slate-900 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 active:scale-[0.97]`}
    >
      {children}
    </Link>
  );
}
