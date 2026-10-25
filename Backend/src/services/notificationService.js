import {
  countUnreadNotifications,
  createNotificationsForStudents,
  listUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
} from '../repositories/notificationRepository.js';

export function notificationCategoryForEvent(event) {
  return /contest|competition/i.test(event.category)
    ? { category: 'contest_announcement', preference: 'contestAnnouncements' }
    : { category: 'icpc_event', preference: 'icpcEvents' };
}

export async function notifyStudentsAboutEvent(event, reason) {
  if (event.status !== 'published' && reason !== 'cancelled') return;
  const { category, preference } = notificationCategoryForEvent(event);
  const title = reason === 'published'
    ? event.title
    : `${reason === 'cancelled' ? 'Event cancelled' : 'Event updated'}: ${event.title}`;
  const message = reason === 'cancelled'
    ? `${event.title} has been cancelled.`
    : category === 'contest_announcement' && reason === 'published'
      ? `${event.title} · Published ${new Date(event.publishedAt || event.createdAt || event.updatedAt).toLocaleDateString('en', { dateStyle: 'medium' })}`
      : category === 'contest_announcement'
        ? `${event.title} · Contest announcement updated.`
        : `${event.title} · ${reason === 'published' ? 'A new ICPC community event has been published.' : 'This event has been updated.'}`;
  await createNotificationsForStudents({
    category,
    preference,
    title,
    message,
    link: reason === 'cancelled' ? '/' : `/events/${event.slug}`,
    sourceKey: `event:${event.id}:${reason}:${new Date(event.updatedAt).toISOString()}`,
  });
}

export async function getNotificationsForUser(userId, unreadOnly = false) {
  const [notifications, unreadCount] = await Promise.all([
    listUserNotifications(userId, unreadOnly),
    countUnreadNotifications(userId),
  ]);
  return { notifications, unreadCount };
}

export function markNotificationRead(userId, notificationId) {
  return markUserNotificationRead(userId, notificationId);
}

export function markAllNotificationsRead(userId) {
  return markAllUserNotificationsRead(userId);
}
