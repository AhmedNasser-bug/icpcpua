import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell } from "lucide-react";
import { api } from "../../../shared/services/api.js";
export function NotificationsPage({
  token
}) {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter === 'unread' ? '?filter=unread' : '';
      const result = await api(`/notifications${query}`, {
        token
      });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setError('');
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }, [filter, token]);
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);
  const markRead = async notificationId => {
    setBusy(true);
    setError('');
    try {
      await api(`/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: 'PATCH',
        token
      });
      await loadNotifications();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const markAllRead = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/notifications/read-all', {
        method: 'POST',
        token
      });
      await loadNotifications();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const openNotification = async notification => {
    if (!notification.readAt) await markRead(notification._id);
    navigate(notification.link);
  };
  return <main className="page-wrap notifications-page">
    <div className="page-heading"><span className="eyebrow">COMMUNITY UPDATES</span><h1>Notifications<span>.</span></h1><p>Contest announcements and ICPC community event updates.</p></div>
    <div className="notifications-toolbar">
      <div className="notification-filters" role="group" aria-label="Filter notifications">
        <button type="button" className={filter === 'all' ? 'notification-filter active' : 'notification-filter'} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
        <button type="button" className={filter === 'unread' ? 'notification-filter active' : 'notification-filter'} aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Unread {unreadCount > 0 && <span>{unreadCount}</span>}</button>
      </div>
      {unreadCount > 0 && <button className="notification-mark-all" type="button" disabled={busy} onClick={markAllRead}>Mark all as read</button>}
    </div>
    {error && <div className="notice error-notice" role="alert">{error}</div>}
    {loading ? <div className="empty-state"><span className="loader" /> Loading notifications...</div> : notifications.length === 0 ? <div className="empty-state"><span className="empty-icon"><Bell size={24} /></span><h3>{filter === 'unread' ? 'You’re all caught up.' : 'No notifications yet.'}</h3><p>New contest and community event updates will show up here.</p></div> : <section className="notifications-list" aria-label="Notifications">{notifications.map(notification => <article className={notification.readAt ? 'notifications-page-item' : 'notifications-page-item unread'} key={notification._id}>
          <div className="notifications-page-copy"><span className="notification-category-label">{notification.category === 'contest_announcement' ? 'Contest announcement' : 'ICPC event'}</span><h2>{notification.title}</h2><p>{notification.message}</p><time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time></div>
          <div className="notifications-page-actions">
            {!notification.readAt && <button className="button button-outline notification-mark-read" type="button" disabled={busy} onClick={() => markRead(notification._id)}>Mark read</button>}
            <button className="button button-dark notification-open" type="button" disabled={busy} onClick={() => openNotification(notification)}>Open <ArrowRight size={15} /></button>
          </div>
        </article>)}</section>}
  </main>;
}
