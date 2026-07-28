'use client';

import { ChevronDown, LogOut, Settings, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../_lib/utils/cn';
import { formatPhone } from '../../_lib/utils/format';
import { useAuthStore } from '../../_stores/auth-store';

interface UserMenuProps {
  name: string;
  contact: string;
  onLogout: () => void;
}

function formatContact(contact: string) {
  return contact.includes('@') ? contact : formatPhone(contact);
}

export function UserMenu({ name, contact, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  // Tashqariga bosilganda yoping
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 pl-1 pr-2.5 text-sm transition-colors hover:bg-[var(--surface-hover)]',
          open && 'bg-[var(--surface-muted)]',
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-700 text-xs font-semibold text-white">
          {initials || 'H'}
        </span>
        <span className="hidden text-left text-xs leading-tight lg:block">
          <span className="block font-medium">{name}</span>
          <span className="block text-[var(--muted-foreground)]">
            {formatContact(contact)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-zinc-400 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-card border border-[var(--border)] bg-[var(--surface)] shadow-lg fade-in"
        >
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
              {formatContact(contact)}
            </p>
          </div>
          <Link
            href="/settings/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--surface-muted)]"
          >
            <UserCircle2 className="h-4 w-4 text-zinc-500" aria-hidden />
            Profil
          </Link>
          <Link
            href="/settings/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--surface-muted)]"
          >
            <Settings className="h-4 w-4 text-zinc-500" aria-hidden />
            Sozlamalar
          </Link>
          <div className="border-t border-[var(--border)] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Panel turi
          </div>
          <div className="px-4 pb-2 text-xs font-medium text-[var(--foreground)]">
            {user?.partnerType || 'hotel'}
          </div>
          <div className="border-t border-[var(--border)]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Chiqish
          </button>
        </div>
      )}
    </div>
  );
}
