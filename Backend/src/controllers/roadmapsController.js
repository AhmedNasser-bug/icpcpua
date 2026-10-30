import mongoose from 'mongoose';
import {
  checkInToSession,
  enrollInCycle,
  leaveCycle,
  getPublicRoadmap,
  getStudentRoadmapProgress,
  getStudentCycle,
  getStudentRoadmaps,
  getStudentSessionCheckIn,
  listAvailableStudentCycles,
  listStudentCycles,
  listPublicRoadmaps,
  setStudentRoadmapProblemSolved,
} from '../services/roadmapService.js';
import { validateRoadmapProgressInput } from '../utils/roadmapValidation.js';

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
  return res.json({ roadmaps: await listPublicRoadmaps() });
}

export async function getBySlug(req, res) {
  const { slug } = paramsInput(req);
  const roadmap = await getPublicRoadmap(slug);
  if (!roadmap) return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  return res.json({ roadmap });
}

export async function roadmapCycles(req, res) {
  const { roadmapSlug } = paramsInput(req);
  const result = await listStudentCycles(roadmapSlug, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  res.set('Cache-Control', 'private, no-store');
  return res.json(result);
}

export async function allRoadmapCycles(req, res) {
  res.set('Cache-Control', 'private, no-store');
  return res.json(await listAvailableStudentCycles(req.user.id));
}

export async function roadmapProgress(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can track roadmap problems.' } });
  const { roadmapSlug } = paramsInput(req);
  const result = await getStudentRoadmapProgress(roadmapSlug, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  res.set('Cache-Control', 'private, no-store');
  return res.json({ solvedProblems: result.solvedProblems });
}

export async function updateRoadmapProgress(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can track roadmap problems.' } });
  const { roadmapSlug } = paramsInput(req);
  const progressInput = validateRoadmapProgressInput(bodyInput(req));
  const result = await setStudentRoadmapProblemSolved(roadmapSlug, req.user.id, progressInput);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Roadmap not found.' } });
  if (result.type === 'invalid_problem') return res.status(404).json({ error: { message: 'Problem not found in this roadmap topic.' } });
  if (result.type === 'prerequisites_incomplete') return res.status(409).json({
    error: { message: 'Complete every prerequisite topic before marking this problem solved.' },
  });
  res.set('Cache-Control', 'private, no-store');
  return res.json({ solvedProblems: result.solvedProblems });
}

export async function cycleDetails(req, res) {
  const { roadmapSlug, cycleId } = paramsInput(req);
  if (!mongoose.isValidObjectId(cycleId)) {
    return res.status(404).json({ error: { message: 'Cycle not found.' } });
  }
  const result = await getStudentCycle(roadmapSlug, cycleId, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  res.set('Cache-Control', 'private, no-store');
  return res.json(result);
}

export async function enroll(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can enroll in a cycle.' } });
  const { roadmapSlug, cycleId } = paramsInput(req);
  if (!mongoose.isValidObjectId(cycleId)) {
    return res.status(404).json({ error: { message: 'Cycle not found.' } });
  }
  const result = await enrollInCycle(roadmapSlug, cycleId, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  if (result.type === 'unavailable') return res.status(409).json({ error: { message: 'Enrollment is not available for this cycle.' } });
  if (result.type === 'already_enrolled') return res.status(409).json({ error: { message: 'You are already enrolled in this cycle.' } });
  if (result.type === 'full') return res.status(409).json({ error: { message: 'This cycle is full.' } });
  if (result.type === 'registration_closed') return res.status(409).json({ error: { message: 'The registration window for this cycle is closed.' } });
  return res.status(201).json({ enrollment: result.enrollment });
}

export async function leave(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can leave a cycle.' } });
  const { roadmapSlug, cycleId } = paramsInput(req);
  if (!mongoose.isValidObjectId(cycleId)) {
    return res.status(404).json({ error: { message: 'Cycle not found.' } });
  }
  const result = await leaveCycle(roadmapSlug, cycleId, req.user.id);
  if (result.type === 'not_found') return res.status(404).json({ error: { message: 'Cycle not found.' } });
  if (result.type === 'not_enrolled') return res.status(409).json({ error: { message: 'You are not enrolled in this cycle.' } });
  if (result.type === 'cycle_started') return res.status(409).json({ error: { message: 'You can only leave this cycle before it starts.' } });
  return res.json({ message: 'You have left this cycle.' });
}

export async function mine(req, res) {
  res.set('Cache-Control', 'private, no-store');
  return res.json(await getStudentRoadmaps(req.user.id));
}

export async function sessionCheckInDetails(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can check in to a roadmap session.' } });
  const { sessionId } = paramsInput(req);
  const { token } = queryInput(req);
  if (!mongoose.isValidObjectId(sessionId)) {
    return res.status(404).json({ error: { message: 'This session check-in link is invalid or expired.' } });
  }
  const result = await getStudentSessionCheckIn(sessionId, token, req.user.id);
  if (result.type === 'invalid') return res.status(404).json({ error: { message: 'This session check-in link is invalid or expired.' } });
  if (result.type === 'not_enrolled') return res.status(403).json({ error: { message: 'You must be enrolled in the parent cycle to check in.' } });
  res.set('Cache-Control', 'no-store');
  return res.json({ session: result.session, attendance: result.attendance, checkInWindow: { isOpen: result.isOpen } });
}

export async function submitSessionCheckIn(req, res) {
  if (req.user.role !== 'user') return res.status(403).json({ error: { message: 'Only student accounts can check in to a roadmap session.' } });
  const { sessionId } = paramsInput(req);
  if (!mongoose.isValidObjectId(sessionId)) {
    return res.status(404).json({ error: { message: 'This session check-in link is invalid or expired.' } });
  }
  const body = bodyInput(req);
  const result = await checkInToSession(sessionId, body.token, req.user.id);
  if (result.type === 'invalid') return res.status(404).json({ error: { message: 'This session check-in link is invalid or expired.' } });
  if (result.type === 'not_enrolled') return res.status(403).json({ error: { message: 'You must be enrolled in the parent cycle to check in.' } });
  if (result.type === 'outside_window') return res.status(409).json({ error: { message: 'Session check-in is outside the attendance window.' } });
  if (result.type === 'already_checked_in') {
    return res.status(409).json({ error: { message: 'You have already checked in to this session.' }, attendance: result.attendance });
  }
  return res.json({ message: 'Session check-in successful.', attendance: result.attendance });
}
