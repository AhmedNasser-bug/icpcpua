import mongoose from 'mongoose';
import {
  createAdminCycle,
  createAdminRoadmap,
  generateCycleSchedule,
  generateSessionQr,
  getCycleSessions,
  getCycleStudents,
  listAdminRoadmaps,
  listSessionAttendance,
  manuallyRecordAttendance,
  previewCycleSchedule,
  revokeSessionPoints,
  updateAdminCycle,
  updateAdminRoadmap,
  updateAdminSession,
} from '../services/roadmapService.js';
import { validateCycleInput, validateRoadmapInput, validateSessionInput } from '../utils/roadmapValidation.js';

function invalidId(value, res, label) {
  if (mongoose.isValidObjectId(value)) return false;
  res.status(404).json({ error: { message: `${label} not found.` } });
  return true;
}

export async function list(req, res) {
  return res.json({ roadmaps: await listAdminRoadmaps() });
}

export async function create(req, res) {
  const data = validateRoadmapInput(req.body);
  return res.status(201).json({ roadmap: await createAdminRoadmap(data, req.user.id) });
}

export async function update(req, res) {
  if (invalidId(req.params.roadmapId, res, 'Roadmap')) return;
  const result = await updateAdminRoadmap(req.params.roadmapId, validateRoadmapInput(req.body, { partial: true }));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  if (result.type === 'archived') return res.status(409).json({ error: { message: 'Archived roadmaps cannot be republished or edited.' } });
  return res.json({ roadmap: result.roadmap });
}

export async function createCycleForRoadmap(req, res) {
  if (invalidId(req.params.roadmapId, res, 'Roadmap')) return;
  const result = await createAdminCycle(req.params.roadmapId, validateCycleInput(req.body));
  if (result.type === 'roadmap_not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  if (result.type === 'roadmap_not_published') return res.status(409).json({ error: { message: 'Publish the roadmap before publishing its cycle.' } });
  if (result.type === 'duplicate_order') return res.status(409).json({ error: { message: 'A cycle already uses this order in the roadmap.' } });
  return res.status(201).json({ cycle: result.cycle });
}

export async function updateCycle(req, res) {
  if (invalidId(req.params.cycleId, res, 'Cycle')) return;
  const result = await updateAdminCycle(req.params.cycleId, validateCycleInput(req.body, { partial: true }));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  if (result.type === 'capacity_below_enrollment') return res.status(409).json({ error: { message: 'Capacity cannot be lower than the number of enrolled students.' } });
  if (result.type === 'duplicate_order') return res.status(409).json({ error: { message: 'A cycle already uses this order in the roadmap.' } });
  if (result.type === 'roadmap_not_published') return res.status(409).json({ error: { message: 'Publish the roadmap before publishing its cycle.' } });
  if (result.type === 'invalid_registration_window') return res.status(400).json({ error: { message: 'Registration must close on or after it opens.' } });
  if (result.type === 'invalid_schedule') return res.status(400).json({ error: { message: result.message, field: result.field } });
  return res.json({ cycle: result.cycle });
}

export async function schedulePreview(req, res) {
  if (invalidId(req.params.cycleId, res, 'Cycle')) return;
  const result = await previewCycleSchedule(req.params.cycleId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  return res.json({ preview: result.preview });
}

export async function generateSchedule(req, res) {
  if (invalidId(req.params.cycleId, res, 'Cycle')) return;
  const result = await generateCycleSchedule(req.params.cycleId, req.body?.confirmationToken);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  if (result.type === 'confirmation_required') return res.status(400).json({ error: { message: 'Confirm the reviewed schedule preview before generating sessions.' } });
  if (result.type === 'schedule_changed') return res.status(409).json({ error: { message: 'The schedule changed after preview. Review a fresh preview before generating sessions.' } });
  return res.json({ summary: result.summary });
}

export async function sessions(req, res) {
  if (invalidId(req.params.cycleId, res, 'Cycle')) return;
  const result = await getCycleSessions(req.params.cycleId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  return res.json({ sessions: result.sessions });
}

export async function cycleStudents(req, res) {
  if (invalidId(req.params.cycleId, res, 'Cycle')) return;
  const result = await getCycleStudents(req.params.cycleId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  return res.json({ enrollments: result.enrollments });
}

export async function updateSession(req, res) {
  if (invalidId(req.params.sessionId, res, 'Session')) return;
  const result = await updateAdminSession(req.params.sessionId, validateSessionInput(req.body));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Session not found.' } });
  if (result.type === 'invalid_dates') return res.status(400).json({ error: { message: 'Session end time must be after its start time.' } });
  if (result.type === 'overlap') return res.status(409).json({ error: { message: 'This session overlaps another scheduled session in its cycle.' } });
  if (result.type === 'completed') return res.status(409).json({ error: { message: 'Completed sessions cannot be reopened.' } });
  return res.json({ session: result.session, hasAttendance: result.hasAttendance });
}

export async function checkInQr(req, res) {
  if (invalidId(req.params.sessionId, res, 'Session')) return;
  const result = await generateSessionQr(req.params.sessionId, req.get('origin'));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Session not found.' } });
  if (result.type === 'invalid_origin') return res.status(400).json({ error: { message: 'The check-in link origin is not an allowed client origin.' } });
  if (result.type === 'inactive') return res.status(409).json({ error: { message: 'Only scheduled sessions can have an attendance QR code.' } });
  res.set('Cache-Control', 'no-store');
  return res.json(result);
}

export async function attendance(req, res) {
  if (invalidId(req.params.sessionId, res, 'Session')) return;
  const result = await listSessionAttendance(req.params.sessionId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Session not found.' } });
  return res.json({ attendance: result.attendance });
}

export async function recordAttendance(req, res) {
  if (invalidId(req.params.sessionId, res, 'Session')) return;
  if (!mongoose.isValidObjectId(req.body?.studentId)) return res.status(400).json({ error: { message: 'A valid studentId is required.' } });
  const result = await manuallyRecordAttendance(req.params.sessionId, req.body.studentId, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Session not found.' } });
  if (result.type === 'not_enrolled') return res.status(409).json({ error: { message: 'Only students enrolled in the parent cycle can be marked present.' } });
  if (result.type === 'already_recorded') return res.status(409).json({ error: { message: 'Attendance has already been recorded for this student.' } });
  return res.status(201).json({ attendance: result.attendance });
}

export async function reversePoints(req, res) {
  if (invalidId(req.params.sessionId, res, 'Session') || invalidId(req.params.attendanceId, res, 'Attendance record')) return;
  const reason = req.body?.reason;
  if (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 300) {
    return res.status(400).json({ error: { message: 'Provide a reversal reason of up to 300 characters.' } });
  }
  const result = await revokeSessionPoints(req.params.sessionId, req.params.attendanceId, req.user.id, reason.trim());
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Attendance record not found.' } });
  if (result.type === 'already_reversed') return res.status(409).json({ error: { message: 'Points for this attendance record have already been reversed.' } });
  return res.json({ attendance: result.attendance });
}
