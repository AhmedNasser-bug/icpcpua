import mongoose from 'mongoose';
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js';

function paramsInput(req) {
  return req.validated?.params ?? req.params;
}

function queryInput(req) {
  return req.validated?.query ?? req.query;
}

export async function list(req, res) {
  const { filter } = queryInput(req);
  const unreadOnly = filter === 'unread';
  if (filter && !['all', 'unread'].includes(filter)) {
    return res.status(400).json({ error: { message: 'filter must be all or unread.' } });
  }
  return res.json(await getNotificationsForUser(req.user.id, unreadOnly));
}

export async function markRead(req, res) {
  const { notificationId } = paramsInput(req);
  if (!mongoose.isValidObjectId(notificationId)) {
    return res.status(404).json({ error: { message: 'Notification not found.' } });
  }
  const notification = await markNotificationRead(req.user.id, notificationId);
  if (!notification) return res.status(404).json({ error: { message: 'Notification not found.' } });
  return res.json({ notification });
}

export async function markAllRead(req, res) {
  await markAllNotificationsRead(req.user.id);
  return res.json(await getNotificationsForUser(req.user.id));
}
