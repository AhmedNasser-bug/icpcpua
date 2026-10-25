import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import {
  createUser,
  findByEmailWithPassword,
  findByIdWithPassword,
  setStudentIdIfMissing,
  setUsername,
  updateNotificationPreferences,
  updateProfilePrivacy,
  updateStudentProfile,
  updatePasswordIfUnchanged,
} from '../repositories/userRepository.js';

export function issueToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' });
}

export function presentUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || null,
    studentId: user.studentId || null,
    role: user.role,
    createdAt: user.createdAt || null,
    profile: user.profile?.toObject ? user.profile.toObject() : user.profile || {},
    notificationPreferences: user.notificationPreferences?.toObject
      ? user.notificationPreferences.toObject()
      : user.notificationPreferences || {},
  };
}

export async function registerUser({ name, email, password, username, studentId }) {
  const passwordHash = await bcrypt.hash(password, 12);
  return createUser({ name, email, username, studentId, passwordHash });
}

export async function authenticateUser(email, password) {
  const user = await findByEmailWithPassword(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return user;
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await findByIdWithPassword(userId);
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return 'incorrect';
  if (await bcrypt.compare(newPassword, user.passwordHash)) return 'same';

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updated = await updatePasswordIfUnchanged(user.id, user.passwordHash, passwordHash);
  return updated ? 'updated' : 'changed';
}

export function assignStudentId(userId, studentId) {
  return setStudentIdIfMissing(userId, studentId);
}

export function assignUsername(userId, username) {
  return setUsername(userId, username);
}

export function saveStudentProfile(userId, profile) {
  return updateStudentProfile(userId, profile);
}

export function saveProfilePrivacy(userId, privacy) {
  return updateProfilePrivacy(userId, privacy);
}

export function saveNotificationPreferences(userId, preferences) {
  return updateNotificationPreferences(userId, preferences);
}
