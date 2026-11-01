import { Router } from 'express';
import { requireAuth, requireCodeforcesVerification, requireStudent, requireUsername } from '../middleware/auth.js';
import { studentDashboard } from '../controllers/studentDashboardController.js';

const router = Router();

router.get('/', requireAuth, requireUsername, requireStudent, requireCodeforcesVerification, studentDashboard);

export default router;
