'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Package, Truck, ClipboardList, Coins, Sparkles, Star, Calendar, AlertTriangle, CalendarCheck } from 'lucide-react';
import { useNavigate } from '../utils/navigation';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';

const NotificationBell = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllRead } = useNotificationStore();
  const [now] = useState(() => Date.now());

  const fallbackProfilePath = ['cashier', 'deliveryGuy', 'stockEmployee'].includes(user?.role)
    ? '/employee/profile'
    : user?.role === 'admin'
      ? '/admin'
      : user?.role === 'manager'
        ? '/manager'
        : '/profile';

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      useNotificationStore.getState().fetchUnreadCount();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchNotifications();
  };

  const renderNotificationIcon = (type) => {
    const iconClass = "w-4 h-4 text-blue-600";
    switch (type) {
      case 'order_update': return <Package className={iconClass} />;
      case 'delivery_update': return <Truck className={iconClass} />;
      case 'delivery_assignment': return <ClipboardList className={iconClass} />;
      case 'salary_credit': return <Coins className={iconClass} />;
      case 'promotion': return <Sparkles className={iconClass} />;
      case 'loyalty_points': return <Star className={iconClass} />;
      case 'leave_update': return <Calendar className={iconClass} />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'attendance': return <CalendarCheck className={iconClass} />;
      default: return <Bell className={iconClass} />;
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((now - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative text-slate-700 hover:text-brand-indigo transition-colors p-1 border-0 bg-transparent cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto top-[3.75rem] sm:top-full right-auto sm:right-0 mt-0 sm:mt-2 w-auto sm:w-80 max-w-none sm:max-w-none bg-white border border-slate-200 rounded-2xl shadow-2xl z-[110] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 gap-2">
            <h3 className="font-semibold text-slate-900 text-sm m-0">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs text-brand-indigo hover:text-indigo-700 font-medium flex items-center gap-1 border-0 bg-transparent cursor-pointer whitespace-nowrap"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[min(60vh,20rem)] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Bell size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm m-0">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n._id);
                    navigate(n.link || fallbackProfilePath);
                    setOpen(false);
                  }}
                  className={`px-4 py-3 border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors hover:bg-blue-50 active:bg-blue-50 ${
                    !n.isRead ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {renderNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm m-0 leading-snug ${!n.isRead ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 m-0 mt-0.5 truncate">{n.message}</p>
                      <p className="text-xs text-slate-400 m-0 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 text-center bg-slate-50">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-brand-indigo hover:text-indigo-700 font-medium border-0 bg-transparent cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
