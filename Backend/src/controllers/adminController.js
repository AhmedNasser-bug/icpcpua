import mongoose from 'mongoose';
import {
  createAdminEvent,
  deleteAdminEvent,
  generateCheckInQr,
  getEventRegistrations,
  listEvents,
  updateAdminEvent,
} from '../services/adminService.js';
import { validateEventInput } from '../utils/validation.js';

function bodyInput(req) {
  return req.validated?.body ?? req.body;
}

function paramsInput(req) {
  return req.validated?.params ?? req.params;
}

export async function list(req, res) {
  return res.json({ events: await listEvents() });
}

export async function create(req, res) {
  const data = validateEventInput(bodyInput(req));
  const event = await createAdminEvent(data, req.user.id);
  return res.status(201).json({ event });
}

export async function update(req, res) {
  const { eventId } = paramsInput(req);
  if (!mongoose.isValidObjectId(eventId)) {
    return res.status(404).json({ error: { message: 'Event not found.' } });
  }
  const data = validateEventInput(bodyInput(req), { partial: true });
  const result = await updateAdminEvent(eventId, data);
  if (result.type === 'not_found') {
    return res.status(404).json({ error: { message: 'Event not found.' } });
  }
  if (result.type === 'deleted') {
    return res.status(409).json({ error: { message: 'Deleted events cannot be edited.' } });
  }
  if (result.type === 'invalid_check_in_window') {
    return res.status(400).json({ error: { message: 'Check-in must close after it opens.' } });
  }
  return res.json({ event: result.event });
}

export async function remove(req, res) {
  const { eventId } = paramsInput(req);
  if (!mongoose.isValidObjectId(eventId)) {
    return res.status(404).json({ error: { message: 'Event not found.' } });
  }
  const confirmationName = bodyInput(req)?.confirmationName;
  if (typeof confirmationName !== 'string' || !confirmationName) {
    return res.status(400).json({ error: { message: 'Type the exact event name to confirm deletion.' } });
  }
  const result = await deleteAdminEvent(eventId, confirmationName);
  if (result.type === 'not_found') {
    return res.status(404).json({ error: { message: 'Event not found.' } });
  }
  if (result.type === 'already_deleted') {
    return res.status(409).json({ error: { message: 'This event has already been deleted.' } });
  }
  if (result.type === 'name_mismatch') {
    return res.status(400).json({ error: { message: 'The event name does not match.' } });
  }
  if (result.type === 'changed') {
    return res.status(409).json({ error: { message: 'The event changed before it could be deleted. Refresh and try again.' } });
  }
  return res.json({ message: 'Event deleted. Attendance and points history have been preserved.' });
}

export async function createCheckInQr(req, res) {
  const { eventId } = paramsInput(req);
  if (!mongoose.isValidObjectId(eventId)) {
    return res.status(404).json({ error: { message: 'Event not found.' } });
  }
  const result = await generateCheckInQr(eventId, req.get('origin'));
  if (result.type === 'invalid_origin') {
    return res.status(400).json({ error: { message: 'The check-in link origin is not an allowed client origin.' } });
  }
  if (result.type === 'not_found') {
    return res.status(404).json({ error: { message: 'Event not found.' } });
  }
  if (result.type === 'not_published') {
    return res.status(409).json({ error: { message: 'Publish the event before generating a check-in QR code.' } });
  }
  res.set('Cache-Control', 'no-store');
  return res.json({
    checkInUrl: result.checkInUrl,
    qrCodeDataUrl: result.qrCodeDataUrl,
    event: result.event,
    checkInWindow: result.checkInWindow,
  });
}

export async function registrations(req, res) {
  const { eventId } = paramsInput(req);
  if (!mongoose.isValidObjectId(eventId)) {
    return res.status(404).json({ error: { message: 'Event not found.' } });
  }
  const registrationsForEvent = await getEventRegistrations(eventId);
  if (!registrationsForEvent) return res.status(404).json({ error: { message: 'Event not found.' } });
  return res.json({ registrations: registrationsForEvent });
}
