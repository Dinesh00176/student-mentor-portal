import { useEffect, useRef, useState } from 'react';
import { listNotifications, markNotificationRead } from '../services/notification.service';
import './NotificationBell.css';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = () => {
    setLoading(true);
    listNotifications()
      .then(({ data }) => setItems(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    const unread = items.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => markNotificationRead(n._id)));
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="notif-bell" ref={ref}>
      <button
        type="button"
        className={`notif-bell__trigger ${unreadCount > 0 ? 'notif-bell__trigger--has-unread' : ''}`}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
      >
        <svg
          className="notif-bell__svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="notif-bell__badge tabular-nums">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-bell__panel" role="menu">
          <div className="notif-bell__header">
            <div className="notif-bell__title-wrap">
              <span className="notif-bell__title">Notifications</span>
              {unreadCount > 0 && <span className="notif-bell__unread-tag">{unreadCount} new</span>}
            </div>
            {unreadCount > 0 && (
              <button type="button" className="notif-bell__mark-all" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notif-bell__list">
            {loading && (
              <div className="notif-bell__loading">
                <span className="notif-bell__spinner" /> Loading updates…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="notif-bell__empty">
                <span className="notif-bell__empty-icon">🔔</span>
                <span>No notifications yet</span>
              </div>
            )}
            {!loading &&
              items.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  className={`notif-bell__item ${n.isRead ? '' : 'notif-bell__item--unread'}`}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                >
                  <div className="notif-bell__item-dot" aria-hidden="true" />
                  <div className="notif-bell__item-content">
                    <span className="notif-bell__message">{n.message}</span>
                    <span className="notif-bell__time">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
