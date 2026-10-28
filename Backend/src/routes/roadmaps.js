import { Router } from 'express';
import { requireAuth, requireUsername } from '../middleware/auth.js';
import {
  cycleDetails,
  enroll,
  allRoadmapCycles,
  getBySlug,
  list,
  mine,
  roadmapProgress,
  roadmapCycles,
  sessionCheckInDetails,
  submitSessionCheckIn,
  updateRoadmapProgress,
} from '../controllers/roadmapsController.js';

const router = Router();

router.get('/', list);
router.get('/my', requireAuth, requireUsername, mine);
router.get('/cycles', requireAuth, requireUsername, allRoadmapCycles);
router.get('/:roadmapSlug/progress', requireAuth, requireUsername, roadmapProgress);
router.put('/:roadmapSlug/progress', requireAuth, requireUsername, updateRoadmapProgress);
router.get('/:roadmapSlug/cycles', requireAuth, requireUsername, roadmapCycles);
router.post('/:roadmapSlug/cycles/:cycleId/enroll', requireAuth, requireUsername, enroll);
router.get('/:roadmapSlug/cycles/:cycleId', requireAuth, requireUsername, cycleDetails);
router.get('/sessions/:sessionId/check-in', requireAuth, requireUsername, sessionCheckInDetails);
router.post('/sessions/:sessionId/check-in', requireAuth, requireUsername, submitSessionCheckIn);
router.get('/:slug', getBySlug);

export default router;
