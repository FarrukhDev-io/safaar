"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import type { NotificationView } from "@/lib/services/notifications/notifications";
import { useRealtimeEvent } from "@/lib/services/realtime/socket-provider";

function relatedHref(locale: string, notification: NotificationView): string | null {
  if (notification.relatedEntityType === "hotel" && notification.relatedEntityId) {
    return `/${locale}/hotels/${notification.relatedEntityId}`;
  }
  if (notification.relatedEntityType === "booking" && notification.relatedEntityId) {
    return `/${locale}/booking/${notification.relatedEntityId}`;
  }
  return null;
}

function formatRelativeTime(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return "";
  const diffMs = Date.now() - ts;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "hozir";
  if (diffMin < 60) return `${diffMin} daq oldin`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} soat oldin`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay} kun oldin`;
}

export function NotificationsBell({
  locale,
  token,
}: {
  locale: string;
  token?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    if (!token) return;
    setLoading(true);
    setError(false);
    api.notifications
      .list({ token })
      .then((page) => {
        setItems(page.items);
        setUnreadCount(page.unreadCount);
        setLoaded(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  // Boshlang'ich yuklash + har 30 soniyada yangilash (web-admin bilan bir xil andoza).
  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30_000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Real-vaqtli push — backend yangi bildirishnoma yaratganda darhol yangilanadi.
  useRealtimeEvent(
    "notification.created",
    () => {
      fetchNotifications();
    },
    [token],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!token) return null;

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!loaded) fetchNotifications();
  };

  const handleItemClick = async (notification: NotificationView) => {
    if (!notification.isRead) {
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      api.notifications.markRead(notification.id, { token }).catch(() => {
        fetchNotifications();
      });
    }
    const href = relatedHref(locale, notification);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.notifications.markAllRead({ token });
    } catch {
      fetchNotifications();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Bildirishnomalar"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-100 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-card shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Bildirishnomalar</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
              >
                <Check className="h-3.5 w-3.5" />
                Barchasini o'qilgan qilish
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Yuklanmoqda...
              </p>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8">
                <p className="text-sm text-red-500">Yuklab bo'lmadi</p>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Qayta urinish
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Hozircha bildirishnomalar yo'q
              </p>
            ) : (
              <ul>
                {items.map((notification) => {
                  const href = relatedHref(locale, notification);
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => handleItemClick(notification)}
                        className={cn(
                          "flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 dark:border-slate-800/60",
                          !notification.isRead
                            ? "bg-primary-50/60 hover:bg-primary-50 dark:bg-primary-950/20 dark:hover:bg-primary-950/30"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                          href && "cursor-pointer",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {!notification.isRead && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                          )}
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {notification.title}
                          </span>
                        </span>
                        {notification.body && (
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {notification.body}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
