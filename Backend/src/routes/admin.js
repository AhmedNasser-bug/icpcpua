import { Router } from 'express';
import { requireAdmin, requireAuth, requireUsername } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as adminValidation from '../validation/admin.validation.js';
import {
  create,
  createCheckInQr,
  list,
  registrations,
  remove,
  update,
} from '../controllers/adminController.js';
import {
  attendance as roadmapAttendance,
  checkInQr as roadmapCheckInQr,
  cycleStudents,
  create as createRoadmap,
  createCycleForRoadmap,
  createRoadmapNode,
  deleteRoadmapNode,
  generateSchedule,
  list as listRoadmaps,
  roadmapNodes,
  recordAttendance,
  reversePoints,
  schedulePreview,
  sessions as roadmapSessions,
  update as updateRoadmap,
  updateRoadmapNode,
  updateCycle,
  updateSession,
} from '../controllers/adminRoadmapsController.js';

const router = Router();
router.use(requireAuth, requireUsername, requireAdmin);

router.get('/events', list);
router.post('/events', validate(adminValidation.eventCreate), create);
router.put('/events/:eventId', validate(adminValidation.eventUpdate), update);
router.delete('/events/:eventId', validate(adminValidation.eventDelete), remove);
router.post('/events/:eventId/check-in-qr', validate(adminValidation.eventAction), createCheckInQr);
router.get('/events/:eventId/registrations', validate(adminValidation.eventAction), registrations);
router.get('/roadmaps', listRoadmaps);
router.post('/roadmaps', validate(adminValidation.roadmapCreate), createRoadmap);
router.put('/roadmaps/:roadmapId', validate(adminValidation.roadmapUpdate), updateRoadmap);
router.get('/roadmaps/:roadmapId/nodes', validate(adminValidation.roadmapNodes), roadmapNodes);
router.post('/roadmaps/:roadmapId/nodes', validate(adminValidation.roadmapNodeCreate), createRoadmapNode);
router.put('/roadmaps/:roadmapId/nodes/:nodeId', validate(adminValidation.roadmapNodeUpdate), updateRoadmapNode);
router.delete('/roadmaps/:roadmapId/nodes/:nodeId', validate(adminValidation.roadmapNodeAction), deleteRoadmapNode);
router.post('/roadmaps/:roadmapId/cycles', validate(adminValidation.cycleCreate), createCycleForRoadmap);
router.put('/roadmap-cycles/:cycleId', validate(adminValidation.cycleUpdate), updateCycle);
router.get('/roadmap-cycles/:cycleId/schedule/preview', validate(adminValidation.cycleAction), schedulePreview);
router.post('/roadmap-cycles/:cycleId/schedule', validate(adminValidation.cycleSchedule), generateSchedule);
router.get('/roadmap-cycles/:cycleId/sessions', validate(adminValidation.cycleAction), roadmapSessions);
router.get('/roadmap-cycles/:cycleId/enrollments', validate(adminValidation.cycleAction), cycleStudents);
router.put('/roadmap-sessions/:sessionId', validate(adminValidation.sessionUpdate), updateSession);
router.post('/roadmap-sessions/:sessionId/check-in-qr', validate(adminValidation.sessionAction), roadmapCheckInQr);
router.get('/roadmap-sessions/:sessionId/attendance', validate(adminValidation.sessionAction), roadmapAttendance);
router.post('/roadmap-sessions/:sessionId/attendance', validate(adminValidation.attendanceCreate), recordAttendance);
router.patch('/roadmap-sessions/:sessionId/attendance/:attendanceId/reverse-points', validate(adminValidation.pointsReverse), reversePoints);

export default router;
