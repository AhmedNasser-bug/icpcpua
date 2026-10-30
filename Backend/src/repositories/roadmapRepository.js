import Roadmap from '../models/Roadmap.js';
import RoadmapNode from '../models/RoadmapNode.js';
import RoadmapProgress from '../models/RoadmapProgress.js';
import RoadmapAttendance from '../models/RoadmapAttendance.js';
import RoadmapCycle from '../models/RoadmapCycle.js';
import RoadmapEnrollment from '../models/RoadmapEnrollment.js';
import RoadmapSession from '../models/RoadmapSession.js';

export function findRoadmaps(filter = {}, sort = { createdAt: -1 }) {
  return Roadmap.find(filter).sort(sort).lean();
}

export function findRoadmap(filter) {
  return Roadmap.findOne(filter).lean();
}

export function createRoadmap(data) {
  return Roadmap.create(data);
}

export function updateRoadmap(id, data) {
  return Roadmap.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}

export function findRoadmapNodes(roadmapId) {
  return RoadmapNode.find({ roadmap: roadmapId }).sort({ position: 1, createdAt: 1 }).lean();
}

export function findRoadmapNode(filter) {
  return RoadmapNode.findOne(filter).lean();
}

export function findRoadmapProgress(roadmapId, studentId) {
  return RoadmapProgress.findOne({ roadmap: roadmapId, student: studentId }).lean();
}

export function findRoadmapProgressForNode(roadmapId, nodeId) {
  return RoadmapProgress.find({
    roadmap: roadmapId,
    'solvedProblems.node': nodeId,
  }).select('solvedProblems').lean();
}

export function updateRoadmapProblemProgress(roadmapId, studentId, nodeId, problemUrl, solved) {
  const filter = { roadmap: roadmapId, student: studentId };
  if (!solved) {
    return RoadmapProgress.findOneAndUpdate(filter, {
      $pull: { solvedProblems: { node: nodeId, problemUrl } },
    }, { new: true }).lean();
  }
  return RoadmapProgress.findOneAndUpdate(filter, {
    $addToSet: { solvedProblems: { node: nodeId, problemUrl } },
  }, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }).lean();
}

export function createRoadmapNode(data) {
  return RoadmapNode.create(data);
}

export function updateRoadmapNode(id, data) {
  return RoadmapNode.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}

export async function deleteRoadmapNode(roadmapId, nodeId) {
  const node = await RoadmapNode.findOne({ _id: nodeId, roadmap: roadmapId }).lean();
  if (!node) return null;
  await RoadmapNode.updateMany({ roadmap: roadmapId, dependencies: nodeId }, { $pull: { dependencies: nodeId } });
  return RoadmapNode.findOneAndDelete({ _id: node._id, roadmap: roadmapId }).lean();
}

export function findCyclesForRoadmap(roadmapId, filter = {}) {
  return RoadmapCycle.find({ roadmap: roadmapId, ...filter }).sort({ order: 1 }).lean();
}

export function findCyclesForRoadmaps(roadmapIds, filter = {}) {
  return RoadmapCycle.find({ roadmap: { $in: roadmapIds }, ...filter }).sort({ startDate: 1, order: 1 }).lean();
}

export function findCycleById(id) {
  return RoadmapCycle.findById(id).lean();
}

export function createCycle(data) {
  return RoadmapCycle.create(data);
}

export function updateCycle(id, data) {
  return RoadmapCycle.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}

export function reserveCycleEnrollment(id, now) {
  return RoadmapCycle.updateOne({
    _id: id,
    status: 'published',
    registrationOpensAt: { $lte: now },
    registrationClosesAt: { $gte: now },
    $or: [
      { capacity: null },
      { capacity: { $exists: false } },
      { $expr: { $lt: ['$enrollmentCount', '$capacity'] } },
    ],
  }, { $inc: { enrollmentCount: 1 } });
}

export function decrementCycleEnrollment(id) {
  return RoadmapCycle.updateOne({ _id: id, enrollmentCount: { $gt: 0 } }, { $inc: { enrollmentCount: -1 } });
}

export function createEnrollment(cycleId, studentId) {
  return RoadmapEnrollment.create({ cycle: cycleId, student: studentId });
}

export function findEnrollment(cycleId, studentId) {
  return RoadmapEnrollment.findOne({ cycle: cycleId, student: studentId }).lean();
}

export function deleteEnrollment(cycleId, studentId) {
  return RoadmapEnrollment.findOneAndDelete({ cycle: cycleId, student: studentId }).lean();
}

export function findCycleEnrollments(cycleId) {
  return RoadmapEnrollment.find({ cycle: cycleId })
    .populate('student', 'name email username')
    .sort({ enrolledAt: 1 })
    .lean();
}

export function findStudentEnrollments(studentId) {
  return RoadmapEnrollment.find({ student: studentId })
    .populate({ path: 'cycle', populate: { path: 'roadmap', select: 'title slug description status' } })
    .sort({ enrolledAt: -1 })
    .lean();
}

export function findSessionsByCycleIds(cycleIds) {
  return RoadmapSession.find({ cycle: { $in: cycleIds } }).sort({ startsAt: 1 }).lean();
}

export function findSessionsForCycle(cycleId) {
  return RoadmapSession.find({ cycle: cycleId }).sort({ startsAt: 1 }).lean();
}

export function findSessionById(id) {
  return RoadmapSession.findById(id).lean();
}

export function findSessionWithToken(id, tokenHash) {
  return RoadmapSession.findOne({
    _id: id,
    checkInTokenHash: tokenHash,
    status: { $in: ['scheduled', 'rescheduled'] },
  }).select('+checkInTokenHash');
}

export function saveGeneratedSession(cycleId, session) {
  return RoadmapSession.findOneAndUpdate(
    { cycle: cycleId, ordinal: session.ordinal },
    { $setOnInsert: { cycle: cycleId, ...session } },
    { upsert: true, new: true, runValidators: true },
  );
}

export function updateSession(id, data) {
  return RoadmapSession.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
}

export function setSessionCheckInToken(id, tokenHash) {
  return RoadmapSession.updateOne(
    { _id: id, status: { $in: ['scheduled', 'rescheduled'] } },
    { $set: { checkInTokenHash: tokenHash } },
  );
}

export function countAttendanceForSessions(sessionIds) {
  return RoadmapAttendance.aggregate([
    { $match: { session: { $in: sessionIds } } },
    { $group: { _id: '$session', count: { $sum: 1 } } },
  ]);
}

export function findSessionAttendance(sessionId) {
  return RoadmapAttendance.find({ session: sessionId })
    .populate('student', 'name email username')
    .sort({ checkedInAt: -1 })
    .lean();
}

export function findStudentSessionAttendance(studentId, sessionIds) {
  return RoadmapAttendance.find({ student: studentId, session: { $in: sessionIds } }).lean();
}

export function findStudentSessionAttendanceBySession(studentId, sessionId) {
  return RoadmapAttendance.findOne({ student: studentId, session: sessionId }).lean();
}

export function createSessionAttendance(data) {
  return RoadmapAttendance.create(data);
}

export function findAttendanceById(sessionId, attendanceId) {
  return RoadmapAttendance.findOne({ _id: attendanceId, session: sessionId });
}

export function reverseAttendancePoints(attendanceId, pointsAwarded, adminId, reason) {
  return RoadmapAttendance.findOneAndUpdate(
    { _id: attendanceId, reversedAt: null },
    {
      $set: {
        pointsReversed: pointsAwarded,
        reversedAt: new Date(),
        reversedBy: adminId,
        reversalReason: reason,
      },
    },
    { new: true, runValidators: true },
  );
}

export function getRoadmapLeaderboardEntries() {
  return RoadmapAttendance.aggregate([
    {
      $group: {
        _id: '$student',
        points: { $sum: { $subtract: [{ $ifNull: ['$pointsAwarded', 0] }, { $ifNull: ['$pointsReversed', 0] }] } },
        sessionsAttended: { $sum: 1 },
      },
    },
    { $match: { points: { $gt: 0 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.role': 'user', 'user.profile.privacy.profileVisible': { $ne: false } } },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        username: '$user.username',
        points: 1,
        sessionsAttended: 1,
      },
    },
  ]);
}

export function aggregateSessionAttendanceBySession(sessionIds) {
  return RoadmapAttendance.aggregate([
    { $match: { session: { $in: sessionIds } } },
    {
      $group: {
        _id: '$session',
        attendanceCount: { $sum: 1 },
        pointsAwarded: { $sum: { $subtract: [{ $ifNull: ['$pointsAwarded', 0] }, { $ifNull: ['$pointsReversed', 0] }] } },
      },
    },
  ]);
}
