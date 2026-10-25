import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import { config, isAllowedClientOrigin } from '../config/env.js';
import {
  archiveEvent,
  createEvent,
  findAllEvents,
  findEventById,
  findEventTitleAndStatus,
  findRegistrationsEvent,
  setCheckInTokenForPublishedEvent,
  updateEventIfActive,
} from '../repositories/adminRepository.js';
import { findEventAttendanceStats, findEventRegistrations } from '../repositories/registrationRepository.js';
import { createCheckInToken } from '../utils/checkIn.js';
import { slugify } from '../utils/validation.js';
import { notifyStudentsAboutEvent } from './notificationService.js';

export async function listEvents() {
  const events = await findAllEvents();
  const stats = await findEventAttendanceStats(events.map((event) => event._id));
  const statsByEvent = new Map(stats.map((item) => [item._id.toString(), item]));
  return events.map((event) => {
    const eventStats = statsByEvent.get(event.id);
    return {
      ...event.toJSON(),
      attendanceCount: eventStats?.attendanceCount || 0,
      totalPointsAwarded: eventStats?.totalPointsAwarded || 0,
    };
  });
}

export function createAdminEvent(data, userId) {
  data.status ??= 'draft';
  if (data.status === 'published') data.publishedAt = new Date();
  data.slug = `${slugify(data.title) || 'event'}-${randomBytes(3).toString('hex')}`;
  data.createdBy = userId;
  return createEvent(data).then(async (event) => {
    if (event.status === 'published') await notifyStudentsAboutEvent(event, 'published');
    return event;
  });
}

export async function updateAdminEvent(eventId, data) {
  const existing = await findEventById(eventId);
  if (!existing) return { type: 'not_found' };
  if (existing.status === 'deleted') return { type: 'deleted' };

  const startsAt = data.startsAt ?? existing.startsAt;
  const endsAt = data.endsAt ?? existing.endsAt;
  const opensAt = 'checkInOpensAt' in data
    ? data.checkInOpensAt ?? startsAt
    : existing.checkInOpensAt ?? startsAt;
  const closesAt = 'checkInClosesAt' in data
    ? data.checkInClosesAt ?? endsAt
    : existing.checkInClosesAt ?? endsAt;
  if (closesAt <= opensAt) return { type: 'invalid_check_in_window' };
  if ('title' in data && data.title !== existing.title) data.slug = `${slugify(data.title) || 'event'}-${randomBytes(3).toString('hex')}`;

  const wasPublished = existing.status === 'published';
  if (!wasPublished && data.status === 'published') data.publishedAt = new Date();
  const changedPublishedFields = ['title', 'description', 'category', 'startsAt', 'endsAt', 'registrationDeadline', 'mode', 'location']
    .some((field) => field in data && String(data[field] ?? '') !== String(existing[field] ?? ''));
  const event = await updateEventIfActive(eventId, data);
  if (!event) return { type: 'deleted' };
  if (wasPublished && event.status === 'cancelled') {
    await notifyStudentsAboutEvent(event, 'cancelled');
  } else if (event.status === 'published' && (!wasPublished || changedPublishedFields)) {
    await notifyStudentsAboutEvent(event, wasPublished ? 'updated' : 'published');
  }
  return { type: 'updated', event };
}

export async function deleteAdminEvent(eventId, confirmationName) {
  const event = await findEventTitleAndStatus(eventId);
  if (!event) return { type: 'not_found' };
  if (event.status === 'deleted') return { type: 'already_deleted' };
  if (confirmationName !== event.title) return { type: 'name_mismatch' };

  const archived = await archiveEvent(event.id, confirmationName);
  return archived ? { type: 'deleted' } : { type: 'changed' };
}

export async function generateCheckInQr(eventId, requestOrigin) {
  const clientOrigin = requestOrigin || config.clientOrigin;
  if (!isAllowedClientOrigin(clientOrigin)) return { type: 'invalid_origin' };

  const event = await findEventById(eventId);
  if (!event) return { type: 'not_found' };
  if (event.status !== 'published') return { type: 'not_published' };

  const { token, tokenHash } = createCheckInToken();
  const updated = await setCheckInTokenForPublishedEvent(event.id, tokenHash);
  if (!updated.modifiedCount) return { type: 'not_published' };
  const checkInUrl = new URL(`/check-in/${event.id}`, clientOrigin);
  checkInUrl.searchParams.set('token', token);
  const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl.toString(), {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 1024,
  });
  return {
    type: 'success',
    checkInUrl: checkInUrl.toString(),
    qrCodeDataUrl,
    event: { id: event.id, title: event.title, startsAt: event.startsAt, endsAt: event.endsAt },
    checkInWindow: {
      opensAt: event.checkInOpensAt || event.startsAt,
      closesAt: event.checkInClosesAt || event.endsAt,
    },
  };
}

export async function getEventRegistrations(eventId) {
  const event = await findRegistrationsEvent(eventId);
  if (!event) return null;
  const registrations = await findEventRegistrations(event.id);
  return registrations.map((item) => ({
    id: item.id,
    user: item.user,
    registeredAt: item.createdAt,
    checkedInAt: item.checkedInAt,
    pointsAwarded: item.pointsAwarded,
  }));
}
