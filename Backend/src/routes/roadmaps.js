import { Router } from 'express';
import { optionalAuth, requireAuth, requireUsername } from '../middleware/auth.js';
import {
  cycleDetails,
  enroll,
  getBySlug,
  list,
  mine,
  sessionCheckInDetails,
  submitSessionCheckIn,
} from '../controllers/roadmapsController.js';

const router = Router();

router.get('/', list);
router.get('/my', requireAuth, requireUsername, mine);
router.get('/cycles/:cycleId', optionalAuth, cycleDetails);
router.post('/cycles/:cycleId/enroll', requireAuth, requireUsername, enroll);
router.get('/sessions/:sessionId/check-in', requireAuth, requireUsername, sessionCheckInDetails);
router.post('/sessions/:sessionId/check-in', requireAuth, requireUsername, submitSessionCheckIn);
router.get('/:slug', getBySlug);

export default router;
