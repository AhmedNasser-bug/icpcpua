export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}
export function isValidUsername(value) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}
