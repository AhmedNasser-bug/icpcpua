import { Router } from 'express';
import { requireAuth, requireUsername } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as roadmapValidation from '../validation/roadmaps.validation.js';
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
router.get('/:roadmapSlug/progress', requireAuth, requireUsername, validate(roadmapValidation.progressRead), roadmapProgress);
router.put('/:roadmapSlug/progress', requireAuth, requireUsername, validate(roadmapValidation.progressUpdate), updateRoadmapProgress);
router.get('/:roadmapSlug/cycles', requireAuth, requireUsername, validate(roadmapValidation.roadmapSlug), roadmapCycles);
router.post('/:roadmapSlug/cycles/:cycleId/enroll', requireAuth, requireUsername, validate(roadmapValidation.emptyAction), enroll);
router.get('/:roadmapSlug/cycles/:cycleId', requireAuth, requireUsername, validate(roadmapValidation.cycle), cycleDetails);
router.get('/sessions/:sessionId/check-in', requireAuth, requireUsername, validate(roadmapValidation.sessionCheckInDetails), sessionCheckInDetails);
router.post('/sessions/:sessionId/check-in', requireAuth, requireUsername, validate(roadmapValidation.sessionCheckInSubmit), submitSessionCheckIn);
router.get('/:slug', validate(roadmapValidation.roadmapBySlug), getBySlug);

export default router;
