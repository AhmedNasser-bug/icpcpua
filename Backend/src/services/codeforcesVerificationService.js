import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import {
  clearExpiredCodeforcesHandle,
  completeCodeforcesVerification,
  expireCodeforcesVerification,
  findCodeforcesHandleOwner,
  findCodeforcesVerification,
  savePendingCodeforcesVerification,
} from '../repositories/userRepository.js';

const verificationLifetimeMs = 15 * 60 * 1000;
const codeforcesApiUrl = 'https://codeforces.com/api/user.info';

function verificationError(status, message, code) {
  return Object.assign(new Error(message), { status, code });
}

export function normalizeCodeforcesHandle(handle) {
  return handle.toLowerCase();
}

export function hashVerificationToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function matchesVerificationToken(value, tokenHash) {
  if (typeof value !== 'string' || typeof tokenHash !== 'string' || !/^[a-f0-9]{64}$/.test(tokenHash)) return false;
  const actualHash = Buffer.from(hashVerificationToken(value), 'hex');
  const expectedHash = Buffer.from(tokenHash, 'hex');
  return timingSafeEqual(actualHash, expectedHash);
}

export function newVerificationToken() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 10 }, () => alphabet[randomInt(alphabet.length)]).join('');
}

export async function fetchCodeforcesUser(handle, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL(codeforcesApiUrl);
    url.searchParams.set('handles', handle);
    const response = await fetchImpl(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'PUA-ICPC-Community/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw verificationError(503, 'Codeforces is temporarily unavailable. Please try again shortly.', 'CODEFORCES_UNAVAILABLE');
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw verificationError(503, 'Codeforces returned an invalid response. Please try again shortly.', 'CODEFORCES_UNAVAILABLE');
    }
    if (data?.status === 'FAILED') {
      throw verificationError(400, 'That Codeforces handle was not found. Check it and try again.', 'CODEFORCES_HANDLE_NOT_FOUND');
    }
    if (data?.status !== 'OK' || !Array.isArray(data.result) || !data.result[0] || typeof data.result[0] !== 'object') {
      throw verificationError(503, 'Codeforces returned an unexpected response. Please try again shortly.', 'CODEFORCES_UNAVAILABLE');
    }
    if (
      typeof data.result[0].handle !== 'string'
      || normalizeCodeforcesHandle(data.result[0].handle) !== normalizeCodeforcesHandle(handle)
    ) {
      throw verificationError(503, 'Codeforces returned a different account than requested. Please try again.', 'CODEFORCES_UNAVAILABLE');
    }
    return data.result[0];
  } catch (error) {
    if (error.status) throw error;
    throw verificationError(503, 'Could not reach Codeforces. Please try again shortly.', 'CODEFORCES_UNAVAILABLE');
  } finally {
    clearTimeout(timeout);
  }
}

function presentVerification(verification, statusOverride) {
  const status = statusOverride || verification?.status || 'unverified';
  return {
    status,
    ...(verification?.handle ? { handle: verification.handle } : {}),
    ...(verification?.verifiedAt ? { verifiedAt: verification.verifiedAt } : {}),
    ...(status === 'pending' && verification?.expiresAt ? { expiresAt: verification.expiresAt } : {}),
  };
}

export async function getCodeforcesVerificationStatus(userId, now = new Date()) {
  const user = await findCodeforcesVerification(userId);
  const verification = user?.profile?.codeforcesVerification;
  if (verification?.status === 'pending' && (!verification.expiresAt || verification.expiresAt <= now)) {
    await expireCodeforcesVerification(userId, now);
    return presentVerification(null, 'expired');
  }
  return presentVerification(verification);
}

export async function generateCodeforcesVerification(userId, handle, now = new Date(), fetchImpl = fetch) {
  await fetchCodeforcesUser(handle, fetchImpl);
  const normalizedHandle = normalizeCodeforcesHandle(handle);
  await clearExpiredCodeforcesHandle(normalizedHandle, now);
  if (await findCodeforcesHandleOwner(normalizedHandle, userId)) {
    throw verificationError(409, 'This Codeforces account is already linked to another student.', 'CODEFORCES_HANDLE_IN_USE');
  }

  const token = newVerificationToken();
  const expiresAt = new Date(now.getTime() + verificationLifetimeMs);
  try {
    const updatedUser = await savePendingCodeforcesVerification(userId, {
      handle,
      normalizedHandle,
      tokenHash: hashVerificationToken(token),
      expiresAt,
    });
    if (!updatedUser) throw verificationError(404, 'Your account could not be found.', 'ACCOUNT_NOT_FOUND');
    return {
      verification: presentVerification(updatedUser.profile?.codeforcesVerification),
      token,
    };
  } catch (error) {
    if (error.code === 11000) {
      throw verificationError(409, 'This Codeforces account is already linked to another student.', 'CODEFORCES_HANDLE_IN_USE');
    }
    throw error;
  }
}

export async function checkCodeforcesVerification(userId, now = new Date(), fetchImpl = fetch) {
  const user = await findCodeforcesVerification(userId);
  const verification = user?.profile?.codeforcesVerification;
  if (!verification || verification.status !== 'pending' || !verification.handle) {
    if (verification?.status === 'verified') return { verification: presentVerification(verification) };
    return { verification: presentVerification(null) };
  }
  if (!verification.expiresAt || verification.expiresAt <= now) {
    await expireCodeforcesVerification(userId, now);
    return { verification: presentVerification(null, 'expired') };
  }

  const startedAt = Date.now();
  const codeforcesUser = await fetchCodeforcesUser(verification.handle, fetchImpl);
  const verificationNow = new Date(now.getTime() + Date.now() - startedAt);
  if (verification.expiresAt <= verificationNow) {
    await expireCodeforcesVerification(userId, verificationNow);
    return { verification: presentVerification(null, 'expired') };
  }
  if (!matchesVerificationToken(codeforcesUser.firstName, verification.tokenHash)) {
    const latestUser = await findCodeforcesVerification(userId);
    const latest = latestUser?.profile?.codeforcesVerification;
    if (latest?.status !== 'pending' || latest.normalizedHandle !== verification.normalizedHandle || latest.tokenHash !== verification.tokenHash) {
      return { verification: presentVerification(latest) };
    }
    return {
      verification: presentVerification(latest),
      message: 'The token is not in the Codeforces First Name English field yet. Save it there, then check again.',
    };
  }

  const updatedUser = await completeCodeforcesVerification(
    userId,
    verification.normalizedHandle,
    verification.tokenHash,
    verificationNow,
  );
  if (updatedUser) return { verification: presentVerification(updatedUser.profile?.codeforcesVerification) };

  const latestUser = await findCodeforcesVerification(userId);
  const latest = latestUser?.profile?.codeforcesVerification;
  if (latest?.status === 'pending' && (!latest.expiresAt || latest.expiresAt <= verificationNow)) {
    await expireCodeforcesVerification(userId, verificationNow);
    return { verification: presentVerification(null, 'expired') };
  }
  return { verification: presentVerification(latest) };
}
