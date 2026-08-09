import type { ReactNode } from "react";
import { Hotel } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Dekorativ orqa fon */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950"
      />
      <div
        aria-hidden
        className="absolute -left-32 -top-32 -z-10 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl dark:bg-brand-700/20"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -right-32 -z-10 h-96 w-96 rounded-full bg-accent-300/30 blur-3xl dark:bg-accent-700/20"
      />

      <div className="w-full max-w-md fade-in">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-700/20">
            <Hotel className="h-6 w-6" aria-hidden />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Safaar Hamkor Kabineti</span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Mehmonxona va mashina ijarasi hamkorlari uchun
          </p>
        </div>
        <div className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl shadow-zinc-900/5 dark:shadow-black/20">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          © {new Date().getFullYear()} Safaar. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
