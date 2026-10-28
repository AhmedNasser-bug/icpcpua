import { Router } from 'express';
import { requireAuth, requireUsername } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as notificationValidation from '../validation/notifications.validation.js';
import { list, markAllRead, markRead } from '../controllers/notificationController.js';

const router = Router();
router.use(requireAuth, requireUsername);
router.get('/', validate(notificationValidation.list), list);
router.post('/read-all', validate(notificationValidation.markAllRead), markAllRead);
router.patch('/:notificationId/read', validate(notificationValidation.markRead), markRead);

export default router;
