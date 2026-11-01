import QRCode from 'qrcode';
import seedFixture from '../data/seedFixture.json' with { type: 'json' };
import { ADMIN_EMAILS, getFirebaseClients } from './firebase.js';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

const STORAGE_KEY = 'icpc_pua_spark_db_v1';

function createError(message, status = 400, extra = {}) {
  const error = new Error(message);
  error.status = status;
  Object.assign(error, extra);
  return error;
}

function randomHex(bytes = 12) {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i += 1) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input) {
  const text = String(input || '');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(64, '0');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildInitialState() {
  return {
    users: [
      {
        id: 'usr_demo_student',
        _id: 'usr_demo_student',
        name: 'Demo Student',
        email: 'demo@pua.edu.eg',
        username: 'demo_student',
        studentId: '20240101',
        passwordHash: 'a109e36947ad56de1dca1cc49f0ef8ac9ad9a7b1aa0df41fb3c4cb73c1ff01ea',
        role: 'user',
        profile: {
          links: { codeforcesHandle: 'demo_cf', codeforcesUrl: 'https://codeforces.com/profile/demo_cf', otherProfiles: [] },
          codeforcesVerification: { status: 'unverified', handle: 'demo_cf', selfReported: true },
        },
        notificationPreferences: { contestAnnouncements: true, icpcEvents: true },
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    sessionsByToken: {},
    events: clone(seedFixture.events || []),
    registrations: [],
    roadmaps: clone(seedFixture.roadmaps || []),
    roadmapNodes: clone(seedFixture.roadmapNodes || []),
    roadmapCycles: clone(seedFixture.roadmapCycles || []),
    roadmapSessions: clone(seedFixture.roadmapSessions || []),
    roadmapEnrollments: [],
    roadmapAttendance: [],
    roadmapProgress: [],
    notifications: [],
  };
}

let memoryState = null;
let firestoreSynced = false;

function loadState() {
  if (memoryState) return memoryState;
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const defaults = buildInitialState();
        memoryState = {
          ...defaults,
          ...parsed,
          roadmaps: parsed.roadmaps?.length ? parsed.roadmaps : defaults.roadmaps,
          roadmapNodes: parsed.roadmapNodes?.length ? parsed.roadmapNodes : defaults.roadmapNodes,
          roadmapCycles: parsed.roadmapCycles?.length ? parsed.roadmapCycles : defaults.roadmapCycles,
          roadmapSessions: parsed.roadmapSessions?.length ? parsed.roadmapSessions : defaults.roadmapSessions,
          events: parsed.events?.length ? parsed.events : defaults.events,
        };
        return memoryState;
      }
    } catch {
      // Ignore corrupt localStorage
    }
  }
  memoryState = buildInitialState();
  saveState(memoryState);
  return memoryState;
}

function saveState(state) {
  memoryState = state;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota fallback
    }
  }
}

export function resetSparkStoreForTests() {
  memoryState = buildInitialState();
  saveState(memoryState);
}

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
let firestoreCircuitBroken = env.VITE_FIRESTORE_ENABLED !== 'true';

async function syncDocToFirestore(collectionName, docId, data) {
  if (firestoreCircuitBroken) return;
  try {
    const { db } = getFirebaseClients();
    await setDoc(doc(db, collectionName, String(docId)), clone(data), { merge: true });
  } catch {
    firestoreCircuitBroken = true;
  }
}

async function deleteDocFromFirestore(collectionName, docId) {
  if (firestoreCircuitBroken) return;
  try {
    const { db } = getFirebaseClients();
    await deleteDoc(doc(db, collectionName, String(docId)));
  } catch {
    firestoreCircuitBroken = true;
  }
}

async function hydrateFromFirestoreOnce() {
  if (firestoreSynced || firestoreCircuitBroken) return;
  firestoreSynced = true;
  try {
    const { db } = getFirebaseClients();
    const state = loadState();
    const collectionsToSync = ['roadmaps', 'roadmapNodes', 'roadmapCycles', 'roadmapSessions', 'events', 'users', 'registrations'];
    await Promise.all(
      collectionsToSync.map(async (colName) => {
        try {
          const snap = await getDocs(collection(db, colName));
          if (!snap.empty) {
            const remoteDocs = snap.docs.map((d) => ({ id: d.id, _id: d.id, ...d.data() }));
            const byId = new Map(state[colName].map((item) => [String(item._id || item.id), item]));
            for (const r of remoteDocs) {
              byId.set(String(r._id || r.id), r);
            }
            state[colName] = Array.from(byId.values());
          }
        } catch {
          firestoreCircuitBroken = true;
        }
      }),
    );
    saveState(state);
  } catch {
    firestoreCircuitBroken = true;
  }
}

function presentUser(user, { includePrivate = true } = {}) {
  if (!user) return null;
  const cfHandle = user.profile?.links?.codeforcesHandle || user.profile?.codeforcesVerification?.handle || '';
  const cfVerification = user.profile?.codeforcesVerification || {
    status: cfHandle ? 'unverified' : 'unverified',
    handle: cfHandle,
    normalizedHandle: cfHandle ? cfHandle.toLowerCase() : '',
    selfReported: Boolean(cfHandle),
    verifiedAt: null,
  };
  const out = {
    id: String(user._id || user.id),
    _id: String(user._id || user.id),
    name: user.name,
    username: user.username || null,
    role: user.role || 'user',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: {
      bio: '',
      pictureUrl: '',
      ...(user.profile || {}),
      links: {
        githubUrl: '',
        linkedinUrl: '',
        codeforcesHandle: cfHandle,
        codeforcesUrl: cfHandle ? `https://codeforces.com/profile/${encodeURIComponent(cfHandle)}` : '',
        otherProfiles: [],
        ...(user.profile?.links || {}),
      },
      privacy: {
        profileVisibility: 'public',
        showBio: true,
        showLinks: true,
        showCpStats: true,
        showIcpcJourney: true,
        showTeamStatus: true,
        showTrainingProgress: true,
        showAttendanceHistory: true,
        ...(user.profile?.privacy || {}),
      },
      codeforcesVerification: cfVerification,
    },
    notificationPreferences: {
      contestAnnouncements: true,
      icpcEvents: true,
      ...(user.notificationPreferences || {}),
    },
  };
  if (includePrivate) {
    out.email = user.email;
    out.studentId = user.studentId || null;
  }
  return out;
}

function getCurrentUser(state, token) {
  if (!token) throw createError('Authentication required.', 401);
  const userId = state.sessionsByToken[token] || token;
  const user = state.users.find((u) => String(u._id || u.id) === String(userId));
  if (!user) throw createError('Your session has expired. Please sign in again.', 401);
  return user;
}

function requireAdmin(user) {
  if (!user || user.role !== 'admin') {
    throw createError('Administrator access is required.', 403);
  }
}

function issueSessionToken(state, user) {
  const token = `spark_${user.id}_${randomHex(16)}`;
  state.sessionsByToken[token] = String(user.id);
  saveState(state);
  return token;
}

function computeCheckInWindow(item, now = new Date()) {
  const startsAt = new Date(item.startsAt);
  const endsAt = new Date(item.endsAt);
  const opensAt = item.checkInOpensAt ? new Date(item.checkInOpensAt) : startsAt;
  const closesAt = item.checkInClosesAt ? new Date(item.checkInClosesAt) : endsAt;
  const nowMs = now.getTime();
  return {
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
    isOpen: nowMs >= opensAt.getTime() && nowMs <= closesAt.getTime(),
  };
}

function computeLeaderboard(state) {
  const statsByUser = new Map();
  const ensure = (u) => {
    const uid = String(u.id || u._id);
    if (!statsByUser.has(uid)) {
      statsByUser.set(uid, {
        userId: uid,
        name: u.name,
        username: u.username || null,
        points: 0,
        eventsAttended: 0,
        problemsSolved: 0,
      });
    }
    return statsByUser.get(uid);
  };

  for (const reg of state.registrations) {
    if (reg.checkedInAt && reg.pointsAwarded > 0) {
      const u = state.users.find((item) => String(item.id) === String(reg.user));
      if (u && u.role !== 'admin') {
        const entry = ensure(u);
        entry.points += Number(reg.pointsAwarded) || 0;
        entry.eventsAttended += 1;
      }
    }
  }

  for (const att of state.roadmapAttendance) {
    const net = (Number(att.pointsAwarded) || 0) - (Number(att.pointsReversed) || 0);
    if (att.checkedInAt && net > 0 && !att.reversedAt) {
      const u = state.users.find((item) => String(item.id) === String(att.student));
      if (u && u.role !== 'admin') {
        const entry = ensure(u);
        entry.points += net;
        entry.eventsAttended += 1;
      }
    }
  }

  for (const prog of state.roadmapProgress) {
    const solvedCount = Array.isArray(prog.solvedProblems) ? prog.solvedProblems.length : 0;
    if (solvedCount > 0) {
      const u = state.users.find((item) => String(item.id) === String(prog.student));
      if (u && u.role !== 'admin' && statsByUser.has(String(u.id))) {
        statsByUser.get(String(u.id)).problemsSolved += solvedCount;
      }
    }
  }

  const entries = Array.from(statsByUser.values()).filter((e) => e.points > 0 || e.eventsAttended > 0);
  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.eventsAttended !== a.eventsAttended) return b.eventsAttended - a.eventsAttended;
    const nameCmp = String(a.name).localeCompare(String(b.name));
    if (nameCmp !== 0) return nameCmp;
    return String(a.userId).localeCompare(String(b.userId));
  });

  let currentRank = 0;
  let lastPoints = null;
  return entries.map((entry) => {
    if (entry.points !== lastPoints) {
      currentRank += 1;
      lastPoints = entry.points;
    }
    return { ...entry, rank: currentRank };
  });
}

function generateScheduleSessions(cycle) {
  const start = new Date(`${cycle.startDate}T00:00:00Z`);
  const end = new Date(`${cycle.endDate}T23:59:59Z`);
  const days = new Set((cycle.trainingDays || [1, 3]).map(Number));
  const [hh, mm] = String(cycle.startTime || '16:30').split(':').map(Number);
  const durationMs = (Number(cycle.sessionDurationMinutes) || 120) * 60 * 1000;
  const sessions = [];
  let ordinal = 1;
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    if (days.has(d.getUTCDay())) {
      const startsAt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hh - 2, mm || 0));
      const endsAt = new Date(startsAt.getTime() + durationMs);
      sessions.push({
        ordinal,
        title: `Session ${ordinal}`,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        sessionDurationMinutes: Number(cycle.sessionDurationMinutes) || 120,
        timeZone: cycle.timeZone || 'Africa/Cairo',
        attendancePoints: Number(cycle.attendancePoints) || 15,
        status: 'scheduled',
      });
      ordinal += 1;
    }
  }
  return sessions;
}

export async function handleSparkRequest(rawPath, options = {}) {
  await hydrateFromFirestoreOnce();
  const state = loadState();
  const method = String(options.method || 'GET').toUpperCase();
  const token = options.token || null;
  const body = options.body
    ? typeof options.body === 'string'
      ? JSON.parse(options.body)
      : options.body
    : {};

  const url = new URL(rawPath.startsWith('http') ? rawPath : `http://spark.local${rawPath.startsWith('/') ? '' : '/'}${rawPath}`);
  const pathname = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/';
  const query = Object.fromEntries(url.searchParams.entries());

  // 1. Health check
  if (pathname === '/health' && method === 'GET') {
    return { status: 'ok', backend: 'firebase-spark', projectId: 'icpc-pua' };
  }

  // 2. Auth: OAuth (Google / GitHub)
  if ((pathname === '/auth/google' || pathname === '/auth/github' || pathname === '/auth/oauth') && method === 'POST') {
    const email = String(body.email || (body.idToken ? `user_${body.idToken.slice(0, 8)}@pua.edu.eg` : '')).toLowerCase().trim();
    if (!email) throw createError('OAuth sign-in did not provide a valid email address.', 400);
    let user = state.users.find((u) => u.email === email);
    const now = new Date().toISOString();
    if (!user) {
      const id = body.uid || `usr_${randomHex(8)}`;
      const isAdminEmail = ADMIN_EMAILS.has(email);
      user = {
        id,
        _id: id,
        name: String(body.name || email.split('@')[0]).slice(0, 80),
        email,
        username: null,
        studentId: null,
        provider: body.provider || (pathname.includes('github') ? 'github' : 'google'),
        role: isAdminEmail ? 'admin' : 'user',
        profile: {
          pictureUrl: body.pictureUrl || '',
          links: { codeforcesHandle: '', codeforcesUrl: '', otherProfiles: [] },
          codeforcesVerification: { status: 'unverified', handle: '', selfReported: false },
        },
        notificationPreferences: { contestAnnouncements: true, icpcEvents: true },
        createdAt: now,
        updatedAt: now,
      };
      state.users.push(user);
      saveState(state);
      await syncDocToFirestore('users', user.id, presentUser(user, { includePrivate: false }));
      await syncDocToFirestore('userSecrets', user.id, { email: user.email, studentId: user.studentId });
    } else if (ADMIN_EMAILS.has(email) && user.role !== 'admin') {
      user.role = 'admin';
      saveState(state);
    }
    const sessionToken = issueSessionToken(state, user);
    return { token: sessionToken, user: presentUser(user) };
  }

  // 3. Auth: Register
  if (pathname === '/auth/register' && method === 'POST') {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').toLowerCase().trim();
    const username = String(body.username || body.userName || '').toLowerCase().trim();
    const studentId = body.studentId ? String(body.studentId).trim() : null;
    const password = String(body.password || '');

    if (!name || name.length > 80) throw createError('Enter a name of 1–80 characters.', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError('Enter a valid email address.', 400);
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      throw createError('Username must be 3–20 characters using letters, numbers, and underscores.', 400);
    }
    if (studentId && !/^\d{4,20}$/.test(studentId)) {
      throw createError('Student ID must be 4–20 digits.', 400);
    }
    if (password.length < 8) throw createError('Password must be at least 8 characters.', 400);

    if (state.users.some((u) => u.email === email)) {
      throw createError('An account with this email already exists.', 409, { field: 'email' });
    }
    if (state.users.some((u) => u.username === username)) {
      throw createError('This username is already taken.', 409, { field: 'username' });
    }
    if (studentId && state.users.some((u) => u.studentId === studentId)) {
      throw createError('An account with this student ID already exists.', 409, { field: 'studentId' });
    }

    const now = new Date().toISOString();
    const id = `usr_${randomHex(8)}`;
    const user = {
      id,
      _id: id,
      name,
      email,
      username,
      studentId,
      passwordHash: await sha256Hex(password),
      role: ADMIN_EMAILS.has(email) ? 'admin' : 'user',
      profile: {
        links: { codeforcesHandle: '', codeforcesUrl: '', otherProfiles: [] },
        codeforcesVerification: { status: 'unverified', handle: '', selfReported: false },
      },
      notificationPreferences: { contestAnnouncements: true, icpcEvents: true },
      createdAt: now,
      updatedAt: now,
    };
    state.users.push(user);
    saveState(state);
    await syncDocToFirestore('users', user.id, presentUser(user, { includePrivate: false }));
    await syncDocToFirestore('userSecrets', user.id, { email: user.email, studentId: user.studentId });
    await syncDocToFirestore('usernames', username, { uid: user.id, createdAt: now });
    if (studentId) {
      await syncDocToFirestore('studentIds', studentId, { uid: user.id, createdAt: now });
    }
    const sessionToken = issueSessionToken(state, user);
    return { token: sessionToken, user: presentUser(user) };
  }

  // 4. Auth: Login
  if (pathname === '/auth/login' && method === 'POST') {
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const passHash = await sha256Hex(password);
    const user = state.users.find((u) => u.email === email && u.passwordHash === passHash);
    if (!user) throw createError('Email or password is incorrect.', 401);
    const sessionToken = issueSessionToken(state, user);
    return { token: sessionToken, user: presentUser(user) };
  }

  // 5. Auth: Current User
  if (pathname === '/auth/me' && method === 'GET') {
    const user = getCurrentUser(state, token);
    return { user: presentUser(user) };
  }

  // 6. Auth: Set/Update Username
  if (pathname === '/auth/username' && method === 'PUT') {
    const user = getCurrentUser(state, token);
    const username = String(body.username || '').toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      throw createError('Username must be 3–20 characters using letters, numbers, and underscores.', 400);
    }
    if (state.users.some((u) => u.id !== user.id && u.username === username)) {
      throw createError('This username is already taken.', 409);
    }
    const previousUsername = user.username;
    user.username = username;
    user.updatedAt = new Date().toISOString();
    saveState(state);
    if (previousUsername && previousUsername !== username) {
      await deleteDocFromFirestore('usernames', previousUsername);
    }
    await syncDocToFirestore('usernames', username, { uid: user.id, createdAt: user.updatedAt });
    await syncDocToFirestore('users', user.id, presentUser(user, { includePrivate: false }));
    return { user: presentUser(user) };
  }

  // 7. Auth: Set Student ID once
  if (pathname === '/auth/student-id' && method === 'PUT') {
    const user = getCurrentUser(state, token);
    if (user.studentId) {
      throw createError('Your student ID has already been set and cannot be changed.', 409);
    }
    const studentId = String(body.studentId || '').trim();
    if (!/^\d{4,20}$/.test(studentId)) {
      throw createError('Student ID must be 4–20 digits.', 400);
    }
    if (state.users.some((u) => u.id !== user.id && u.studentId === studentId)) {
      throw createError('An account with this student ID already exists.', 409);
    }
    user.studentId = studentId;
    user.updatedAt = new Date().toISOString();
    saveState(state);
    await syncDocToFirestore('studentIds', studentId, { uid: user.id, createdAt: user.updatedAt });
    await syncDocToFirestore('userSecrets', user.id, { email: user.email, studentId });
    return { user: presentUser(user) };
  }

  // 8. Auth: Password Update
  if (pathname === '/auth/password' && method === 'PUT') {
    const user = getCurrentUser(state, token);
    const currentHash = await sha256Hex(body.currentPassword || '');
    if (user.passwordHash && user.passwordHash !== currentHash) {
      throw createError('Your current password is incorrect.', 401);
    }
    const newPassword = String(body.newPassword || '');
    if (newPassword.length < 8) {
      throw createError('New password must be at least 8 characters.', 400);
    }
    const nextHash = await sha256Hex(newPassword);
    if (user.passwordHash === nextHash) {
      throw createError('Choose a new password that is different from your current password.', 400);
    }
    user.passwordHash = nextHash;
    user.updatedAt = new Date().toISOString();
    saveState(state);
    return { message: 'Password updated.' };
  }

  // 9. Auth: Profile Update (including self-reported Codeforces handle)
  if (pathname === '/auth/profile' && method === 'PUT') {
    const user = getCurrentUser(state, token);
    const nextProfile = { ...(user.profile || {}), ...body };
    const cfHandle = String(nextProfile.links?.codeforcesHandle || user.profile?.links?.codeforcesHandle || '').trim();
    if (cfHandle && !/^[A-Za-z0-9._-]{3,24}$/.test(cfHandle)) {
      throw createError('Enter a valid Codeforces handle (3–24 characters).', 400, { field: 'codeforcesHandle' });
    }
    user.profile = {
      ...nextProfile,
      links: {
        ...(user.profile?.links || {}),
        ...(body.links || {}),
        codeforcesHandle: cfHandle,
        codeforcesUrl: cfHandle ? `https://codeforces.com/profile/${encodeURIComponent(cfHandle)}` : '',
      },
      codeforcesVerification: {
        status: 'unverified',
        handle: cfHandle,
        normalizedHandle: cfHandle.toLowerCase(),
        selfReported: Boolean(cfHandle),
        verifiedAt: null,
      },
    };
    user.updatedAt = new Date().toISOString();
    saveState(state);
    await syncDocToFirestore('users', user.id, presentUser(user, { includePrivate: false }));
    return { user: presentUser(user) };
  }

  // 10. Auth: Privacy & Notification Preferences
  if (pathname === '/auth/privacy' && method === 'PUT') {
    const user = getCurrentUser(state, token);
    user.profile = {
      ...(user.profile || {}),
      privacy: { ...(user.profile?.privacy || {}), ...body },
    };
    user.updatedAt = new Date().toISOString();
    saveState(state);
    await syncDocToFirestore('users', user.id, presentUser(user, { includePrivate: false }));
    return { user: presentUser(user) };
  }

  if (pathname === '/auth/notification-preferences' && method === 'PUT') {
    const user = getCurrentUser(state, token);
    user.notificationPreferences = {
      ...(user.notificationPreferences || {}),
      contestAnnouncements: Boolean(body.contestAnnouncements),
      icpcEvents: Boolean(body.icpcEvents),
    };
    user.updatedAt = new Date().toISOString();
    saveState(state);
    await syncDocToFirestore('users', user.id, presentUser(user, { includePrivate: false }));
    return { user: presentUser(user) };
  }

  // 11. Codeforces Self-Reported Handle (Unverified Handle Mode per Decision D3)
  if (pathname === '/auth/codeforces-verification' && method === 'GET') {
    const user = getCurrentUser(state, token);
    const presented = presentUser(user);
    return { verification: presented.profile.codeforcesVerification };
  }

  if ((pathname === '/auth/codeforces-verification/generate' || pathname === '/auth/codeforces-verification/check') && method === 'POST') {
    const user = getCurrentUser(state, token);
    const handle = String(body.handle || user.profile?.links?.codeforcesHandle || '').trim();
    if (!/^[A-Za-z0-9._-]{3,24}$/.test(handle)) {
      throw createError('Enter a valid Codeforces handle (3–24 characters).', 400);
    }
    const normalized = handle.toLowerCase();
    if (
      state.users.some(
        (u) =>
          u.id !== user.id &&
          (u.profile?.links?.codeforcesHandle || '').toLowerCase() === normalized,
      )
    ) {
      throw createError('This Codeforces handle is already linked to another member.', 409);
    }
    const verification = {
      status: 'unverified',
      handle,
      normalizedHandle: normalized,
      selfReported: true,
      verifiedAt: null,
    };
    user.profile = {
      ...(user.profile || {}),
      links: {
        ...(user.profile?.links || {}),
        codeforcesHandle: handle,
        codeforcesUrl: `https://codeforces.com/profile/${encodeURIComponent(handle)}`,
      },
      codeforcesVerification: verification,
    };
    user.updatedAt = new Date().toISOString();
    saveState(state);
    await syncDocToFirestore('users', user.id, presentUser(user, { includePrivate: false }));
    return {
      verification,
      user: presentUser(user),
      token: null,
      message: `Handle @${handle} saved as an unverified self-reported handle.`,
    };
  }

  // 12. Student Dashboard
  if (pathname === '/dashboard' && method === 'GET') {
    const user = getCurrentUser(state, token);
    const lb = computeLeaderboard(state);
    const myEntry = lb.find((e) => e.userId === String(user.id)) || {
      rank: null,
      points: 0,
      eventsAttended: 0,
    };
    const myRegs = state.registrations.filter((r) => String(r.user) === String(user.id));
    const recentAttendance = myRegs
      .filter((r) => r.checkedInAt)
      .map((r) => {
        const ev = state.events.find((e) => String(e.id) === String(r.event));
        return ev ? { event: ev, checkedInAt: r.checkedInAt, pointsAwarded: r.pointsAwarded } : null;
      })
      .filter(Boolean)
      .slice(0, 3);
    const myEnrollments = state.roadmapEnrollments.filter((e) => String(e.student) === String(user.id));
    const now = new Date();
    const cycles = myEnrollments
      .map((enr) => {
        const cycle = state.roadmapCycles.find((c) => String(c.id || c._id) === String(enr.cycle));
        if (!cycle) return null;
        const roadmap = state.roadmaps.find((r) => String(r.id || r._id) === String(cycle.roadmap));
        if (!roadmap) return null;
        const cycleSessions = state.roadmapSessions.filter((s) => String(s.cycle) === String(cycle.id || cycle._id));
        const eligible = cycleSessions.filter((s) => s.status !== 'cancelled');
        const completed = eligible.filter((s) => s.status === 'completed');
        const nextSession =
          eligible
            .filter((s) => s.status !== 'completed' && new Date(s.startsAt) > now)
            .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0] || null;
        return {
          id: String(cycle.id || cycle._id),
          title: cycle.title,
          roadmapTitle: roadmap.title,
          roadmapSlug: roadmap.slug,
          startDate: cycle.startDate,
          endDate: cycle.endDate,
          progress: {
            completedSessions: completed.length,
            totalSessions: eligible.length,
          },
          nextSession,
        };
      })
      .filter(Boolean);

    return {
      dashboard: {
        stats: {
          points: myEntry.points,
          eventsAttended: myEntry.eventsAttended,
          registeredEvents: myRegs.length,
          trainingCycles: cycles.length,
        },
        recentAttendance,
        cycles,
      },
    };
  }

  // 13. Notifications
  if (pathname === '/notifications' && method === 'GET') {
    const user = getCurrentUser(state, token);
    const list = state.notifications
      .filter((n) => String(n.user) === String(user.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const filtered = query.unread === 'true' ? list.filter((n) => !n.readAt) : list;
    const unreadCount = list.filter((n) => !n.readAt).length;
    return { notifications: filtered, unreadCount };
  }

  if (pathname === '/notifications/read-all' && method === 'POST') {
    const user = getCurrentUser(state, token);
    const now = new Date().toISOString();
    state.notifications.forEach((n) => {
      if (String(n.user) === String(user.id) && !n.readAt) n.readAt = now;
    });
    saveState(state);
    return { unreadCount: 0 };
  }

  const notifMatch = pathname.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifMatch && method === 'PATCH') {
    const user = getCurrentUser(state, token);
    const notif = state.notifications.find(
      (n) => String(n._id || n.id) === decodeURIComponent(notifMatch[1]) && String(n.user) === String(user.id),
    );
    if (notif && !notif.readAt) {
      notif.readAt = new Date().toISOString();
      saveState(state);
    }
    const unreadCount = state.notifications.filter((n) => String(n.user) === String(user.id) && !n.readAt).length;
    return { notification: notif || null, unreadCount };
  }

  // 14. Public Events & Leaderboard
  if (pathname === '/events' && method === 'GET') {
    const now = new Date();
    let list = state.events.filter((e) => e.status === 'published');
    if (query.sort !== 'latest') {
      if (query.status === 'past') {
        list = list.filter((e) => new Date(e.endsAt) < now);
      } else {
        list = list.filter((e) => new Date(e.endsAt) >= now);
      }
    }
    if (query.category) {
      list = list.filter((e) => e.category.toLowerCase() === query.category.trim().toLowerCase());
    }
    if (query.q) {
      const qLower = query.q.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(qLower) ||
          e.description.toLowerCase().includes(qLower) ||
          e.category.toLowerCase().includes(qLower),
      );
    }
    if (query.sort === 'latest') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (query.status === 'past') {
      list.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
    } else {
      list.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    }
    return { events: list.map((e) => ({ ...e, id: String(e.id || e._id), _id: String(e._id || e.id) })) };
  }

  if (pathname === '/events/leaderboard' && method === 'GET') {
    return { leaderboard: computeLeaderboard(state).slice(0, 100) };
  }

  if (pathname === '/events/leaderboard/me' && method === 'GET') {
    const user = getCurrentUser(state, token);
    const lb = computeLeaderboard(state);
    const standing = lb.find((e) => e.userId === String(user.id)) || {
      rank: null,
      points: 0,
      eventsAttended: 0,
    };
    const attendanceHistory = state.registrations
      .filter((r) => String(r.user) === String(user.id) && r.checkedInAt)
      .map((r) => {
        const event = state.events.find((e) => String(e.id || e._id) === String(r.event));
        return event ? { event, checkedInAt: r.checkedInAt, pointsAwarded: r.pointsAwarded } : null;
      })
      .filter(Boolean);
    return { standing, attendanceHistory };
  }

  if (pathname === '/events/my' && method === 'GET') {
    const user = getCurrentUser(state, token);
    const events = state.registrations
      .filter((r) => String(r.user) === String(user.id))
      .map((r) => {
        const event = state.events.find((e) => String(e.id || e._id) === String(r.event));
        return event
          ? {
              registrationId: r.id,
              event: { ...event, id: String(event.id || event._id), _id: String(event._id || event.id) },
              ticketId: r.ticketId,
              checkedInAt: r.checkedInAt,
              pointsAwarded: r.pointsAwarded,
            }
          : null;
      })
      .filter(Boolean);
    return { events };
  }

  const memberProfileMatch = pathname.match(/^\/events\/([^/]+)\/profile$/);
  if (memberProfileMatch && method === 'GET') {
    const targetKey = decodeURIComponent(memberProfileMatch[1]).toLowerCase();
    const targetUser = state.users.find(
      (u) => (u.username && u.username.toLowerCase() === targetKey) || String(u.id).toLowerCase() === targetKey,
    );
    if (!targetUser) throw createError('Member profile not found.', 404);
    const presented = presentUser(targetUser, { includePrivate: false });
    if (presented.profile.privacy?.profileVisibility === 'private') {
      throw createError('Member profile not found.', 404);
    }
    const lb = computeLeaderboard(state);
    const standing = lb.find((e) => e.userId === String(targetUser.id)) || {
      rank: null,
      points: 0,
      eventsAttended: 0,
    };
    const attendanceHistory = state.registrations
      .filter((r) => String(r.user) === String(targetUser.id) && r.checkedInAt)
      .map((r) => {
        const event = state.events.find((e) => String(e.id || e._id) === String(r.event));
        return event ? { event, checkedInAt: r.checkedInAt, pointsAwarded: r.pointsAwarded } : null;
      })
      .filter(Boolean);
    return {
      profile: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        joinedAt: targetUser.createdAt,
        profile: presented.profile,
        standing,
        attendanceHistory: presented.profile.privacy?.showAttendanceHistory !== false ? attendanceHistory : null,
      },
    };
  }

  const eventRegMatch = pathname.match(/^\/events\/([^/]+)\/registrations$/);
  if (eventRegMatch && (method === 'POST' || method === 'DELETE')) {
    const user = getCurrentUser(state, token);
    const eventId = decodeURIComponent(eventRegMatch[1]);
    const event = state.events.find((e) => String(e.id || e._id) === eventId || e.slug === eventId);
    if (!event || event.status !== 'published') {
      throw createError('This event is not open for registration.', 404);
    }
    const regKey = `${event.id}_${user.id}`;
    if (method === 'POST') {
      if (state.registrations.some((r) => r.id === regKey)) {
        throw createError('You are already registered for this event.', 409);
      }
      if (event.capacity && event.registrationCount >= event.capacity) {
        throw createError('This event has reached its capacity.', 409);
      }
      const registration = {
        id: regKey,
        _id: regKey,
        user: user.id,
        event: event.id,
        ticketId: event.mode === 'offline' ? `TCK-${randomHex(4).toUpperCase()}` : null,
        checkedInAt: null,
        pointsAwarded: 0,
        createdAt: new Date().toISOString(),
      };
      state.registrations.push(registration);
      event.registrationCount = (Number(event.registrationCount) || 0) + 1;
      saveState(state);
      await syncDocToFirestore('registrations', regKey, registration);
      await syncDocToFirestore('events', event.id, event);
      return { registration };
    }
    // DELETE
    const idx = state.registrations.findIndex((r) => r.id === regKey);
    if (idx === -1) throw createError('Registration not found.', 404);
    if (state.registrations[idx].checkedInAt) {
      throw createError('Checked-in registrations cannot be cancelled.', 409);
    }
    state.registrations.splice(idx, 1);
    event.registrationCount = Math.max(0, (Number(event.registrationCount) || 1) - 1);
    saveState(state);
    await deleteDocFromFirestore('registrations', regKey);
    await syncDocToFirestore('events', event.id, event);
    return null;
  }

  const eventCheckInMatch = pathname.match(/^\/events\/([^/]+)\/check-in$/);
  if (eventCheckInMatch && (method === 'GET' || method === 'POST')) {
    const user = getCurrentUser(state, token);
    const eventId = decodeURIComponent(eventCheckInMatch[1]);
    const qrToken = method === 'GET' ? query.token : body.token;
    const tokenHash = await sha256Hex(qrToken);
    const event = state.events.find((e) => String(e.id || e._id) === eventId);
    if (!event || !event.checkInTokenHash || event.checkInTokenHash !== tokenHash) {
      throw createError('This event check-in link is invalid or has expired.', 404);
    }
    const regKey = `${event.id}_${user.id}`;
    const reg = state.registrations.find((r) => r.id === regKey);
    if (!reg) {
      throw createError('You must register for this event before checking in.', 403);
    }
    const checkInWindow = computeCheckInWindow(event);
    if (method === 'GET') {
      return {
        event: {
          id: event.id,
          title: event.title,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          location: event.location,
          category: event.category,
        },
        attendance: { checkedInAt: reg.checkedInAt, pointsAwarded: reg.pointsAwarded },
        checkInWindow,
      };
    }
    if (!checkInWindow.isOpen) {
      throw createError('Check-in is outside this event’s check-in window.', 409);
    }
    if (reg.checkedInAt) {
      throw createError('You have already checked in to this event.', 409, {
        attendance: { checkedInAt: reg.checkedInAt, pointsAwarded: reg.pointsAwarded },
      });
    }
    reg.checkedInAt = new Date().toISOString();
    reg.pointsAwarded = Number(event.attendancePoints) || 0;
    saveState(state);
    await syncDocToFirestore('registrations', regKey, reg);
    return {
      message: 'Check-in successful.',
      attendance: { checkedInAt: reg.checkedInAt, pointsAwarded: reg.pointsAwarded },
    };
  }

  const singleEventMatch = pathname.match(/^\/events\/([^/]+)$/);
  if (singleEventMatch && method === 'GET') {
    const key = decodeURIComponent(singleEventMatch[1]);
    const event = state.events.find(
      (e) => e.status === 'published' && (String(e.id || e._id) === key || e.slug === key),
    );
    if (!event) throw createError('Event not found.', 404);
    return { event: { ...event, id: String(event.id || event._id), _id: String(event._id || event.id) } };
  }

  // 15. Public & Student Roadmaps
  if (pathname === '/roadmaps' && method === 'GET') {
    const roadmaps = state.roadmaps
      .filter((r) => ['published', 'completed'].includes(r.status))
      .map((r) => ({ ...r, id: String(r.id || r._id), _id: String(r._id || r.id) }));
    return { roadmaps };
  }

  if (pathname === '/roadmaps/cycles' && method === 'GET') {
    const user = getCurrentUser(state, token);
    const enrolledIds = new Set(
      state.roadmapEnrollments.filter((e) => String(e.student) === String(user.id)).map((e) => String(e.cycle)),
    );
    const now = new Date();
    const cycles = state.roadmapCycles
      .filter((c) => ['published', 'completed'].includes(c.status))
      .flatMap((c) => {
        const roadmap = state.roadmaps.find((r) => String(r.id || r._id) === String(c.roadmap));
        if (!roadmap || !['published', 'completed'].includes(roadmap.status)) return [];
        const cid = String(c.id || c._id);
        return [
          {
            ...c,
            id: cid,
            _id: cid,
            roadmap: { title: roadmap.title, slug: roadmap.slug },
            enrolled: enrolledIds.has(cid),
            registrationOpen:
              c.status === 'published' &&
              new Date(c.registrationOpensAt) <= now &&
              new Date(c.registrationClosesAt) >= now &&
              (!c.capacity || c.enrollmentCount < c.capacity),
            remainingCapacity: c.capacity ? Math.max(0, c.capacity - (c.enrollmentCount || 0)) : null,
          },
        ];
      });
    return { cycles };
  }

  if (pathname === '/roadmaps/my' && method === 'GET') {
    const user = getCurrentUser(state, token);
    const myEnrs = state.roadmapEnrollments.filter((e) => String(e.student) === String(user.id));
    const roadmaps = myEnrs
      .map((enr) => {
        const cycle = state.roadmapCycles.find((c) => String(c.id || c._id) === String(enr.cycle));
        if (!cycle) return null;
        const roadmap = state.roadmaps.find((r) => String(r.id || r._id) === String(cycle.roadmap));
        if (!roadmap) return null;
        const sessions = state.roadmapSessions
          .filter((s) => String(s.cycle) === String(cycle.id || cycle._id))
          .sort((a, b) => a.ordinal - b.ordinal)
          .map((s) => {
            const att = state.roadmapAttendance.find(
              (a) => String(a.session) === String(s.id || s._id) && String(a.student) === String(user.id),
            );
            return {
              _id: String(s.id || s._id),
              id: String(s.id || s._id),
              title: s.title,
              startsAt: s.startsAt,
              status: s.status,
              timeZone: s.timeZone,
              attended: Boolean(att && !att.reversedAt),
              checkedInAt: att?.checkedInAt || null,
              pointsAwarded: att ? (Number(att.pointsAwarded) || 0) - (Number(att.pointsReversed) || 0) : 0,
            };
          });
        const eligible = sessions.filter((s) => s.status !== 'cancelled');
        const completed = eligible.filter((s) => s.status === 'completed');
        const attendedCount = sessions.filter((s) => s.attended).length;
        return {
          enrollment: { enrolledAt: enr.enrolledAt },
          roadmap,
          cycle: { ...cycle, _id: String(cycle.id || cycle._id), sessions },
          progress: {
            completedSessions: completed.length,
            sessionsAttended: attendedCount,
            totalSessions: eligible.length,
            progressPercentage: eligible.length ? Math.round((completed.length / eligible.length) * 100) : 0,
            attendancePercentage: completed.length ? Math.round((attendedCount / completed.length) * 100) : 0,
            points: sessions.reduce((sum, s) => sum + s.pointsAwarded, 0),
          },
        };
      })
      .filter(Boolean);
    return { roadmaps };
  }

  const sessionCheckInMatch = pathname.match(/^\/roadmaps\/sessions\/([^/]+)\/check-in$/);
  if (sessionCheckInMatch && (method === 'GET' || method === 'POST')) {
    const user = getCurrentUser(state, token);
    const sessionId = decodeURIComponent(sessionCheckInMatch[1]);
    const qrToken = method === 'GET' ? query.token : body.token;
    const tokenHash = await sha256Hex(qrToken);
    const sessionDoc = state.roadmapSessions.find((s) => String(s.id || s._id) === sessionId);
    if (!sessionDoc || !sessionDoc.checkInTokenHash || sessionDoc.checkInTokenHash !== tokenHash) {
      throw createError('This session check-in link is invalid or has expired.', 404);
    }
    const enrolled = state.roadmapEnrollments.some(
      (e) => String(e.cycle) === String(sessionDoc.cycle) && String(e.student) === String(user.id),
    );
    if (!enrolled) {
      throw createError('You must be enrolled in this training cycle before checking in.', 403);
    }
    const windowInfo = computeCheckInWindow(sessionDoc);
    const attId = `${sessionDoc.id}_${user.id}`;
    const existingAtt = state.roadmapAttendance.find((a) => a.id === attId) || null;
    if (method === 'GET') {
      return {
        session: {
          id: sessionDoc.id,
          title: sessionDoc.title,
          startsAt: sessionDoc.startsAt,
          endsAt: sessionDoc.endsAt,
          timeZone: sessionDoc.timeZone,
        },
        attendance: existingAtt,
        isOpen: windowInfo.isOpen,
      };
    }
    if (!windowInfo.isOpen) {
      throw createError('Check-in is outside this session’s check-in window.', 409);
    }
    if (existingAtt) {
      throw createError('You have already checked in to this session.', 409, { attendance: existingAtt });
    }
    const attendance = {
      id: attId,
      _id: attId,
      session: sessionDoc.id,
      student: user.id,
      checkedInAt: new Date().toISOString(),
      pointsAwarded: Number(sessionDoc.attendancePoints) || 15,
      pointsReversed: 0,
      reversedAt: null,
      recordedBy: 'qr',
    };
    state.roadmapAttendance.push(attendance);
    saveState(state);
    await syncDocToFirestore('roadmapAttendance', attId, attendance);
    return { message: 'Session check-in recorded.', attendance };
  }

  const roadmapProgressMatch = pathname.match(/^\/roadmaps\/([^/]+)\/progress$/);
  if (roadmapProgressMatch && (method === 'GET' || method === 'PUT')) {
    const user = getCurrentUser(state, token);
    const slug = decodeURIComponent(roadmapProgressMatch[1]);
    const roadmap = state.roadmaps.find((r) => r.slug === slug);
    if (!roadmap) throw createError('Roadmap not found.', 404);
    const progId = `${roadmap.id}_${user.id}`;
    let prog = state.roadmapProgress.find((p) => p.id === progId);
    if (method === 'GET') {
      return { solvedProblems: prog?.solvedProblems || [] };
    }
    const { nodeId, problemUrl, solved } = body;
    if (!prog) {
      prog = { id: progId, _id: progId, roadmap: roadmap.id, student: user.id, solvedProblems: [] };
      state.roadmapProgress.push(prog);
    }
    const existsIdx = prog.solvedProblems.findIndex(
      (item) => String(item.nodeId || item.node) === String(nodeId) && item.problemUrl === problemUrl,
    );
    if (solved && existsIdx === -1) {
      prog.solvedProblems.push({ nodeId: String(nodeId), node: String(nodeId), problemUrl });
    } else if (!solved && existsIdx >= 0) {
      prog.solvedProblems.splice(existsIdx, 1);
    }
    saveState(state);
    await syncDocToFirestore('roadmapProgress', progId, prog);
    return { solvedProblems: prog.solvedProblems };
  }

  const roadmapCycleEnrollMatch = pathname.match(/^\/roadmaps\/([^/]+)\/cycles\/([^/]+)\/enroll$/);
  if (roadmapCycleEnrollMatch && (method === 'POST' || method === 'DELETE')) {
    const user = getCurrentUser(state, token);
    const slug = decodeURIComponent(roadmapCycleEnrollMatch[1]);
    const cycleId = decodeURIComponent(roadmapCycleEnrollMatch[2]);
    const roadmap = state.roadmaps.find((r) => r.slug === slug);
    const cycle = state.roadmapCycles.find((c) => String(c.id || c._id) === cycleId);
    if (!roadmap || !cycle) throw createError('Cycle not found.', 404);
    const enrId = `${cycle.id}_${user.id}`;
    if (method === 'POST') {
      if (state.roadmapEnrollments.some((e) => e.id === enrId)) {
        throw createError('You are already enrolled in this cycle.', 409);
      }
      if (cycle.capacity && cycle.enrollmentCount >= cycle.capacity) {
        throw createError('This cycle is full.', 409);
      }
      const enrollment = {
        id: enrId,
        _id: enrId,
        cycle: cycle.id,
        student: user.id,
        enrolledAt: new Date().toISOString(),
      };
      state.roadmapEnrollments.push(enrollment);
      cycle.enrollmentCount = (Number(cycle.enrollmentCount) || 0) + 1;
      saveState(state);
      await syncDocToFirestore('roadmapEnrollments', enrId, enrollment);
      await syncDocToFirestore('roadmapCycles', cycle.id, cycle);
      return { enrollment };
    }
    const idx = state.roadmapEnrollments.findIndex((e) => e.id === enrId);
    if (idx === -1) throw createError('You are not enrolled in this cycle.', 404);
    state.roadmapEnrollments.splice(idx, 1);
    cycle.enrollmentCount = Math.max(0, (Number(cycle.enrollmentCount) || 1) - 1);
    saveState(state);
    await deleteDocFromFirestore('roadmapEnrollments', enrId);
    await syncDocToFirestore('roadmapCycles', cycle.id, cycle);
    return { left: true };
  }

  const roadmapCycleDetailMatch = pathname.match(/^\/roadmaps\/([^/]+)\/cycles\/([^/]+)$/);
  if (roadmapCycleDetailMatch && method === 'GET') {
    const user = token ? getCurrentUser(state, token) : null;
    const slug = decodeURIComponent(roadmapCycleDetailMatch[1]);
    const cycleId = decodeURIComponent(roadmapCycleDetailMatch[2]);
    const roadmap = state.roadmaps.find((r) => r.slug === slug);
    const cycle = state.roadmapCycles.find((c) => String(c.id || c._id) === cycleId);
    if (!roadmap || !cycle) throw createError('Cycle not found.', 404);
    const enrolled = user
      ? state.roadmapEnrollments.some((e) => String(e.cycle) === String(cycle.id) && String(e.student) === String(user.id))
      : false;
    const now = new Date();
    const sessions = state.roadmapSessions
      .filter((s) => String(s.cycle) === String(cycle.id))
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((s) => ({
        ...s,
        _id: String(s.id || s._id),
        attended: user
          ? state.roadmapAttendance.some(
              (a) => String(a.session) === String(s.id || s._id) && String(a.student) === String(user.id) && !a.reversedAt,
            )
          : false,
      }));
    return {
      roadmap,
      cycle: { ...cycle, _id: String(cycle.id || cycle._id) },
      enrolled,
      registrationOpen:
        cycle.status === 'published' &&
        new Date(cycle.registrationOpensAt) <= now &&
        new Date(cycle.registrationClosesAt) >= now &&
        (!cycle.capacity || cycle.enrollmentCount < cycle.capacity),
      sessions,
    };
  }

  const roadmapCyclesListMatch = pathname.match(/^\/roadmaps\/([^/]+)\/cycles$/);
  if (roadmapCyclesListMatch && method === 'GET') {
    const user = getCurrentUser(state, token);
    const slug = decodeURIComponent(roadmapCyclesListMatch[1]);
    const roadmap = state.roadmaps.find((r) => r.slug === slug);
    if (!roadmap) throw createError('Roadmap not found.', 404);
    const now = new Date();
    const cycles = state.roadmapCycles
      .filter((c) => String(c.roadmap) === String(roadmap.id))
      .map((c) => ({
        ...c,
        _id: String(c.id || c._id),
        enrolled: state.roadmapEnrollments.some(
          (e) => String(e.cycle) === String(c.id) && String(e.student) === String(user.id),
        ),
        registrationOpen:
          c.status === 'published' &&
          new Date(c.registrationOpensAt) <= now &&
          new Date(c.registrationClosesAt) >= now &&
          (!c.capacity || c.enrollmentCount < c.capacity),
        remainingCapacity: c.capacity ? Math.max(0, c.capacity - (c.enrollmentCount || 0)) : null,
      }));
    return { roadmap: { _id: roadmap.id, title: roadmap.title, slug: roadmap.slug }, cycles };
  }

  const singleRoadmapMatch = pathname.match(/^\/roadmaps\/([^/]+)$/);
  if (singleRoadmapMatch && method === 'GET') {
    const slug = decodeURIComponent(singleRoadmapMatch[1]);
    const roadmap = state.roadmaps.find((r) => r.slug === slug && ['published', 'completed'].includes(r.status));
    if (!roadmap) throw createError('Roadmap not found.', 404);
    const nodes = state.roadmapNodes
      .filter((n) => String(n.roadmap) === String(roadmap.id || roadmap._id))
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((n) => ({ ...n, _id: String(n.id || n._id), id: String(n.id || n._id) }));
    return { roadmap: { ...roadmap, _id: String(roadmap.id || roadmap._id), id: String(roadmap.id || roadmap._id), nodes } };
  }

  // 16. Admin Endpoints
  if (pathname.startsWith('/admin/')) {
    const adminUser = getCurrentUser(state, token);
    requireAdmin(adminUser);

    if (pathname === '/admin/events' && method === 'GET') {
      return {
        events: state.events
          .filter((e) => e.status !== 'deleted')
          .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt))
          .map((e) => ({ ...e, id: String(e.id || e._id), _id: String(e._id || e.id) })),
      };
    }

    if (pathname === '/admin/events' && method === 'POST') {
      const now = new Date().toISOString();
      const id = `evt_${randomHex(8)}`;
      const slug = `${slugify(body.title || 'event')}-${randomHex(3)}`;
      const event = {
        id,
        _id: id,
        title: String(body.title || '').trim(),
        slug,
        description: String(body.description || '').trim(),
        coverImageUrl: String(body.coverImageUrl || '').trim(),
        category: String(body.category || 'Workshop').trim(),
        startsAt: new Date(body.startsAt).toISOString(),
        endsAt: new Date(body.endsAt).toISOString(),
        registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline).toISOString() : null,
        publishedAt: body.status === 'published' ? now : null,
        checkInOpensAt: null,
        checkInClosesAt: null,
        checkInTokenHash: null,
        attendancePoints: Number(body.attendancePoints) || 0,
        mode: body.mode || 'offline',
        location: String(body.location || '').trim(),
        capacity: body.capacity ? Number(body.capacity) : null,
        registrationCount: 0,
        status: body.status || 'draft',
        deletedAt: null,
        createdBy: adminUser.id,
        createdAt: now,
        updatedAt: now,
      };
      state.events.push(event);
      saveState(state);
      await syncDocToFirestore('events', event.id, event);
      return { event };
    }

    const adminEventQrMatch = pathname.match(/^\/admin\/events\/([^/]+)\/check-in-qr$/);
    if (adminEventQrMatch && method === 'POST') {
      const eventId = decodeURIComponent(adminEventQrMatch[1]);
      const event = state.events.find((e) => String(e.id || e._id) === eventId);
      if (!event) throw createError('Event not found.', 404);
      if (event.status !== 'published') {
        throw createError('Publish the event before generating a check-in QR code.', 409);
      }
      const rawToken = randomHex(24);
      event.checkInTokenHash = await sha256Hex(rawToken);
      event.updatedAt = new Date().toISOString();
      saveState(state);
      await syncDocToFirestore('events', event.id, event);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://icpcpua.vercel.app';
      const checkInUrl = `${origin}/events/${encodeURIComponent(event.id)}/check-in?token=${encodeURIComponent(rawToken)}`;
      const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
        errorCorrectionLevel: 'H',
        margin: 4,
        width: 512,
      });
      return {
        checkInUrl,
        qrCodeDataUrl,
        event: { id: event.id, title: event.title, startsAt: event.startsAt, endsAt: event.endsAt },
        checkInWindow: computeCheckInWindow(event),
      };
    }

    const adminEventRegsMatch = pathname.match(/^\/admin\/events\/([^/]+)\/registrations$/);
    if (adminEventRegsMatch && method === 'GET') {
      const eventId = decodeURIComponent(adminEventRegsMatch[1]);
      const event = state.events.find((e) => String(e.id || e._id) === eventId);
      if (!event) throw createError('Event not found.', 404);
      const registrations = state.registrations
        .filter((r) => String(r.event) === String(event.id))
        .map((r) => {
          const student = state.users.find((u) => String(u.id) === String(r.user));
          return {
            id: r.id,
            _id: r.id,
            ticketId: r.ticketId,
            checkedInAt: r.checkedInAt,
            pointsAwarded: r.pointsAwarded,
            registeredAt: r.createdAt,
            user: student
              ? { id: student.id, name: student.name, email: student.email, username: student.username, studentId: student.studentId }
              : { id: r.user, name: 'Member', email: '' },
          };
        });
      return { event, registrations };
    }

    const adminEventItemMatch = pathname.match(/^\/admin\/events\/([^/]+)$/);
    if (adminEventItemMatch && (method === 'PUT' || method === 'DELETE')) {
      const eventId = decodeURIComponent(adminEventItemMatch[1]);
      const event = state.events.find((e) => String(e.id || e._id) === eventId);
      if (!event) throw createError('Event not found.', 404);
      if (method === 'DELETE') {
        if (body.confirmationName !== event.title) {
          throw createError('The event name does not match.', 400);
        }
        event.status = 'deleted';
        event.deletedAt = new Date().toISOString();
        event.checkInTokenHash = null;
        saveState(state);
        await syncDocToFirestore('events', event.id, event);
        return { message: 'Event deleted. Attendance and points history have been preserved.' };
      }
      Object.assign(event, {
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
        ...(body.description !== undefined ? { description: String(body.description).trim() } : {}),
        ...(body.category !== undefined ? { category: String(body.category).trim() } : {}),
        ...(body.startsAt !== undefined ? { startsAt: new Date(body.startsAt).toISOString() } : {}),
        ...(body.endsAt !== undefined ? { endsAt: new Date(body.endsAt).toISOString() } : {}),
        ...(body.location !== undefined ? { location: String(body.location).trim() } : {}),
        ...(body.mode !== undefined ? { mode: body.mode } : {}),
        ...(body.capacity !== undefined ? { capacity: body.capacity ? Number(body.capacity) : null } : {}),
        ...(body.attendancePoints !== undefined ? { attendancePoints: Number(body.attendancePoints) || 0 } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        updatedAt: new Date().toISOString(),
      });
      saveState(state);
      await syncDocToFirestore('events', event.id, event);
      return { event };
    }

    if (pathname === '/admin/roadmaps' && method === 'GET') {
      const roadmaps = state.roadmaps.map((r) => ({
        ...r,
        _id: String(r.id || r._id),
        cycles: state.roadmapCycles
          .filter((c) => String(c.roadmap) === String(r.id || r._id))
          .map((c) => ({ ...c, _id: String(c.id || c._id) })),
      }));
      return { roadmaps };
    }

    if (pathname === '/admin/roadmaps' && method === 'POST') {
      const now = new Date().toISOString();
      const id = `rm_${randomHex(8)}`;
      const roadmap = {
        id,
        _id: id,
        title: String(body.title || '').trim(),
        slug: `${slugify(body.title || 'roadmap')}-${randomHex(3)}`,
        description: String(body.description || '').trim(),
        coverImageUrl: String(body.coverImageUrl || '').trim(),
        difficulty: body.difficulty || 'beginner',
        estimatedDuration: String(body.estimatedDuration || '').trim(),
        objectives: Array.isArray(body.objectives) ? body.objectives : [],
        audience: String(body.audience || '').trim(),
        prerequisites: String(body.prerequisites || '').trim(),
        status: body.status || 'draft',
        createdBy: adminUser.id,
        createdAt: now,
        updatedAt: now,
      };
      state.roadmaps.push(roadmap);
      saveState(state);
      await syncDocToFirestore('roadmaps', id, roadmap);
      return { roadmap };
    }

    const adminRoadmapNodesMatch = pathname.match(/^\/admin\/roadmaps\/([^/]+)\/nodes(?:\/([^/]+))?$/);
    if (adminRoadmapNodesMatch) {
      const roadmapId = decodeURIComponent(adminRoadmapNodesMatch[1]);
      const nodeId = adminRoadmapNodesMatch[2] ? decodeURIComponent(adminRoadmapNodesMatch[2]) : null;
      if (method === 'GET') {
        const nodes = state.roadmapNodes
          .filter((n) => String(n.roadmap) === roadmapId)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((n) => ({ ...n, _id: String(n.id || n._id) }));
        return { nodes };
      }
      if (method === 'POST') {
        const id = `node_${randomHex(8)}`;
        const node = {
          id,
          _id: id,
          roadmap: roadmapId,
          title: String(body.title || '').trim(),
          description: String(body.description || '').trim(),
          dependencies: Array.isArray(body.dependencies) ? body.dependencies : [],
          position: Number(body.position) || 0,
          estimatedHours: body.estimatedHours ? Number(body.estimatedHours) : null,
          resources: Array.isArray(body.resources) ? body.resources : [],
          problems: Array.isArray(body.problems) ? body.problems : [],
          isRequired: body.isRequired !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.roadmapNodes.push(node);
        saveState(state);
        await syncDocToFirestore('roadmapNodes', id, node);
        return { node };
      }
      if (method === 'PUT' && nodeId) {
        const node = state.roadmapNodes.find((n) => String(n.id || n._id) === nodeId);
        if (!node) throw createError('Learning topic not found.', 404);
        Object.assign(node, body, { updatedAt: new Date().toISOString() });
        saveState(state);
        await syncDocToFirestore('roadmapNodes', node.id, node);
        return { node };
      }
      if (method === 'DELETE' && nodeId) {
        const idx = state.roadmapNodes.findIndex((n) => String(n.id || n._id) === nodeId);
        if (idx >= 0) state.roadmapNodes.splice(idx, 1);
        saveState(state);
        await deleteDocFromFirestore('roadmapNodes', nodeId);
        return null;
      }
    }

    const adminRoadmapCyclesCreateMatch = pathname.match(/^\/admin\/roadmaps\/([^/]+)\/cycles$/);
    if (adminRoadmapCyclesCreateMatch && method === 'POST') {
      const roadmapId = decodeURIComponent(adminRoadmapCyclesCreateMatch[1]);
      const id = `cyc_${randomHex(8)}`;
      const cycle = {
        id,
        _id: id,
        roadmap: roadmapId,
        ...body,
        enrollmentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.roadmapCycles.push(cycle);
      saveState(state);
      await syncDocToFirestore('roadmapCycles', id, cycle);
      return { cycle };
    }

    const adminRoadmapUpdateMatch = pathname.match(/^\/admin\/roadmaps\/([^/]+)$/);
    if (adminRoadmapUpdateMatch && method === 'PUT') {
      const roadmapId = decodeURIComponent(adminRoadmapUpdateMatch[1]);
      const roadmap = state.roadmaps.find((r) => String(r.id || r._id) === roadmapId);
      if (!roadmap) throw createError('Roadmap not found.', 404);
      Object.assign(roadmap, body, { updatedAt: new Date().toISOString() });
      saveState(state);
      await syncDocToFirestore('roadmaps', roadmap.id, roadmap);
      return { roadmap };
    }

    const adminCycleSubMatch = pathname.match(/^\/admin\/roadmap-cycles\/([^/]+)(?:\/(.+))?$/);
    if (adminCycleSubMatch) {
      const cycleId = decodeURIComponent(adminCycleSubMatch[1]);
      const sub = adminCycleSubMatch[2] || '';
      const cycle = state.roadmapCycles.find((c) => String(c.id || c._id) === cycleId);
      if (!cycle) throw createError('Cycle not found.', 404);

      if (!sub && method === 'PUT') {
        Object.assign(cycle, body, { updatedAt: new Date().toISOString() });
        saveState(state);
        await syncDocToFirestore('roadmapCycles', cycle.id, cycle);
        return { cycle };
      }
      if (sub === 'sessions' && method === 'GET') {
        const sessions = state.roadmapSessions
          .filter((s) => String(s.cycle) === cycleId)
          .sort((a, b) => a.ordinal - b.ordinal)
          .map((s) => {
            const atts = state.roadmapAttendance.filter((a) => String(a.session) === String(s.id || s._id) && !a.reversedAt);
            return {
              ...s,
              _id: String(s.id || s._id),
              attendance: {
                attendanceCount: atts.length,
                pointsAwarded: atts.reduce((sum, a) => sum + (Number(a.pointsAwarded) || 0), 0),
              },
            };
          });
        return { sessions };
      }
      if (sub === 'enrollments' && method === 'GET') {
        const enrollments = state.roadmapEnrollments
          .filter((e) => String(e.cycle) === cycleId)
          .map((e) => {
            const student = state.users.find((u) => String(u.id) === String(e.student));
            return {
              ...e,
              _id: e.id,
              student: student || { _id: e.student, name: 'Student', email: '' },
            };
          });
        return { enrollments };
      }
      if (sub === 'schedule/preview' && method === 'GET') {
        const proposed = generateScheduleSessions(cycle);
        const tokenHash = await sha256Hex(JSON.stringify({ cycleId, count: proposed.length }));
        return {
          preview: {
            proposedCount: proposed.length,
            confirmationToken: tokenHash,
            additions: proposed.length,
            reschedules: 0,
            preserved: 0,
            cancellations: 0,
            sessions: proposed,
            changes: proposed.map((s) => ({ action: 'add', ordinal: s.ordinal, startsAt: s.startsAt })),
          },
        };
      }
      if (sub === 'schedule' && method === 'POST') {
        const proposed = generateScheduleSessions(cycle);
        for (const item of proposed) {
          const exists = state.roadmapSessions.find(
            (s) => String(s.cycle) === cycleId && s.ordinal === item.ordinal,
          );
          if (!exists) {
            const sid = `ses_${randomHex(8)}`;
            state.roadmapSessions.push({
              id: sid,
              _id: sid,
              cycle: cycleId,
              ...item,
              checkInTokenHash: null,
              materials: [],
              problemSets: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
        saveState(state);
        return {
          summary: {
            proposedCount: proposed.length,
            created: proposed.length,
            rescheduled: 0,
            cancelled: 0,
            preserved: 0,
          },
        };
      }
    }

    const adminSessionSubMatch = pathname.match(/^\/admin\/roadmap-sessions\/([^/]+)(?:\/(.+))?$/);
    if (adminSessionSubMatch) {
      const sessionId = decodeURIComponent(adminSessionSubMatch[1]);
      const sub = adminSessionSubMatch[2] || '';
      const sessionDoc = state.roadmapSessions.find((s) => String(s.id || s._id) === sessionId);
      if (!sessionDoc) throw createError('Session not found.', 404);

      if (!sub && method === 'PUT') {
        Object.assign(sessionDoc, body, { updatedAt: new Date().toISOString() });
        saveState(state);
        await syncDocToFirestore('roadmapSessions', sessionDoc.id, sessionDoc);
        return { session: sessionDoc, hasAttendance: false };
      }
      if (sub === 'check-in-qr' && method === 'POST') {
        const rawToken = randomHex(24);
        sessionDoc.checkInTokenHash = await sha256Hex(rawToken);
        saveState(state);
        await syncDocToFirestore('roadmapSessions', sessionDoc.id, sessionDoc);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://icpcpua.vercel.app';
        const checkInUrl = `${origin}/roadmaps/check-in/${encodeURIComponent(sessionDoc.id)}?token=${encodeURIComponent(rawToken)}`;
        const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, { width: 512, margin: 4 });
        return {
          checkInUrl,
          qrCodeDataUrl,
          session: { id: sessionDoc.id, title: sessionDoc.title, startsAt: sessionDoc.startsAt },
        };
      }
      if (sub === 'attendance' && method === 'GET') {
        const attendance = state.roadmapAttendance
          .filter((a) => String(a.session) === sessionId)
          .map((a) => {
            const student = state.users.find((u) => String(u.id) === String(a.student));
            return { ...a, _id: a.id, student: student || { _id: a.student, name: 'Student' } };
          });
        return { attendance };
      }
      if (sub === 'attendance' && method === 'POST') {
        const attId = `${sessionId}_${body.studentId}`;
        if (state.roadmapAttendance.some((a) => a.id === attId)) {
          throw createError('Attendance has already been recorded for this student.', 409);
        }
        const attendance = {
          id: attId,
          _id: attId,
          session: sessionId,
          student: body.studentId,
          checkedInAt: new Date().toISOString(),
          pointsAwarded: Number(sessionDoc.attendancePoints) || 15,
          pointsReversed: 0,
          reversedAt: null,
          recordedBy: 'admin',
        };
        state.roadmapAttendance.push(attendance);
        saveState(state);
        await syncDocToFirestore('roadmapAttendance', attId, attendance);
        return { attendance };
      }
      const reverseMatch = sub.match(/^attendance\/([^/]+)\/reverse-points$/);
      if (reverseMatch && method === 'PATCH') {
        const attId = decodeURIComponent(reverseMatch[1]);
        const att = state.roadmapAttendance.find((a) => String(a.id || a._id) === attId);
        if (!att) throw createError('Attendance record not found.', 404);
        att.pointsReversed = att.pointsAwarded;
        att.reversedAt = new Date().toISOString();
        att.reversalReason = String(body.reason || '').trim();
        saveState(state);
        await syncDocToFirestore('roadmapAttendance', att.id, att);
        return { attendance: att };
      }
    }
  }

  throw createError(`Route not found: ${method} ${pathname}`, 404);
}
