import { handleSparkRequest } from './sparkAdapter.js';
export { signInWithOAuthProvider, signOutFirebase } from './firebase.js';

export async function api(path, options = {}) {
  return handleSparkRequest(path, options);
}

export function eventDate(value, options = {}) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(new Date(value));
}
