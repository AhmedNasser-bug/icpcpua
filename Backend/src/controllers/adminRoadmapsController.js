import mongoose from 'mongoose';
import {
  createAdminCycle,
  createAdminRoadmap,
  createAdminRoadmapNode,
  deleteAdminRoadmapNode,
  generateCycleSchedule,
  generateSessionQr,
  getCycleSessions,
  getCycleStudents,
  listAdminRoadmaps,
  listAdminRoadmapNodes,
  listSessionAttendance,
  manuallyRecordAttendance,
  previewCycleSchedule,
  revokeSessionPoints,
  updateAdminCycle,
  updateAdminRoadmap,
  updateAdminRoadmapNode,
  updateAdminSession,
} from '../services/roadmapService.js';
import { validateCycleInput, validateRoadmapInput, validateRoadmapNodeInput, validateSessionInput } from '../utils/roadmapValidation.js';

function bodyInput(req) {
  return req.validated?.body ?? req.body;
}

function paramsInput(req) {
  return req.validated?.params ?? req.params;
}

function invalidId(value, res, label) {
  if (mongoose.isValidObjectId(value)) return false;
  res.status(404).json({ error: { message: `${label} not found.` } });
  return true;
}

export async function list(req, res) {
  return res.json({ roadmaps: await listAdminRoadmaps() });
}

export async function create(req, res) {
  const data = validateRoadmapInput(bodyInput(req));
  return res.status(201).json({ roadmap: await createAdminRoadmap(data, req.user.id) });
}

export async function update(req, res) {
  const { roadmapId } = paramsInput(req);
  if (invalidId(roadmapId, res, 'Roadmap')) return;
  const result = await updateAdminRoadmap(roadmapId, validateRoadmapInput(bodyInput(req), { partial: true }));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  if (result.type === 'archived') return res.status(409).json({ error: { message: 'Archived roadmaps cannot be republished or edited.' } });
  return res.json({ roadmap: result.roadmap });
}

export async function roadmapNodes(req, res) {
  const { roadmapId } = paramsInput(req);
  if (invalidId(roadmapId, res, 'Roadmap')) return;
  const result = await listAdminRoadmapNodes(roadmapId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  return res.json({ nodes: result.nodes });
}

export async function createRoadmapNode(req, res) {
  const { roadmapId } = paramsInput(req);
  if (invalidId(roadmapId, res, 'Roadmap')) return;
  const result = await createAdminRoadmapNode(roadmapId, validateRoadmapNodeInput(bodyInput(req)));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  if (result.type === 'archived') return res.status(409).json({ error: { message: 'Archived roadmaps cannot be changed.' } });
  if (result.type === 'invalid_dependencies') return res.status(400).json({ error: { message: 'Dependencies must be valid topics from this roadmap and cannot create a circular path.' } });
  return res.status(201).json({ node: result.node });
}

export async function updateRoadmapNode(req, res) {
  const { roadmapId, nodeId } = paramsInput(req);
  if (invalidId(roadmapId, res, 'Roadmap') || invalidId(nodeId, res, 'Learning topic')) return;
  const result = await updateAdminRoadmapNode(roadmapId, nodeId, validateRoadmapNodeInput(bodyInput(req), { partial: true }));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Learning topic not found in this roadmap.' } });
  if (result.type === 'archived') return res.status(409).json({ error: { message: 'Archived roadmaps cannot be changed.' } });
  if (result.type === 'invalid_dependencies') return res.status(400).json({ error: { message: 'Dependencies must be valid topics from this roadmap and cannot create a circular path.' } });
  return res.json({ node: result.node });
}

export async function deleteRoadmapNode(req, res) {
  const { roadmapId, nodeId } = paramsInput(req);
  if (invalidId(roadmapId, res, 'Roadmap') || invalidId(nodeId, res, 'Learning topic')) return;
  const result = await deleteAdminRoadmapNode(roadmapId, nodeId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Learning topic not found in this roadmap.' } });
  if (result.type === 'archived') return res.status(409).json({ error: { message: 'Archived roadmaps cannot be changed.' } });
  return res.status(204).end();
}

export async function createCycleForRoadmap(req, res) {
  const { roadmapId } = paramsInput(req);
  if (invalidId(roadmapId, res, 'Roadmap')) return;
  const result = await createAdminCycle(roadmapId, validateCycleInput(bodyInput(req)));
  if (result.type === 'roadmap_not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  if (result.type === 'roadmap_not_published') return res.status(409).json({ error: { message: 'Publish the roadmap before publishing its cycle.' } });
  if (result.type === 'duplicate_order') return res.status(409).json({ error: { message: 'A cycle already uses this order in the roadmap.' } });
  return res.status(201).json({ cycle: result.cycle });
}

export async function updateCycle(req, res) {
  const { cycleId } = paramsInput(req);
  if (invalidId(cycleId, res, 'Cycle')) return;
  const result = await updateAdminCycle(cycleId, validateCycleInput(bodyInput(req), { partial: true }));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  if (result.type === 'archived') return res.status(409).json({ error: { message: 'Archived cycles cannot be edited or republished.' } });
  if (result.type === 'capacity_below_enrollment') return res.status(409).json({ error: { message: 'Capacity cannot be lower than the number of enrolled students.' } });
  if (result.type === 'duplicate_order') return res.status(409).json({ error: { message: 'A cycle already uses this order in the roadmap.' } });
  if (result.type === 'roadmap_not_published') return res.status(409).json({ error: { message: 'Publish the roadmap before publishing its cycle.' } });
  if (result.type === 'invalid_registration_window') return res.status(400).json({ error: { message: 'Registration must close on or after it opens.' } });
  if (result.type === 'invalid_schedule') return res.status(400).json({ error: { message: result.message, field: result.field } });
  return res.json({ cycle: result.cycle });
}

export async function schedulePreview(req, res) {
  const { cycleId } = paramsInput(req);
  if (invalidId(cycleId, res, 'Cycle')) return;
  const result = await previewCycleSchedule(cycleId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  return res.json({ preview: result.preview });
}

export async function generateSchedule(req, res) {
  const { cycleId } = paramsInput(req);
  if (invalidId(cycleId, res, 'Cycle')) return;
  const result = await generateCycleSchedule(cycleId, bodyInput(req)?.confirmationToken);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  if (result.type === 'confirmation_required') return res.status(400).json({ error: { message: 'Confirm the reviewed schedule preview before generating sessions.' } });
  if (result.type === 'schedule_changed') return res.status(409).json({ error: { message: 'The schedule changed after preview. Review a fresh preview before generating sessions.' } });
  return res.json({ summary: result.summary });
}

export async function sessions(req, res) {
  const { cycleId } = paramsInput(req);
  if (invalidId(cycleId, res, 'Cycle')) return;
  const result = await getCycleSessions(cycleId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  return res.json({ sessions: result.sessions });
}

export async function cycleStudents(req, res) {
  const { cycleId } = paramsInput(req);
  if (invalidId(cycleId, res, 'Cycle')) return;
  const result = await getCycleStudents(cycleId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  return res.json({ enrollments: result.enrollments });
}

export async function updateSession(req, res) {
  const { sessionId } = paramsInput(req);
  if (invalidId(sessionId, res, 'Session')) return;
  const result = await updateAdminSession(sessionId, validateSessionInput(bodyInput(req)));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Session not found.' } });
  if (result.type === 'invalid_dates') return res.status(400).json({ error: { message: 'Session end time must be after its start time.' } });
  if (result.type === 'overlap') return res.status(409).json({ error: { message: 'This session overlaps another scheduled session in its cycle.' } });
  if (result.type === 'completed') return res.status(409).json({ error: { message: 'Completed sessions cannot be reopened.' } });
  return res.json({ session: result.session, hasAttendance: result.hasAttendance });
}

export async function checkInQr(req, res) {
  const { sessionId } = paramsInput(req);
  if (invalidId(sessionId, res, 'Session')) return;
  const result = await generateSessionQr(sessionId, req.get('origin'));
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Session not found.' } });
  if (result.type === 'invalid_origin') return res.status(400).json({ error: { message: 'The check-in link origin is not an allowed client origin.' } });
  if (result.type === 'inactive') return res.status(409).json({ error: { message: 'Only scheduled sessions can have an attendance QR code.' } });
  res.set('Cache-Control', 'no-store');
  return res.json(result);
}

export async function attendance(req, res) {
  const { sessionId } = paramsInput(req);
  if (invalidId(sessionId, res, 'Session')) return;
  const result = await listSessionAttendance(sessionId);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Session not found.' } });
  return res.json({ attendance: result.attendance });
}

export async function recordAttendance(req, res) {
  const { sessionId } = paramsInput(req);
  const body = bodyInput(req);
  if (invalidId(sessionId, res, 'Session')) return;
  if (!mongoose.isValidObjectId(body?.studentId)) return res.status(400).json({ error: { message: 'A valid studentId is required.' } });
  const result = await manuallyRecordAttendance(sessionId, body.studentId, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Session not found.' } });
  if (result.type === 'not_enrolled') return res.status(409).json({ error: { message: 'Only students enrolled in the parent cycle can be marked present.' } });
  if (result.type === 'already_recorded') return res.status(409).json({ error: { message: 'Attendance has already been recorded for this student.' } });
  return res.status(201).json({ attendance: result.attendance });
}

export async function reversePoints(req, res) {
  const { sessionId, attendanceId } = paramsInput(req);
  if (invalidId(sessionId, res, 'Session') || invalidId(attendanceId, res, 'Attendance record')) return;
  const reason = bodyInput(req)?.reason;
  if (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 300) {
    return res.status(400).json({ error: { message: 'Provide a reversal reason of up to 300 characters.' } });
  }
  const result = await revokeSessionPoints(sessionId, attendanceId, req.user.id, reason.trim());
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Attendance record not found.' } });
  if (result.type === 'already_reversed') return res.status(409).json({ error: { message: 'Points for this attendance record have already been reversed.' } });
  return res.json({ attendance: result.attendance });
}
