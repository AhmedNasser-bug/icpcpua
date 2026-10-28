import {
  assignStudentId,
  assignUsername,
  authenticateUser,
  changePassword,
  issueToken,
  presentUser,
  registerUser,
  saveNotificationPreferences,
  saveProfilePrivacy,
  saveStudentProfile,
} from '../services/authService.js';
import { validateNotificationPreferencesInput, validatePasswordChangeInput, validateProfilePrivacyInput, validateStudentId, validateStudentProfileInput, validateUsername } from '../utils/validation.js';

function bodyInput(req) {
  return req.validated?.body ?? req.body;
}

export async function register(req, res) {
  const body = bodyInput(req);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: { message: 'Provide account details as a JSON object.' } });
  }
  const { name, email, password } = body;
  const incomingUsername = Object.prototype.hasOwnProperty.call(body, 'username') ? body.username : body.userName;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
    return res.status(400).json({ error: { message: 'Enter a name of 1–80 characters.' } });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: { message: 'Enter a valid email address.' } });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: { message: 'Password must be at least 8 characters.' } });
  }

  let username;
  try {
    username = validateUsername(incomingUsername);
  } catch (error) {
    return res.status(error.status || 400).json({ error: { message: error.message } });
  }

  let studentId;
  try {
    studentId = validateStudentId(body.studentId);
  } catch (error) {
    return res.status(error.status || 400).json({ error: { message: error.message } });
  }

  try {
    const user = await registerUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      username,
      studentId,
    });
    return res.status(201).json({ token: issueToken(user), user: presentUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      const message = error.keyPattern?.username
        ? 'This username is already taken.'
        : error.keyPattern?.studentId
          ? 'An account with this student ID already exists.'
          : 'An account with this email already exists.';
      return res.status(409).json({ error: { message } });
    }
    throw error;
  }
}

export async function login(req, res) {
  const input = bodyInput(req);
  const body = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const user = await authenticateUser(email, password);
  if (!user) return res.status(401).json({ error: { message: 'Email or password is incorrect.' } });
  return res.json({ token: issueToken(user), user: presentUser(user) });
}

export async function updatePassword(req, res) {
  const { currentPassword, newPassword } = validatePasswordChangeInput(bodyInput(req));
  const result = await changePassword(req.user.id, currentPassword, newPassword);
  if (result === 'incorrect') {
    return res.status(401).json({ error: { message: 'Your current password is incorrect.' } });
  }
  if (result === 'same') {
    return res.status(400).json({ error: { message: 'Choose a new password different from your current password.' } });
  }
  if (result === 'changed') {
    return res.status(409).json({ error: { message: 'Your password changed before this request completed. Sign in again and retry.' } });
  }
  return res.json({ message: 'Your password has been updated.' });
}

export async function updateStudentId(req, res) {
  const body = bodyInput(req);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => key !== 'studentId')) {
    return res.status(400).json({ error: { message: 'Provide only a student ID.' } });
  }

  let studentId;
  try {
    studentId = validateStudentId(body.studentId);
  } catch (error) {
    return res.status(error.status || 400).json({ error: { message: error.message } });
  }

  try {
    const user = await assignStudentId(req.user.id, studentId);
    if (!user) return res.status(409).json({ error: { message: 'A student ID is already set for this account.' } });
    return res.json({ user: presentUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: { message: 'An account with this student ID already exists.' } });
    }
    throw error;
  }
}

export async function updateUsername(req, res) {
  const body = bodyInput(req);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: { message: 'Provide a username object.' } });
  }

  const allowedKeys = new Set(['username', 'userName']);
  const unexpected = Object.keys(body).find((key) => !allowedKeys.has(key));
  if (unexpected) {
    return res.status(400).json({ error: { message: 'Provide only a username.' } });
  }

  const incomingUsername = Object.prototype.hasOwnProperty.call(body, 'username') ? body.username : body.userName;

  let username;
  try {
    username = validateUsername(incomingUsername);
  } catch (error) {
    return res.status(error.status || 400).json({ error: { message: error.message } });
  }

  try {
    const user = await assignUsername(req.user.id, username);
    if (!user) return res.status(409).json({ error: { message: 'Your username could not be updated.' } });
    return res.json({ user: presentUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: { message: 'This username is already taken.' } });
    }
    throw error;
  }
}

export async function updateProfile(req, res) {
  let profile;
  try {
    profile = validateStudentProfileInput(bodyInput(req));
  } catch (error) {
    return res.status(error.status || 400).json({ error: { message: error.message, field: error.field } });
  }
  const user = await saveStudentProfile(req.user.id, profile);
  if (!user) return res.status(404).json({ error: { message: 'Your account could not be found.' } });
  return res.json({ user: presentUser(user) });
}

export async function updatePrivacy(req, res) {
  let privacy;
  try {
    privacy = validateProfilePrivacyInput(bodyInput(req));
  } catch (error) {
    return res.status(error.status || 400).json({ error: { message: error.message, field: error.field } });
  }
  const user = await saveProfilePrivacy(req.user.id, privacy);
  if (!user) return res.status(404).json({ error: { message: 'Your account could not be found.' } });
  return res.json({ user: presentUser(user) });
}

export async function updateNotificationPreferences(req, res) {
  let preferences;
  try {
    preferences = validateNotificationPreferencesInput(bodyInput(req));
  } catch (error) {
    return res.status(error.status || 400).json({ error: { message: error.message } });
  }
  const user = await saveNotificationPreferences(req.user.id, preferences);
  if (!user) return res.status(404).json({ error: { message: 'Your account could not be found.' } });
  return res.json({ user: presentUser(user) });
}

export function me(req, res) {
  return res.json({ user: presentUser(req.user) });
}
