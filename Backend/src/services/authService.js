import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env.js';
import {
  createUser,
  findByEmail,
  findByEmailWithPassword,
  findByIdWithPassword,
  findByGoogleId,
  linkGoogleIdentity,
  setGooglePictureIfMissing,
  setStudentIdIfMissing,
  setUsername,
  updateNotificationPreferences,
  updateProfilePrivacy,
  updateStudentProfile,
  updatePasswordIfUnchanged,
} from '../repositories/userRepository.js';

const googleClient = new OAuth2Client();

export function issueToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' });
}

export function presentUser(user) {
  const profile = user.profile?.toObject ? user.profile.toObject() : user.profile || {};
  const codeforcesVerification = profile.codeforcesVerification;
  if (codeforcesVerification) {
    profile.codeforcesVerification = {
      status: codeforcesVerification.status || 'unverified',
      ...(codeforcesVerification.handle ? { handle: codeforcesVerification.handle } : {}),
      ...(codeforcesVerification.verifiedAt ? { verifiedAt: codeforcesVerification.verifiedAt } : {}),
      ...(codeforcesVerification.status === 'pending' && codeforcesVerification.expiresAt
        ? { expiresAt: codeforcesVerification.expiresAt }
        : {}),
    };
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username || null,
    studentId: user.studentId || null,
    role: user.role,
    createdAt: user.createdAt || null,
    profile,
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
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return user;
}

function googleAuthError(status, message) {
  return Object.assign(new Error(message), { status });
}

function googlePictureUrl(value) {
  if (typeof value !== 'string' || value.length > 500) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

async function addGooglePictureIfMissing(user, pictureUrl) {
  if (!pictureUrl || user.profile?.pictureUrl) return user;
  return (await setGooglePictureIfMissing(user.id, pictureUrl)) || user;
}

async function findOrCreateGoogleUser({ googleId, email, name, pictureUrl }) {
  let user = await findByGoogleId(googleId);
  if (user) return addGooglePictureIfMissing(user, pictureUrl);

  user = await linkGoogleIdentity(email, googleId);
  if (user) return addGooglePictureIfMissing(user, pictureUrl);

  const existingEmailUser = await findByEmail(email);
  if (existingEmailUser) {
    throw googleAuthError(409, 'This email is already linked to another Google account.');
  }

  try {
    return await createUser({
      name,
      email,
      googleId,
      role: 'user',
      ...(pictureUrl ? { profile: { pictureUrl } } : {}),
    });
  } catch (error) {
    if (error.code !== 11000) throw error;

    user = await findByGoogleId(googleId);
    if (user) return addGooglePictureIfMissing(user, pictureUrl);

    user = await linkGoogleIdentity(email, googleId);
    if (user) return addGooglePictureIfMissing(user, pictureUrl);

    if (await findByEmail(email)) {
      throw googleAuthError(409, 'This email is already linked to another Google account.');
    }
    throw error;
  }
}

export async function authenticateWithGoogle(idToken) {
  if (!config.googleClientId) {
    throw googleAuthError(503, 'Google sign-in is not configured.');
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    if (error.code || error.response?.status >= 500) {
      throw googleAuthError(503, 'Google sign-in is temporarily unavailable.');
    }
    throw googleAuthError(401, 'The Google sign-in token is invalid or expired.');
  }

  if (
    typeof payload?.sub !== 'string'
    || !payload.sub
    || payload.sub.length > 255
    || typeof payload.email !== 'string'
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    || typeof payload.name !== 'string'
    || !payload.name.trim()
  ) {
    throw googleAuthError(401, 'The Google account profile is incomplete.');
  }
  if (payload.email_verified !== true) {
    throw googleAuthError(403, 'Verify your Google email address before signing in.');
  }

  return findOrCreateGoogleUser({
    googleId: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name.trim().slice(0, 80),
    pictureUrl: googlePictureUrl(payload.picture),
  });
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await findByIdWithPassword(userId);
  if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) return 'incorrect';
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
