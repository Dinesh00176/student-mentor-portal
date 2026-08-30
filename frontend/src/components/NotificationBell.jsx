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
      .then(({ data }) => setItems(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
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
        className="notif-bell__trigger"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && <span className="notif-bell__badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-bell__panel" role="menu">
          <div className="notif-bell__header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="notif-bell__mark-all" onClick={handleMarkAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="notif-bell__list">
            {loading && <p className="notif-bell__empty">Loading…</p>}
            {!loading && items.length === 0 && <p className="notif-bell__empty">No notifications yet.</p>}
            {!loading && items.map((n) => (
              <button
                key={n._id}
                type="button"
                className={`notif-bell__item ${n.isRead ? '' : 'notif-bell__item--unread'}`}
                onClick={() => !n.isRead && handleMarkRead(n._id)}
              >
                <span className="notif-bell__message">{n.message}</span>
                <span className="notif-bell__time">{new Date(n.createdAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
