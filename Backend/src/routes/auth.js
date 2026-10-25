import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { login, me, register, updateNotificationPreferences, updatePassword, updatePrivacy, updateProfile, updateStudentId, updateUsername } from '../controllers/authController.js';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const passwordChangeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.put('/password', requireAuth, passwordChangeLimiter, updatePassword);
router.put('/student-id', requireAuth, updateStudentId);
router.put('/username', requireAuth, updateUsername);
router.put('/profile', requireAuth, updateProfile);
router.put('/privacy', requireAuth, updatePrivacy);
router.put('/notification-preferences', requireAuth, updateNotificationPreferences);
router.post('/username', requireAuth, updateUsername);
router.put('/user-name', requireAuth, updateUsername);
router.post('/user-name', requireAuth, updateUsername);
router.get('/me', requireAuth, me);

export default router;
