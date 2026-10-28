import mongoose from 'mongoose';
import {
  decrementRegistrationCount,
  findEventForCancellation,
  findEventsForRegistration,
  findPublicEvent,
  findPublicEvents,
  findCheckInEvent,
  reserveRegistration,
} from '../repositories/eventRepository.js';
import {
  createRegistration,
  deleteUnattendedRegistration,
  findAttendanceHistory,
  findEventAttendanceStats,
  findUserEventRegistration,
  findUserEventRegistrationExists,
  findUserRegistrations,
  getLeaderboardEntries,
  updateCheckIn,
} from '../repositories/registrationRepository.js';
import { findPublicMemberByUsername } from '../repositories/userRepository.js';
import { hashCheckInToken, getCheckInWindow, isWithinCheckInWindow } from '../utils/checkIn.js';
import { mergeLeaderboardEntries, rankLeaderboard } from '../utils/leaderboard.js';
import { applyPublicProfilePrivacy } from '../utils/profilePrivacy.js';
import { getRoadmapPointsByStudent } from './roadmapService.js';

export async function listEvents(filters) {
  const now = new Date();
  const query = { status: 'published' };
  if (filters.sort !== 'latest') {
    if (filters.status === 'past') query.endsAt = { $lt: now };
    else query.endsAt = { $gte: now };
  }
  if (typeof filters.category === 'string' && filters.category.trim()) {
    query.category = filters.category.trim();
  }
  if (typeof filters.q === 'string' && filters.q.trim()) {
    const escaped = filters.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [{ title: new RegExp(escaped, 'i') }, { description: new RegExp(escaped, 'i') }, { category: new RegExp(escaped, 'i') }];
  }
  const sort = filters.sort === 'latest'
    ? { createdAt: -1, _id: -1 }
    : { startsAt: filters.status === 'past' ? -1 : 1 };
  return findPublicEvents(query, sort);
}

export async function getLeaderboard() {
  const [eventEntries, roadmapEntries] = await Promise.all([
    getLeaderboardEntries(),
    getRoadmapPointsByStudent(),
  ]);
  return rankLeaderboard(mergeLeaderboardEntries(eventEntries, roadmapEntries));
}

function presentStanding(entry) {
  return entry
    ? { rank: entry.rank, points: entry.points, eventsAttended: entry.eventsAttended }
    : { rank: null, points: 0, eventsAttended: 0 };
}

function presentHistory(history) {
  return history.filter((item) => item.event).map((item) => ({
    event: item.event,
    checkedInAt: item.checkedInAt,
    pointsAwarded: item.pointsAwarded,
  }));
}

export async function getMemberLeaderboard(userId) {
  const leaderboard = await getLeaderboard();
  const current = leaderboard.find((entry) => entry.userId.toString() === userId);
  const history = await findAttendanceHistory(userId);
  return { standing: presentStanding(current), attendanceHistory: presentHistory(history) };
}

export async function getMemberProfile(username) {
  const user = await findPublicMemberByUsername(username);
  if (!user) return null;
  const source = user.profile?.toObject ? user.profile.toObject() : user.profile || {};
  const visibility = applyPublicProfilePrivacy(source);
  if (!visibility) return null;
  const leaderboard = await getLeaderboard();
  const standing = leaderboard.find((entry) => entry.userId.toString() === user.id);
  const history = visibility.attendanceHistoryVisible ? await findAttendanceHistory(user.id) : [];
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    joinedAt: user.createdAt,
    profile: visibility.profile,
    standing: presentStanding(standing),
    attendanceHistory: visibility.attendanceHistoryVisible ? presentHistory(history) : null,
  };
}

export async function getMyEvents(userId) {
  const registrations = await findUserRegistrations(userId);
  return registrations.filter((registration) => registration.event).map((registration) => ({
    registrationId: registration.id,
    event: registration.event,
    checkedInAt: registration.checkedInAt,
    pointsAwarded: registration.pointsAwarded,
  }));
}

export async function getCheckInDetails(eventId, token, userId) {
  const tokenHash = hashCheckInToken(token);
  const event = tokenHash ? await findCheckInEvent(eventId, tokenHash) : null;
  if (!event) return { type: 'invalid' };
  const registration = await findUserEventRegistration(userId, event.id);
  if (!registration) return { type: 'not_registered' };
  const { opensAt, closesAt } = getCheckInWindow(event);
  return {
    type: 'ok',
    event: {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      category: event.category,
    },
    attendance: { checkedInAt: registration.checkedInAt, pointsAwarded: registration.pointsAwarded },
    checkInWindow: { opensAt, closesAt, isOpen: isWithinCheckInWindow(event) },
  };
}

export async function checkIn(eventId, token, userId) {
  const tokenHash = hashCheckInToken(token);
  const event = tokenHash ? await findCheckInEvent(eventId, tokenHash) : null;
  if (!event) return { type: 'invalid' };
  if (!isWithinCheckInWindow(event)) return { type: 'outside_window' };

  const registration = await updateCheckIn(userId, event.id, event.attendancePoints, new Date());
  if (!registration) {
    const existing = await findUserEventRegistration(userId, event.id);
    if (!existing) return { type: 'not_registered' };
    return {
      type: 'already_checked_in',
      attendance: { checkedInAt: existing.checkedInAt, pointsAwarded: existing.pointsAwarded },
    };
  }
  return {
    type: 'success',
    attendance: { checkedInAt: registration.checkedInAt, pointsAwarded: registration.pointsAwarded },
  };
}

export async function getPublicEvent(eventIdOrSlug) {
  const filter = mongoose.isValidObjectId(eventIdOrSlug)
    ? { _id: eventIdOrSlug, status: 'published' }
    : { slug: eventIdOrSlug, status: 'published' };
  return findPublicEvent(filter);
}

export async function registerForEvent(eventId, userId) {
  const now = new Date();
  const event = await findEventsForRegistration(now, eventId);
  if (!event) return { type: 'unavailable' };
  if (await findUserEventRegistrationExists(userId, event.id)) return { type: 'already_registered' };

  const reserved = await reserveRegistration(event.id, event.capacity);
  if (!reserved.modifiedCount) return { type: 'full' };
  try {
    return { type: 'created', registration: await createRegistration(userId, event.id) };
  } catch (error) {
    await decrementRegistrationCount(event.id);
    if (error.code === 11000) return { type: 'already_registered' };
    throw error;
  }
}

export async function cancelRegistration(eventId, userId) {
  const event = await findEventForCancellation(eventId);
  if (!event) return { type: 'event_not_found' };
  if (event.startsAt <= new Date()) return { type: 'closed' };
  const registration = await deleteUnattendedRegistration(event.id, userId);
  if (!registration) {
    if (await findUserEventRegistrationExists(userId, event.id)) return { type: 'checked_in' };
    return { type: 'not_registered' };
  }
  await decrementRegistrationCount(event.id);
  return { type: 'cancelled' };
}

export async function getAdminEventAttendanceStats(eventIds) {
  return findEventAttendanceStats(eventIds);
}
