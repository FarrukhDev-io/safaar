import { ApiRequestError } from "@safaar/api-client";
import { config } from "@/lib/config";

export interface NotificationView {
  id: string;
  title: string;
  body: string;
  type: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  items: NotificationView[];
  page: number;
  limit: number;
  unreadCount: number;
}

function toNotificationView(raw: Record<string, unknown>): NotificationView {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    body: String(raw.body ?? ""),
    type: raw.type != null ? String(raw.type) : null,
    relatedEntityType:
      raw.related_entity_type != null ? String(raw.related_entity_type) : null,
    relatedEntityId: raw.related_entity_id != null ? String(raw.related_entity_id) : null,
    isRead: Boolean(raw.read_at),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
  };
}

async function rawFetch<T>(path: string, method: "GET" | "PATCH", token?: string): Promise<T> {
  const base = config.apiUrl.endsWith("/") ? config.apiUrl : `${config.apiUrl}/`;
  const url = new URL(path.replace(/^\//, ""), base).toString();
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !payload) {
    throw new ApiRequestError(
      {
        success: false,
        message: typeof payload?.message === "string" ? payload.message : res.statusText || "Server error",
        code: typeof payload?.code === "string" ? payload.code : undefined,
      },
      res.status
    );
  }
  return (payload.data ?? payload) as T;
}

export const notificationsService = {
  /** `GET /notifications` — sahifalangan ro'yxat + haqiqiy o'qilmagan soni. */
  async list(options?: { token?: string }): Promise<NotificationsPage> {
    const raw = await rawFetch<{
      items: Record<string, unknown>[];
      page: number;
      limit: number;
      unread_count: number;
    }>("/notifications", "GET", options?.token);
    return {
      items: (raw.items ?? []).map(toNotificationView),
      page: raw.page ?? 1,
      limit: raw.limit ?? 20,
      unreadCount: raw.unread_count ?? 0,
    };
  },

  /** `PATCH /notifications/:id/read` */
  async markRead(id: string, options?: { token?: string }): Promise<NotificationView> {
    const raw = await rawFetch<Record<string, unknown>>(
      `/notifications/${encodeURIComponent(id)}/read`,
      "PATCH",
      options?.token
    );
    return toNotificationView(raw);
  },

  /** `PATCH /notifications/read-all` */
  async markAllRead(options?: { token?: string }): Promise<void> {
    await rawFetch<unknown>("/notifications/read-all", "PATCH", options?.token);
  },
};
