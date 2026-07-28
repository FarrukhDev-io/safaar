import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  unreadCount: 0,
  setNotifications: (items) =>
    set({
      items,
      unreadCount: items.filter((item) => !item.isRead).length,
    }),
  markAsRead: (id) =>
    set((state) => {
      const newItems = state.items.map((i) =>
        i.id === id ? { ...i, isRead: true } : i
      );
      return {
        items: newItems,
        unreadCount: newItems.filter((i) => !i.isRead).length,
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      items: state.items.map((i) => ({ ...i, isRead: true })),
      unreadCount: 0,
    })),
}));
