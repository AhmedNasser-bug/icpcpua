import mongoose from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import { config, isAllowedClientOrigin } from '../config/env.js';
import {
  aggregateSessionAttendanceBySession,
  countAttendanceForSessions,
  createCycle,
  createEnrollment,
  createRoadmap,
  createRoadmapNode,
  createSessionAttendance,
  decrementCycleEnrollment,
  deleteRoadmapNode,
  findAttendanceById,
  findCycleById,
  findCycleEnrollments,
  findCyclesForRoadmap,
  findEnrollment,
  findRoadmap,
  findRoadmapNode,
  findRoadmapNodes,
  findRoadmapProgress,
  findRoadmaps,
  findSessionById,
  findSessionWithToken,
  findSessionsForCycle,
  findSessionsByCycleIds,
  findSessionAttendance,
  findStudentEnrollments,
  findStudentSessionAttendance,
  findStudentSessionAttendanceBySession,
  getRoadmapLeaderboardEntries,
  reserveCycleEnrollment,
  reverseAttendancePoints,
  saveGeneratedSession,
  setSessionCheckInToken,
  updateCycle,
  updateRoadmap,
  updateRoadmapNode,
  updateRoadmapProblemProgress,
  updateSession,
} from '../repositories/roadmapRepository.js';
import { generateSessionSchedule } from '../utils/roadmapSchedule.js';
import { hasValidRoadmapNodeDependencyGraph } from '../utils/roadmapGraph.js';
import { createCheckInToken, hashCheckInToken, isWithinCheckInWindow } from '../utils/checkIn.js';
import { slugify } from '../utils/validation.js';

function objectId(value) {
  return mongoose.isValidObjectId(value);
}

export async function listAdminRoadmapNodes(roadmapId) {
  if (!objectId(roadmapId)) return { type: 'not_found' };
  const roadmap = await findRoadmap({ _id: roadmapId });
  if (!roadmap) return { type: 'not_found' };
  return { type: 'ok', nodes: await findRoadmapNodes(roadmap._id) };
}

export async function createAdminRoadmapNode(roadmapId, data) {
  const roadmap = objectId(roadmapId) ? await findRoadmap({ _id: roadmapId }) : null;
  if (!roadmap) return { type: 'not_found' };
  if (roadmap.status === 'archived') return { type: 'archived' };
  const nodes = await findRoadmapNodes(roadmap._id);
  if (!hasValidRoadmapNodeDependencyGraph(nodes, null, data.dependencies || [])) return { type: 'invalid_dependencies' };
  return { type: 'created', node: await createRoadmapNode({ ...data, roadmap: roadmap._id }) };
}

export async function updateAdminRoadmapNode(roadmapId, nodeId, data) {
  if (!objectId(roadmapId) || !objectId(nodeId)) return { type: 'not_found' };
  const roadmap = await findRoadmap({ _id: roadmapId });
  const existing = await findRoadmapNode({ _id: nodeId, roadmap: roadmapId });
  if (!roadmap || !existing) return { type: 'not_found' };
  if (roadmap.status === 'archived') return { type: 'archived' };
  const nodes = await findRoadmapNodes(roadmap._id);
  const dependencies = data.dependencies || existing.dependencies || [];
  if (!hasValidRoadmapNodeDependencyGraph(nodes, existing._id, dependencies)) return { type: 'invalid_dependencies' };
  return { type: 'updated', node: await updateRoadmapNode(existing._id, data) };
}

export async function deleteAdminRoadmapNode(roadmapId, nodeId) {
  if (!objectId(roadmapId) || !objectId(nodeId)) return { type: 'not_found' };
  const roadmap = await findRoadmap({ _id: roadmapId });
  if (!roadmap || roadmap.status === 'archived') return { type: roadmap ? 'archived' : 'not_found' };
  const node = await deleteRoadmapNode(roadmap._id, nodeId);
  return node ? { type: 'deleted' } : { type: 'not_found' };
}

function roadmapSlug(title) {
  return `${slugify(title) || 'roadmap'}-${randomBytes(3).toString('hex')}`;
}

function withinSessionWindow(session, now = new Date()) {
  return isWithinCheckInWindow({
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    checkInOpensAt: session.checkInOpensAt,
    checkInClosesAt: session.checkInClosesAt,
  }, now);
}

export async function listPublicRoadmaps() {
  const roadmaps = await findRoadmaps({ status: { $in: ['published', 'completed'] } }, { updatedAt: -1 });
  return roadmaps.map(({ createdBy, ...publicRoadmap }) => publicRoadmap);
}

export async function getPublicRoadmap(slug) {
  const roadmap = await findRoadmap({ slug, status: { $in: ['published', 'completed'] } });
  if (!roadmap) return null;
  const nodes = await findRoadmapNodes(roadmap._id);
  const publicRoadmap = { ...roadmap };
  delete publicRoadmap.createdBy;
  return { ...publicRoadmap, nodes };
}

export async function getStudentRoadmapProgress(roadmapSlug, studentId) {
  const roadmap = await findRoadmap({ slug: roadmapSlug, status: { $in: ['published', 'completed'] } });
  if (!roadmap) return { type: 'not_found' };
  const [nodes, progress] = await Promise.all([
    findRoadmapNodes(roadmap._id),
    findRoadmapProgress(roadmap._id, studentId),
  ]);
  const problemUrlsByNode = new Map(nodes.map((node) => [String(node._id), new Set((node.problems || []).map(({ url }) => url))]));
  const solvedProblems = (progress?.solvedProblems || [])
    .filter(({ node, problemUrl }) => problemUrlsByNode.get(String(node))?.has(problemUrl))
    .map(({ node, problemUrl }) => ({ nodeId: String(node), problemUrl }));
  return { type: 'ok', solvedProblems };
}

export async function setStudentRoadmapProblemSolved(roadmapSlug, studentId, { nodeId, problemUrl, solved }) {
  const roadmap = await findRoadmap({ slug: roadmapSlug, status: { $in: ['published', 'completed'] } });
  if (!roadmap) return { type: 'not_found' };
  const node = await findRoadmapNode({ _id: nodeId, roadmap: roadmap._id });
  if (!node || !(node.problems || []).some((problem) => problem.url === problemUrl)) {
    return { type: 'invalid_problem' };
  }
  const progress = await updateRoadmapProblemProgress(roadmap._id, studentId, node._id, problemUrl, solved);
  return {
    type: 'ok',
    solvedProblems: (progress?.solvedProblems || []).map(({ node: solvedNode, problemUrl: solvedUrl }) => ({
      nodeId: String(solvedNode),
      problemUrl: solvedUrl,
    })),
  };
}

export async function listStudentCycles(roadmapSlug, studentId) {
  const roadmap = await findRoadmap({ slug: roadmapSlug, status: { $in: ['published', 'completed'] } });
  if (!roadmap) return { type: 'not_found' };
  const cycles = await findCyclesForRoadmap(roadmap._id, { status: { $in: ['published', 'completed'] } });
  const enrollments = await findStudentEnrollments(studentId);
  const enrolledCycleIds = new Set(enrollments.map(({ cycle }) => cycle?._id?.toString()).filter(Boolean));
  const now = new Date();
  return {
    type: 'ok',
    roadmap: { _id: roadmap._id, title: roadmap.title, slug: roadmap.slug },
    cycles: cycles.map((cycle) => ({
      ...cycle,
      enrolled: enrolledCycleIds.has(cycle._id.toString()),
      registrationOpen: cycle.status === 'published'
        && cycle.registrationOpensAt <= now
        && cycle.registrationClosesAt >= now
        && (cycle.capacity === null || cycle.capacity === undefined || cycle.enrollmentCount < cycle.capacity),
      remainingCapacity: cycle.capacity === null || cycle.capacity === undefined
        ? null
        : Math.max(0, cycle.capacity - cycle.enrollmentCount),
    })),
  };
}

export async function listAdminRoadmaps() {
  const roadmaps = await findRoadmaps({}, { updatedAt: -1 });
  return Promise.all(roadmaps.map(async (roadmap) => ({
    ...roadmap,
    cycles: await findCyclesForRoadmap(roadmap._id),
  })));
}

export async function createAdminRoadmap(data, adminId) {
  return createRoadmap({ ...data, slug: roadmapSlug(data.title), createdBy: adminId });
}

export async function updateAdminRoadmap(roadmapId, data) {
  if (!objectId(roadmapId)) return { type: 'not_found' };
  const existing = await findRoadmap({ _id: roadmapId });
  if (!existing) return { type: 'not_found' };
  if (existing.status === 'archived' && Object.keys(data).length) return { type: 'archived' };
  return { type: 'updated', roadmap: await updateRoadmap(roadmapId, data) };
}

export async function createAdminCycle(roadmapId, data) {
  const roadmap = objectId(roadmapId) ? await findRoadmap({ _id: roadmapId }) : null;
  if (!roadmap) return { type: 'roadmap_not_found' };
  if (data.status === 'published' && roadmap.status !== 'published') return { type: 'roadmap_not_published' };
  try {
    const cycle = await createCycle({ ...data, roadmap: roadmap._id });
    return { type: 'created', cycle };
  } catch (error) {
    if (error.code === 11000) return { type: 'duplicate_order' };
    throw error;
  }
}

export async function updateAdminCycle(cycleId, data) {
  if (!objectId(cycleId)) return { type: 'not_found' };
  const existing = await findCycleById(cycleId);
  if (!existing) return { type: 'not_found' };
  if (existing.status === 'archived' && Object.keys(data).length) return { type: 'archived' };
  if (data.capacity !== undefined && data.capacity !== null && data.capacity < existing.enrollmentCount) {
    return { type: 'capacity_below_enrollment' };
  }
  const next = { ...existing, ...data };
  try {
    const sessions = generateSessionSchedule(next);
    if (next.registrationClosesAt >= sessions[0].startsAt) {
      return { type: 'invalid_registration_window' };
    }
  } catch (error) {
    return { type: 'invalid_schedule', message: error.message, field: error.field };
  }
  if (next.registrationClosesAt < next.registrationOpensAt) return { type: 'invalid_registration_window' };
  if (next.status === 'published') {
    const roadmap = await findRoadmap({ _id: existing.roadmap });
    if (roadmap?.status !== 'published') return { type: 'roadmap_not_published' };
  }
  try {
    return { type: 'updated', cycle: await updateCycle(cycleId, data) };
  } catch (error) {
    if (error.code === 11000) return { type: 'duplicate_order' };
    throw error;
  }
}

async function buildScheduleDiff(cycle) {
  const proposed = generateSessionSchedule(cycle);
  const existing = await findSessionsForCycle(cycle._id);
  const attendance = existing.length ? await countAttendanceForSessions(existing.map(({ _id }) => _id)) : [];
  const attendanceById = new Map(attendance.map(({ _id, count }) => [_id.toString(), count]));
  const byOrdinal = new Map(existing.map((session) => [session.ordinal, session]));
  const actions = proposed.map((next) => {
    const previous = byOrdinal.get(next.ordinal);
    if (!previous) return { action: 'add', ordinal: next.ordinal, next };
    byOrdinal.delete(next.ordinal);
    const changed = previous.startsAt.getTime() !== next.startsAt.getTime()
      || previous.endsAt.getTime() !== next.endsAt.getTime();
    if (!changed || previous.status === 'cancelled') return { action: 'keep', ordinal: next.ordinal, previous };
    if (previous.status === 'completed' || attendanceById.get(previous._id.toString()) > 0) {
      return { action: 'preserve', ordinal: next.ordinal, previous, next };
    }
    return { action: 'reschedule', ordinal: next.ordinal, previous, next };
  });
  for (const previous of byOrdinal.values()) {
    if (previous.status === 'scheduled'
      && previous.startsAt > new Date()
      && !attendanceById.get(previous._id.toString())) {
      actions.push({ action: 'cancel', ordinal: previous.ordinal, previous });
    } else actions.push({ action: 'preserve', ordinal: previous.ordinal, previous });
  }
  const fingerprint = JSON.stringify({
    cycleId: cycle._id.toString(),
    startDate: cycle.startDate,
    endDate: cycle.endDate,
    sessionsPerWeek: cycle.sessionsPerWeek,
    trainingDays: cycle.trainingDays,
    startTime: cycle.startTime,
    sessionDurationMinutes: cycle.sessionDurationMinutes,
    timeZone: cycle.timeZone,
    attendancePoints: cycle.attendancePoints,
    proposed: proposed.map(({ ordinal, startsAt, endsAt, attendancePoints }) => [
      ordinal, startsAt.toISOString(), endsAt.toISOString(), attendancePoints,
    ]),
    existing: existing.map(({ _id, ordinal, startsAt, endsAt, status, updatedAt }) => [
      _id.toString(), ordinal, startsAt.toISOString(), endsAt.toISOString(), status, updatedAt?.toISOString(),
    ]),
    attendance: attendance.sort((left, right) => left._id.toString().localeCompare(right._id.toString())),
  });
  const confirmationToken = createHash('sha256').update(fingerprint).digest('hex');
  return { proposedCount: proposed.length, actions, proposed, confirmationToken };
}

export async function previewCycleSchedule(cycleId) {
  if (!objectId(cycleId)) return { type: 'not_found' };
  const cycle = await findCycleById(cycleId);
  if (!cycle) return { type: 'not_found' };
  const diff = await buildScheduleDiff(cycle);
  return {
    type: 'ok',
    preview: {
      proposedCount: diff.proposedCount,
      confirmationToken: diff.confirmationToken,
      additions: diff.actions.filter(({ action }) => action === 'add').length,
      reschedules: diff.actions.filter(({ action }) => action === 'reschedule').length,
      preserved: diff.actions.filter(({ action }) => action === 'preserve').length,
      cancellations: diff.actions.filter(({ action }) => action === 'cancel').length,
      sessions: diff.proposed,
      changes: diff.actions.map(({ action, ordinal, previous, next }) => ({
        action,
        ordinal,
        previousStartsAt: previous?.startsAt,
        startsAt: next?.startsAt || previous?.startsAt,
      })),
    },
  };
}

export async function generateCycleSchedule(cycleId, confirmationToken) {
  if (typeof confirmationToken !== 'string' || !/^[a-f0-9]{64}$/.test(confirmationToken)) return { type: 'confirmation_required' };
  if (!objectId(cycleId)) return { type: 'not_found' };
  const cycle = await findCycleById(cycleId);
  if (!cycle) return { type: 'not_found' };
  const diff = await buildScheduleDiff(cycle);
  if (diff.confirmationToken !== confirmationToken) return { type: 'schedule_changed' };
  let created = 0;
  let rescheduled = 0;
  let cancelled = 0;
  for (const action of diff.actions) {
    if (action.action === 'add') {
      await saveGeneratedSession(cycle._id, {
        ...action.next,
        sessionDurationMinutes: cycle.sessionDurationMinutes,
      });
      created += 1;
    } else if (action.action === 'reschedule') {
      await updateSession(action.previous._id, {
        startsAt: action.next.startsAt,
        endsAt: action.next.endsAt,
        timeZone: action.next.timeZone,
        status: 'rescheduled',
      });
      rescheduled += 1;
    } else if (action.action === 'cancel') {
      await updateSession(action.previous._id, { status: 'cancelled', checkInTokenHash: null });
      cancelled += 1;
    }
  }
  return { type: 'generated', summary: { proposedCount: diff.proposedCount, created, rescheduled, cancelled, preserved: diff.actions.filter(({ action }) => action === 'preserve').length } };
}

export async function getCycleSessions(cycleId) {
  if (!objectId(cycleId)) return { type: 'not_found' };
  const cycle = await findCycleById(cycleId);
  if (!cycle) return { type: 'not_found' };
  const sessions = await findSessionsForCycle(cycleId);
  const stats = sessions.length ? await aggregateSessionAttendanceBySession(sessions.map(({ _id }) => _id)) : [];
  const statsById = new Map(stats.map((item) => [item._id.toString(), item]));
  return {
    type: 'ok',
    sessions: sessions.map((session) => ({ ...session, attendance: statsById.get(session._id.toString()) || { attendanceCount: 0, pointsAwarded: 0 } })),
  };
}

export async function getCycleStudents(cycleId) {
  if (!objectId(cycleId)) return { type: 'not_found' };
  const cycle = await findCycleById(cycleId);
  if (!cycle) return { type: 'not_found' };
  const enrollments = await findCycleEnrollments(cycleId);
  return { type: 'ok', enrollments };
}

export async function updateAdminSession(sessionId, data) {
  if (!objectId(sessionId)) return { type: 'not_found' };
  const existing = await findSessionById(sessionId);
  if (!existing) return { type: 'not_found' };
  const nextStart = data.startsAt || existing.startsAt;
  const nextEnd = data.endsAt || existing.endsAt;
  if (nextEnd <= nextStart) return { type: 'invalid_dates' };
  const siblings = await findSessionsForCycle(existing.cycle);
  if ((data.status || existing.status) !== 'cancelled' && siblings.some((session) => session._id.toString() !== existing._id.toString()
    && session.status !== 'cancelled'
    && nextStart < session.endsAt
    && nextEnd > session.startsAt)) return { type: 'overlap' };
  const attendance = await findSessionAttendance(sessionId);
  if (existing.status === 'completed' && data.status && data.status !== 'completed') return { type: 'completed' };
  const scheduleChanged = nextStart.getTime() !== existing.startsAt.getTime()
    || nextEnd.getTime() !== existing.endsAt.getTime();
  const updated = await updateSession(sessionId, {
    ...data,
    ...(scheduleChanged && !['cancelled', 'completed'].includes(data.status) ? { status: 'rescheduled' } : {}),
    ...(data.status === 'cancelled' ? { checkInTokenHash: null } : {}),
  });
  return { type: 'updated', session: updated, hasAttendance: attendance.length > 0 };
}

export async function generateSessionQr(sessionId, origin) {
  if (!objectId(sessionId)) return { type: 'not_found' };
  const clientOrigin = origin || config.clientOrigin;
  if (!isAllowedClientOrigin(clientOrigin)) return { type: 'invalid_origin' };
  const session = await findSessionById(sessionId);
  if (!session) return { type: 'not_found' };
  if (!['scheduled', 'rescheduled'].includes(session.status)) return { type: 'inactive' };
  const { token, tokenHash } = createCheckInToken();
  const result = await setSessionCheckInToken(sessionId, tokenHash);
  if (!result.modifiedCount) return { type: 'inactive' };
  const checkInUrl = new URL(`/roadmaps/check-in/${sessionId}`, clientOrigin);
  checkInUrl.searchParams.set('token', token);
  const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl.toString(), {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 1024,
  });
  return { type: 'ok', checkInUrl: checkInUrl.toString(), qrCodeDataUrl, session: { id: sessionId, title: session.title, startsAt: session.startsAt } };
}

export async function listSessionAttendance(sessionId) {
  if (!objectId(sessionId)) return { type: 'not_found' };
  const session = await findSessionById(sessionId);
  if (!session) return { type: 'not_found' };
  return { type: 'ok', attendance: await findSessionAttendance(sessionId) };
}

export async function manuallyRecordAttendance(sessionId, studentId, adminId) {
  if (!objectId(sessionId) || !objectId(studentId)) return { type: 'not_found' };
  const session = await findSessionById(sessionId);
  if (!session || session.status === 'cancelled') return { type: 'not_found' };
  const enrollment = await findEnrollment(session.cycle, studentId);
  if (!enrollment) return { type: 'not_enrolled' };
  try {
    const attendance = await createSessionAttendance({
      session: session._id,
      student: studentId,
      checkedInAt: new Date(),
      pointsAwarded: session.attendancePoints,
      recordedBy: 'admin',
      recordedByUser: adminId,
    });
    return { type: 'created', attendance };
  } catch (error) {
    if (error.code === 11000) return { type: 'already_recorded' };
    throw error;
  }
}

export async function revokeSessionPoints(sessionId, attendanceId, adminId, reason) {
  if (!objectId(sessionId) || !objectId(attendanceId)) return { type: 'not_found' };
  const attendance = await findAttendanceById(sessionId, attendanceId);
  if (!attendance) return { type: 'not_found' };
  if (attendance.reversedAt) return { type: 'already_reversed' };
  const result = await reverseAttendancePoints(attendance._id, attendance.pointsAwarded, adminId, reason);
  return result ? { type: 'reversed', attendance: result } : { type: 'already_reversed' };
}

export async function enrollInCycle(roadmapSlug, cycleId, studentId, now = new Date()) {
  if (!objectId(cycleId)) return { type: 'not_found' };
  const cycle = await findCycleById(cycleId);
  if (!cycle) return { type: 'not_found' };
  const roadmap = await findRoadmap({ _id: cycle.roadmap });
  if (!roadmap || roadmap.slug !== roadmapSlug) return { type: 'not_found' };
  if (roadmap.status !== 'published') return { type: 'unavailable' };
  if (cycle.status !== 'published') return { type: 'unavailable' };
  if (await findEnrollment(cycle._id, studentId)) return { type: 'already_enrolled' };
  const reserved = await reserveCycleEnrollment(cycle._id, now);
  if (!reserved.modifiedCount) {
    if (await findEnrollment(cycle._id, studentId)) return { type: 'already_enrolled' };
    return { type: cycle.capacity !== null && cycle.enrollmentCount >= cycle.capacity ? 'full' : 'registration_closed' };
  }
  try {
    const enrollment = await createEnrollment(cycle._id, studentId);
    return { type: 'enrolled', enrollment };
  } catch (error) {
    await decrementCycleEnrollment(cycle._id);
    if (error.code === 11000) return { type: 'already_enrolled' };
    throw error;
  }
}

export async function getStudentRoadmaps(studentId) {
  const enrollments = await findStudentEnrollments(studentId);
  const cycles = enrollments.map(({ cycle }) => cycle).filter(Boolean);
  const cycleIds = cycles.map(({ _id }) => _id);
  const sessions = cycleIds.length ? await findSessionsByCycleIds(cycleIds) : [];
  const sessionIds = sessions.map(({ _id }) => _id);
  const attendance = sessionIds.length ? await findStudentSessionAttendance(studentId, sessionIds) : [];
  const attendanceBySession = new Map(attendance.map((item) => [item.session.toString(), item]));
  const sessionsByCycle = new Map();
  for (const session of sessions) {
    const key = session.cycle.toString();
    if (!sessionsByCycle.has(key)) sessionsByCycle.set(key, []);
    const record = attendanceBySession.get(session._id.toString());
    sessionsByCycle.get(key).push({
      ...session,
      attended: Boolean(record),
      checkedInAt: record?.checkedInAt || null,
      pointsAwarded: record ? record.pointsAwarded - (record.pointsReversed || 0) : 0,
    });
  }
  return {
    roadmaps: enrollments.map(({ enrolledAt, cycle }) => {
      if (!cycle) return null;
      const cycleSessions = sessionsByCycle.get(cycle._id.toString()) || [];
      const eligible = cycleSessions.filter((session) => session.status !== 'cancelled');
      const completed = eligible.filter((session) => session.status === 'completed');
      const attendedCount = completed.filter((session) => session.attended).length;
      const roadmap = cycle.roadmap;
      return {
        enrollment: { enrolledAt },
        roadmap,
        cycle: {
          ...cycle,
          sessions: cycleSessions.map(({ _id, title, startsAt, status, timeZone }) => ({ _id, title, startsAt, status, timeZone })),
        },
        progress: {
          completedSessions: completed.length,
          sessionsAttended: attendedCount,
          totalSessions: eligible.length,
          progressPercentage: eligible.length ? Math.round((completed.length / eligible.length) * 100) : 0,
          attendancePercentage: completed.length ? Math.round((attendedCount / completed.length) * 100) : 0,
          points: attendance.filter((item) => cycleSessions.some((session) => session._id.toString() === item.session.toString()))
            .reduce((sum, item) => sum + item.pointsAwarded - (item.pointsReversed || 0), 0),
        },
      };
    }).filter(Boolean),
  };
}

export async function getStudentCycle(roadmapSlug, cycleId, studentId) {
  if (!objectId(cycleId)) return { type: 'not_found' };
  const cycle = await findCycleById(cycleId);
  if (!cycle) return { type: 'not_found' };
  const roadmap = await findRoadmap({ _id: cycle.roadmap });
  if (!roadmap || roadmap.slug !== roadmapSlug) return { type: 'not_found' };
  const enrolled = studentId ? Boolean(await findEnrollment(cycle._id, studentId)) : false;
  if ((!['published', 'completed'].includes(roadmap.status) || !['published', 'completed'].includes(cycle.status)) && !enrolled) {
    return { type: 'not_found' };
  }
  const sessions = await findSessionsForCycle(cycle._id);
  const attendance = enrolled ? await findStudentSessionAttendance(studentId, sessions.map(({ _id }) => _id)) : [];
  const attended = new Set(attendance.map(({ session }) => session.toString()));
  const publicRoadmap = { ...roadmap };
  delete publicRoadmap.createdBy;
  return {
    type: 'ok',
    roadmap: publicRoadmap,
    cycle,
    enrolled,
    registrationOpen: cycle.status === 'published'
      && cycle.registrationOpensAt <= new Date()
      && cycle.registrationClosesAt >= new Date()
      && (cycle.capacity === null || cycle.capacity === undefined || cycle.enrollmentCount < cycle.capacity),
    sessions: sessions.map((session) => ({
      ...session,
      attended: attended.has(session._id.toString()),
      ...(!enrolled ? { materials: [], problemSets: [] } : {}),
    })),
  };
}

export async function getStudentSessionCheckIn(sessionId, token, studentId) {
  if (!objectId(sessionId)) return { type: 'invalid' };
  const tokenHash = hashCheckInToken(token);
  const session = tokenHash ? await findSessionWithToken(sessionId, tokenHash) : null;
  if (!session) return { type: 'invalid' };
  const enrollment = await findEnrollment(session.cycle, studentId);
  if (!enrollment) return { type: 'not_enrolled' };
  return {
    type: 'ok',
    session: { id: session.id, title: session.title, startsAt: session.startsAt, endsAt: session.endsAt, timeZone: session.timeZone },
    attendance: await findStudentSessionAttendanceBySession(studentId, sessionId),
    isOpen: withinSessionWindow(session),
  };
}

export async function checkInToSession(sessionId, token, studentId, now = new Date()) {
  if (!objectId(sessionId)) return { type: 'invalid' };
  const tokenHash = hashCheckInToken(token);
  const session = tokenHash ? await findSessionWithToken(sessionId, tokenHash) : null;
  if (!session) return { type: 'invalid' };
  const cycle = await findCycleById(session.cycle);
  if (!cycle || cycle.status !== 'published') return { type: 'invalid' };
  if (!withinSessionWindow(session, now)) return { type: 'outside_window' };
  if (!await findEnrollment(session.cycle, studentId)) return { type: 'not_enrolled' };
  try {
    const attendance = await createSessionAttendance({
      session: session._id,
      student: studentId,
      checkedInAt: now,
      pointsAwarded: session.attendancePoints,
      recordedBy: 'qr',
    });
    return { type: 'success', attendance };
  } catch (error) {
    if (error.code !== 11000) throw error;
    return { type: 'already_checked_in', attendance: await findStudentSessionAttendanceBySession(studentId, sessionId) };
  }
}

export async function getRoadmapPointsByStudent() {
  return getRoadmapLeaderboardEntries();
}
