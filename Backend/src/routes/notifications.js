import { Router } from 'express';
import { requireAuth, requireUsername } from '../middleware/auth.js';
import { list, markAllRead, markRead } from '../controllers/notificationController.js';

const router = Router();
router.use(requireAuth, requireUsername);
router.get('/', list);
router.post('/read-all', markAllRead);
router.patch('/:notificationId/read', markRead);

export default router;
