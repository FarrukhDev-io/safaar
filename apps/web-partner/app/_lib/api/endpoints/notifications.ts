import { request } from '../client';

export interface BackendNotification {
  id: string;
  title: string;
  body?: string | null;
  type?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationsListResponse {
  items: BackendNotification[];
  page: number;
  limit: number;
  unread_count: number;
}

export function listNotifications(token?: string | null) {
  return request<NotificationsListResponse>('/notifications', { token });
}

export function markNotificationRead(id: string, token?: string | null) {
  return request<BackendNotification>(`/notifications/${id}/read`, {
    method: 'PATCH',
    token,
  });
}

export function markAllNotificationsRead(token?: string | null) {
  return request<{ owner_id: string; read_all: boolean }>('/notifications/read-all', {
    method: 'PATCH',
    token,
  });
}
