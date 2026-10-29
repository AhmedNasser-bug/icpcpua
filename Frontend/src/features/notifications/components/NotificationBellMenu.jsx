import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "../../../shared/services/api.js";
export function NotificationBellMenu({
  token
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const notificationMenuRef = useRef(null);
  const navigate = useNavigate();
  const refresh = useCallback(async () => {
    try {
      const result = await api('/notifications', {
        token
      });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setError('');
    } catch (reason) {
      setError(reason.message);
    }
  }, [token]);
  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 60000);
    return () => window.clearInterval(interval);
  }, [refresh]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointerDown = event => {
      if (!notificationMenuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointerDown);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointerDown);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);
  const markRead = async notification => {
    if (notification.readAt) return;
    setBusy(true);
    try {
      await api(`/notifications/${encodeURIComponent(notification._id)}/read`, {
        method: 'PATCH',
        token
      });
      await refresh();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const openNotification = async notification => {
    setOpen(false);
    await markRead(notification);
    navigate(notification.link);
  };
  const markAllRead = async () => {
    setBusy(true);
    try {
      const result = await api('/notifications/read-all', {
        method: 'POST',
        token
      });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  return <div className="notification-menu" ref={notificationMenuRef}>
    <button className="notification-bell" type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <Bell size={19} />
      {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    {open && <div className="notification-dropdown" role="dialog" aria-label="Recent notifications">
      <div className="notification-dropdown-heading"><strong>Notifications</strong>{unreadCount > 0 && <button type="button" disabled={busy} onClick={markAllRead}>Mark all read</button>}</div>
      {error && <div className="notification-inline-error" role="alert">{error}</div>}
      {notifications.length === 0 ? <p className="notification-empty">No notifications yet.</p> : notifications.slice(0, 5).map(notification => <button className={notification.readAt ? 'notification-item' : 'notification-item unread'} type="button" key={notification._id} onClick={() => openNotification(notification)}>
        <span className="notification-item-title">{notification.title}</span>
        <span className="notification-item-message">{notification.message}</span>
        <time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time>
      </button>)}
      <Link className="notification-view-all" to="/notifications" onClick={() => setOpen(false)}>View all notifications</Link>
    </div>}
  </div>;
}
