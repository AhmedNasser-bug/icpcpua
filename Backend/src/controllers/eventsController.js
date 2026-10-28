import mongoose from 'mongoose';
import {
  cancelRegistration,
  checkIn,
  getCheckInDetails,
  getLeaderboard,
  getMemberLeaderboard,
  getMemberProfile,
  getMyEvents,
  getPublicEvent,
  listEvents,
  registerForEvent,
} from '../services/eventService.js';

function paramsInput(req) {
  return req.validated?.params ?? req.params;
}

function queryInput(req) {
  return req.validated?.query ?? req.query;
}

function bodyInput(req) {
  return req.validated?.body ?? req.body;
}

export async function list(req, res) {
  return res.json({ events: await listEvents(queryInput(req)) });
}

export async function leaderboard(req, res) {
  return res.json({ leaderboard: (await getLeaderboard()).slice(0, 100) });
}

export async function myLeaderboard(req, res) {
  const result = await getMemberLeaderboard(req.user.id);
  return res.json(result);
}

export async function memberProfile(req, res) {
  const { username } = paramsInput(req);
  const profile = await getMemberProfile(username);
  if (!profile) return res.status(404).json({ error: { message: 'Member profile not found.' } });
  return res.json({ profile });
}

export async function myEvents(req, res) {
  return res.json({ events: await getMyEvents(req.user.id) });
}

export async function checkInDetails(req, res) {
  const { eventId } = paramsInput(req);
  const { token } = queryInput(req);
  if (!mongoose.isValidObjectId(eventId)) {
    return res.status(404).json({ error: { message: 'This event check-in link is not valid.' } });
  }
  const result = await getCheckInDetails(eventId, token, req.user.id);
  if (result.type === 'invalid') {
    return res.status(404).json({ error: { message: 'This event check-in link is invalid or has expired.' } });
  }
  if (result.type === 'not_registered') {
    return res.status(403).json({ error: { message: 'You must register for this event before checking in.' } });
  }
  res.set('Cache-Control', 'no-store');
  return res.json({
    event: result.event,
    attendance: result.attendance,
    checkInWindow: result.checkInWindow,
  });
}

export async function submitCheckIn(req, res) {
  const { eventId } = paramsInput(req);
  const body = bodyInput(req);
  if (!mongoose.isValidObjectId(eventId)) {
    return res.status(404).json({ error: { message: 'This event check-in link is not valid.' } });
  }
  const result = await checkIn(eventId, body.token, req.user.id);
  if (result.type === 'invalid') {
    return res.status(404).json({ error: { message: 'This event check-in link is invalid or has expired.' } });
  }
  if (result.type === 'outside_window') {
    return res.status(409).json({ error: { message: 'Check-in is outside this event’s check-in window.' } });
  }
  if (result.type === 'not_registered') {
    return res.status(403).json({ error: { message: 'You must register for this event before checking in.' } });
  }
  if (result.type === 'already_checked_in') {
    return res.status(409).json({
      error: { message: 'You have already checked in to this event.' },
      attendance: result.attendance,
    });
  }
  return res.json({ message: 'Check-in successful.', attendance: result.attendance });
}

export async function getById(req, res) {
  const { eventId } = paramsInput(req);
  const event = await getPublicEvent(eventId);
  if (!event) return res.status(404).json({ error: { message: 'Event not found.' } });
  return res.json({ event });
}

export async function register(req, res) {
  const { eventId } = paramsInput(req);
  if (!mongoose.isValidObjectId(eventId)) {
    return res.status(404).json({ error: { message: 'Event not found.' } });
  }
  const result = await registerForEvent(eventId, req.user.id);
  if (result.type === 'unavailable') {
    return res.status(409).json({ error: { message: 'Registration is not available for this event.' } });
  }
  if (result.type === 'already_registered') {
    return res.status(409).json({ error: { message: 'You are already registered for this event.' } });
  }
  if (result.type === 'full') {
    return res.status(409).json({ error: { message: 'This event is full or no longer available.' } });
  }
  return res.status(201).json({ registration: result.registration });
}

export async function cancel(req, res) {
  const { eventId } = paramsInput(req);
  if (!mongoose.isValidObjectId(eventId)) {
    return res.status(404).json({ error: { message: 'Registration not found.' } });
  }
  const result = await cancelRegistration(eventId, req.user.id);
  if (result.type === 'event_not_found') {
    return res.status(404).json({ error: { message: 'Event not found.' } });
  }
  if (result.type === 'closed') {
    return res.status(409).json({ error: { message: 'Registration can no longer be cancelled.' } });
  }
  if (result.type === 'checked_in') {
    return res.status(409).json({ error: { message: 'A checked-in registration can no longer be cancelled.' } });
  }
  if (result.type === 'not_registered') {
    return res.status(404).json({ error: { message: 'You are not registered for this event.' } });
  }
  return res.json({ message: 'Registration cancelled.' });
}
