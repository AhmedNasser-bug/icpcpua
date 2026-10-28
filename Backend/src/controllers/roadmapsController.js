import mongoose from 'mongoose';
import {
  checkInToSession,
  enrollInCycle,
  getPublicRoadmap,
  getStudentRoadmapProgress,
  getStudentCycle,
  getStudentRoadmaps,
  getStudentSessionCheckIn,
  listStudentCycles,
  listPublicRoadmaps,
  setStudentRoadmapProblemSolved,
} from '../services/roadmapService.js';
import { validateRoadmapProgressInput } from '../utils/roadmapValidation.js';

export async function list(req, res) {
  return res.json({ roadmaps: await listPublicRoadmaps() });
}

export async function getBySlug(req, res) {
  const roadmap = await getPublicRoadmap(req.params.slug);
  if (!roadmap) return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  return res.json({ roadmap });
}

export async function roadmapCycles(req, res) {
  const result = await listStudentCycles(req.params.roadmapSlug, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  res.set('Cache-Control', 'private, no-store');
  return res.json(result);
}

export async function roadmapProgress(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can track roadmap problems.' } });
  const result = await getStudentRoadmapProgress(req.params.roadmapSlug, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  res.set('Cache-Control', 'private, no-store');
  return res.json({ solvedProblems: result.solvedProblems });
}

export async function updateRoadmapProgress(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can track roadmap problems.' } });
  const progressInput = validateRoadmapProgressInput(req.body);
  const result = await setStudentRoadmapProblemSolved(req.params.roadmapSlug, req.user.id, progressInput);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  if (result.type === 'invalid_problem') return res.status(404).json({ error: { message: 'Problem not found in this roadmap topic.' } });
  res.set('Cache-Control', 'private, no-store');
  return res.json({ solvedProblems: result.solvedProblems });
}

export async function cycleDetails(req, res) {
  if (!mongoose.isValidObjectId(req.params.cycleId)) {
    return res.status(404).json({ error: { message: 'Cycle not found.' } });
  }
  const result = await getStudentCycle(req.params.roadmapSlug, req.params.cycleId, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  res.set('Cache-Control', 'private, no-store');
  return res.json(result);
}

export async function enroll(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can enroll in a cycle.' } });
  if (!mongoose.isValidObjectId(req.params.cycleId)) {
    return res.status(404).json({ error: { message: 'Cycle not found.' } });
  }
  const result = await enrollInCycle(req.params.roadmapSlug, req.params.cycleId, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  if (result.type === 'unavailable') return res.status(409).json({ error: { message: 'Enrollment is not available for this cycle.' } });
  if (result.type === 'already_enrolled') return res.status(409).json({ error: { message: 'You are already enrolled in this cycle.' } });
  if (result.type === 'full') return res.status(409).json({ error: { message: 'This cycle is full.' } });
  if (result.type === 'registration_closed') return res.status(409).json({ error: { message: 'The registration window for this cycle is closed.' } });
  return res.status(201).json({ enrollment: result.enrollment });
}

export async function mine(req, res) {
  return res.json(await getStudentRoadmaps(req.user.id));
}

export async function sessionCheckInDetails(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can check in to a roadmap session.' } });
  if (!mongoose.isValidObjectId(req.params.sessionId)) {
    return res.status(404).json({ error: { message: 'This session check-in link is invalid or expired.' } });
  }
  const result = await getStudentSessionCheckIn(req.params.sessionId, req.query.token, req.user.id);
  if (result.type === 'invalid') return res.status(404).json({ error: { message: 'This session check-in link is invalid or expired.' } });
  if (result.type === 'not_enrolled') return res.status(403).json({ error: { message: 'You must be enrolled in the parent cycle to check in.' } });
  res.set('Cache-Control', 'no-store');
  return res.json({ session: result.session, attendance: result.attendance, checkInWindow: { isOpen: result.isOpen } });
}

export async function submitSessionCheckIn(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can check in to a roadmap session.' } });
  if (!mongoose.isValidObjectId(req.params.sessionId)) {
    return res.status(404).json({ error: { message: 'This session check-in link is invalid or expired.' } });
  }
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const result = await checkInToSession(req.params.sessionId, body.token, req.user.id);
  if (result.type === 'invalid') return res.status(404).json({ error: { message: 'This session check-in link is invalid or expired.' } });
  if (result.type === 'not_enrolled') return res.status(403).json({ error: { message: 'You must be enrolled in the parent cycle to check in.' } });
  if (result.type === 'outside_window') return res.status(409).json({ error: { message: 'Session check-in is outside the attendance window.' } });
  if (result.type === 'already_checked_in') {
    return res.status(409).json({ error: { message: 'You have already checked in to this session.' }, attendance: result.attendance });
  }
  return res.json({ message: 'Session check-in successful.', attendance: result.attendance });
}
