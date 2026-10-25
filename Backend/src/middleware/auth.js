import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';

export async function requireAuth(req, res, next) {
  const authorization = req.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Sign in to continue.' } });
  }

  try {
    const payload = jwt.verify(authorization.slice(7), config.jwtSecret);
    const user = await User.findById(payload.sub).select('name email role username studentId profile createdAt notificationPreferences');
    if (!user) return res.status(401).json({ error: { message: 'Your session is no longer valid.' } });
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { message: 'Your session is invalid or expired.' } });
    }
    return next(error);
  }
}

export function optionalAuth(req, res, next) {
  if (!req.get('authorization')) return next();
  return requireAuth(req, res, next);
}

export function requireUsername(req, res, next) {
  if (!req.user?.username) {
    return res.status(403).json({ error: { message: 'Choose a username to continue.' } });
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: { message: 'Administrator access is required.' } });
  }
  return next();
}
