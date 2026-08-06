import { create } from 'zustand';
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true });
      const { data } = await getNotifications();
      set({ notifications: data.notifications || [], unreadCount: data.unreadCount || 0 });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await getUnreadCount();
      set({ unreadCount: data.count || 0 });
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  },

  markAsRead: async (id) => {
    try {
      await markNotificationRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  },

  markAllRead: async () => {
    try {
      await markAllNotificationsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  },
}));

export default useNotificationStore;
