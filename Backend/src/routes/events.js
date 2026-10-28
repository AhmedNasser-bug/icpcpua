import { Router } from 'express';
import { requireAuth, requireUsername } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as eventValidation from '../validation/events.validation.js';
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

router.get('/', validate(eventValidation.list), list);
router.get('/leaderboard', leaderboard);
router.get('/leaderboard/me', requireAuth, requireUsername, myLeaderboard);
router.get('/:username/profile', validate(eventValidation.memberProfile), memberProfile);
router.get('/my', requireAuth, requireUsername, myEvents);
router.get('/:eventId/check-in', requireAuth, requireUsername, validate(eventValidation.checkInDetails), checkInDetails);
router.post('/:eventId/check-in', requireAuth, requireUsername, validate(eventValidation.checkInSubmit), submitCheckIn);
router.post('/:eventId/registrations', requireAuth, requireUsername, validate(eventValidation.eventAction), register);
router.delete('/:eventId/registrations', requireAuth, requireUsername, validate(eventValidation.eventAction), cancel);
router.get('/:eventId', validate(eventValidation.eventDetails), getById);

export default router;
