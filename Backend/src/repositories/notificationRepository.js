import Notification from '../models/Notification.js';
import User from '../models/User.js';

export async function createNotificationsForStudents({ category, preference, title, message, link, sourceKey }) {
  const recipients = await User.find({
    role: 'user',
    [`notificationPreferences.${preference}`]: { $ne: false },
  }).select('_id').lean();
  if (!recipients.length) return;

  await Notification.bulkWrite(recipients.map(({ _id }) => ({
    updateOne: {
      filter: { user: _id, sourceKey },
      update: {
        $setOnInsert: { user: _id, category, title, message, link, sourceKey },
      },
      upsert: true,
    },
  })), { ordered: false });
}

export function listUserNotifications(userId, unreadOnly = false) {
  const filter = { user: userId };
  if (unreadOnly) filter.readAt = null;
  return Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean();
}

export function countUnreadNotifications(userId) {
  return Notification.countDocuments({ user: userId, readAt: null });
}

export function markUserNotificationRead(userId, notificationId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { readAt: new Date() } },
    { new: true },
  ).lean();
}

export function markAllUserNotificationsRead(userId) {
  return Notification.updateMany(
    { user: userId, readAt: null },
    { $set: { readAt: new Date() } },
  );
}
