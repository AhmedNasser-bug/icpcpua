import {
  validateNotificationPreferencesInput,
  validatePasswordChangeInput,
  validateProfilePrivacyInput,
  validateStudentId,
  validateStudentProfileInput,
  validateUsername,
} from '../utils/validation.js';
import { bodyObject, invalid, optionalString } from './shared.js';

function registerBody(value) {
  const input = bodyObject(['name', 'email', 'password', 'username', 'userName', 'studentId'], 'account details')(value);
  const name = optionalString(input.name, 'name', { maxLength: 80, required: true });
  if (typeof input.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) invalid('Enter a valid email address.', 'email');
  if (typeof input.password !== 'string' || input.password.length < 8) invalid('Password must be at least 8 characters.', 'password');
  const username = validateUsername(Object.prototype.hasOwnProperty.call(input, 'username') ? input.username : input.userName);
  const studentId = validateStudentId(input.studentId);
  return { ...input, name, email: input.email.toLowerCase().trim(), username, studentId };
}

function loginBody(value) {
  const input = bodyObject(['email', 'password'], 'login details')(value);
  if (typeof input.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) invalid('Enter a valid email address.', 'email');
  if (typeof input.password !== 'string' || !input.password) invalid('Password is required.', 'password');
  return { email: input.email.toLowerCase().trim(), password: input.password };
}

function studentIdBody(value) {
  const input = bodyObject(['studentId'], 'student ID')(value);
  return { studentId: validateStudentId(input.studentId) };
}

function usernameBody(value) {
  const input = bodyObject(['username', 'userName'], 'username')(value);
  const username = Object.prototype.hasOwnProperty.call(input, 'username') ? input.username : input.userName;
  return { username: validateUsername(username) };
}

export const register = { body: registerBody };
export const login = { body: loginBody };
export const password = { body: validatePasswordChangeInput };
export const studentId = { body: studentIdBody };
export const username = { body: usernameBody };
export const profile = { body: validateStudentProfileInput };
export const privacy = { body: validateProfilePrivacyInput };
export const notificationPreferences = { body: validateNotificationPreferencesInput };
