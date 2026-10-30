import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as authValidation from '../validation/auth.validation.js';
import { googleLogin, login, me, register, updateNotificationPreferences, updatePassword, updatePrivacy, updateProfile, updateStudentId, updateUsername } from '../controllers/authController.js';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const googleLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const passwordChangeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

router.post('/register', validate(authValidation.register), register);
router.post('/login', loginLimiter, validate(authValidation.login), login);
router.post('/google', googleLoginLimiter, validate(authValidation.google), googleLogin);
router.put('/password', requireAuth, passwordChangeLimiter, validate(authValidation.password), updatePassword);
router.put('/student-id', requireAuth, validate(authValidation.studentId), updateStudentId);
router.put('/username', requireAuth, validate(authValidation.username), updateUsername);
router.put('/profile', requireAuth, validate(authValidation.profile), updateProfile);
router.put('/privacy', requireAuth, validate(authValidation.privacy), updatePrivacy);
router.put('/notification-preferences', requireAuth, validate(authValidation.notificationPreferences), updateNotificationPreferences);
router.post('/username', requireAuth, validate(authValidation.username), updateUsername);
router.put('/user-name', requireAuth, validate(authValidation.username), updateUsername);
router.post('/user-name', requireAuth, validate(authValidation.username), updateUsername);
router.get('/me', requireAuth, me);

export default router;
