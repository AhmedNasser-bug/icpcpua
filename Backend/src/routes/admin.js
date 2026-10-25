import { Router } from 'express';
import { requireAdmin, requireAuth, requireUsername } from '../middleware/auth.js';
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
  generateSchedule,
  list as listRoadmaps,
  recordAttendance,
  reversePoints,
  schedulePreview,
  sessions as roadmapSessions,
  update as updateRoadmap,
  updateCycle,
  updateSession,
} from '../controllers/adminRoadmapsController.js';

const router = Router();
router.use(requireAuth, requireUsername, requireAdmin);

router.get('/events', list);
router.post('/events', create);
router.put('/events/:eventId', update);
router.delete('/events/:eventId', remove);
router.post('/events/:eventId/check-in-qr', createCheckInQr);
router.get('/events/:eventId/registrations', registrations);
router.get('/roadmaps', listRoadmaps);
router.post('/roadmaps', createRoadmap);
router.put('/roadmaps/:roadmapId', updateRoadmap);
router.post('/roadmaps/:roadmapId/cycles', createCycleForRoadmap);
router.put('/roadmap-cycles/:cycleId', updateCycle);
router.get('/roadmap-cycles/:cycleId/schedule/preview', schedulePreview);
router.post('/roadmap-cycles/:cycleId/schedule', generateSchedule);
router.get('/roadmap-cycles/:cycleId/sessions', roadmapSessions);
router.get('/roadmap-cycles/:cycleId/enrollments', cycleStudents);
router.put('/roadmap-sessions/:sessionId', updateSession);
router.post('/roadmap-sessions/:sessionId/check-in-qr', roadmapCheckInQr);
router.get('/roadmap-sessions/:sessionId/attendance', roadmapAttendance);
router.post('/roadmap-sessions/:sessionId/attendance', recordAttendance);
router.patch('/roadmap-sessions/:sessionId/attendance/:attendanceId/reverse-points', reversePoints);

export default router;
