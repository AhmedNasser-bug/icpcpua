import mongoose from 'mongoose';
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js';

export async function list(req, res) {
  const unreadOnly = req.query.filter === 'unread';
  if (req.query.filter && !['all', 'unread'].includes(req.query.filter)) {
    return res.status(400).json({ error: { message: 'filter must be all or unread.' } });
  }
  return res.json(await getNotificationsForUser(req.user.id, unreadOnly));
}

export async function markRead(req, res) {
  if (!mongoose.isValidObjectId(req.params.notificationId)) {
    return res.status(404).json({ error: { message: 'Notification not found.' } });
  }
  const notification = await markNotificationRead(req.user.id, req.params.notificationId);
  if (!notification) return res.status(404).json({ error: { message: 'Notification not found.' } });
  return res.json({ notification });
}

export async function markAllRead(req, res) {
  await markAllNotificationsRead(req.user.id);
  return res.json(await getNotificationsForUser(req.user.id));
}
