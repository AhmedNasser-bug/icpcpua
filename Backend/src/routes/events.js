import { Router } from 'express';
import { requireAuth, requireUsername } from '../middleware/auth.js';
import {
  cancel,
  checkInDetails,
  getById,
  leaderboard,
  list,
  memberProfile,
  myEvents,
  myLeaderboard,
  register,
  submitCheckIn,
} from '../controllers/eventsController.js';

const router = Router();

router.get('/', list);
router.get('/leaderboard', leaderboard);
router.get('/leaderboard/me', requireAuth, requireUsername, myLeaderboard);
router.get('/:username/profile', memberProfile);
router.get('/my', requireAuth, requireUsername, myEvents);
router.get('/:eventId/check-in', requireAuth, requireUsername, checkInDetails);
router.post('/:eventId/check-in', requireAuth, requireUsername, submitCheckIn);
router.post('/:eventId/registrations', requireAuth, requireUsername, register);
router.delete('/:eventId/registrations', requireAuth, requireUsername, cancel);
router.get('/:eventId', getById);

export default router;
