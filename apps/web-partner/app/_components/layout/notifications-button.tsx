"use client";

import { Bell, BellOff, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type BackendNotification,
} from "../../_lib/api/endpoints/notifications";
import { useAuthStore } from "../../_stores/auth-store";
import { cn } from "../../_lib/utils/cn";
import { Tooltip } from "../ui/tooltip";

function relatedHref(notification: BackendNotification): string | null {
  if (notification.related_entity_type === "hotel" && notification.related_entity_id) {
    return "/listing";
  }
  if (notification.related_entity_type === "booking" && notification.related_entity_id) {
    return `/reservations/${notification.related_entity_id}`;
  }
  return null;
}

function formatRelativeTime(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "";
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return "hozir";
  if (diffMin < 60) return `${diffMin} daq oldin`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} soat oldin`;
  return `${Math.round(diffHour / 24)} kun oldin`;
}

/**
 * Bell tugmasi — haqiqiy backend `/notifications` API'siga ulangan
 * (avval kutilayotgan bronlardan mahalliy hosil qilingan soxta ro'yxat
 * ko'rsatardi; bu ma'lumot hali ham Bronlar sahifasida real holicha
 * mavjud, bell endi haqiqiy bildirishnomalarni ko'rsatadi).
 */
export function NotificationsButton() {
  const router = useRouter();
  const token = useAuthStore((s) => s.tokens?.accessToken);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BackendNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    listNotifications(token)
      .then((page) => {
        setItems(page.items);
        setUnreadCount(page.unread_count);
        setLoaded(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30_000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!loaded) fetchNotifications();
  };

  const handleItemClick = (notification: BackendNotification) => {
    if (!notification.read_at && token) {
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(notification.id, token).catch(() => fetchNotifications());
    }
    const href = relatedHref(notification);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  const handleMarkAllRead = () => {
    if (!token) return;
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
    markAllNotificationsRead(token).catch(() => fetchNotifications());
  };

  return (
    <div ref={ref} className="relative">
      <Tooltip content="Bildirishnomalar" side="bottom">
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Bildirishnomalar (${unreadCount})`}
          aria-haspopup="menu"
          aria-expanded={open}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 && (
            <span
              className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
              aria-hidden
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-card border border-[var(--border)] bg-[var(--surface)] shadow-xl fade-in"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h3 className="text-sm font-semibold">Bildirishnomalar</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                Barchasini o'qilgan qilish
              </button>
            )}
          </div>

          {loading && items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              Yuklanmoqda...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <p className="text-sm text-red-500">Yuklab bo'lmadi</p>
              <button
                type="button"
                onClick={fetchNotifications}
                className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Qayta urinish
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <BellOff className="h-8 w-8 text-zinc-400" aria-hidden />
              <p className="text-sm font-medium">Hammasi joyida</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Yangi bildirishnomalar yo'q
              </p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((notification) => {
                const href = relatedHref(notification);
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(notification)}
                      role="menuitem"
                      className={cn(
                        "flex w-full flex-col gap-0.5 border-b border-[var(--border)] px-4 py-3 text-left last:border-0 hover:bg-[var(--surface-muted)]",
                        !notification.read_at && "bg-brand-50/50 dark:bg-brand-950/20",
                        href && "cursor-pointer",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {!notification.read_at && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                        )}
                        <span className="truncate text-sm font-medium">{notification.title}</span>
                      </span>
                      {notification.body && (
                        <span className="truncate text-xs text-[var(--muted-foreground)]">
                          {notification.body}
                        </span>
                      )}
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
