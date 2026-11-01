import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../src/models/User.js';
import { presentUser } from '../src/services/authService.js';
import app from '../src/app.js';
import {
  checkCodeforcesVerification,
  fetchCodeforcesUser,
  generateCodeforcesVerification,
  hashVerificationToken,
  matchesVerificationToken,
} from '../src/services/codeforcesVerificationService.js';
import { requireCodeforcesVerification, requireStudent } from '../src/middleware/auth.js';
import roadmapRoutes from '../src/routes/roadmaps.js';
import studentDashboardRoutes from '../src/routes/studentDashboard.js';
import { findCodeforcesHandleOwner } from '../src/repositories/userRepository.js';
import * as authValidation from '../src/validation/auth.validation.js';

const userId = '507f1f77bcf86cd799439011';
const handle = 'CodeforcesUser';
let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

function verificationQuery(user) {
  return {
    select() {
      return {
        lean: async () => user,
      };
    },
  };
}

test('new and legacy users default to unverified without changing privacy defaults', () => {
  const user = new User({ name: 'Student', email: 'student@example.test', passwordHash: 'hash' });
  assert.equal(user.profile.codeforcesVerification.status, 'unverified');
  assert.equal(user.profile.privacy.profileVisible, true);
  assert.equal(user.profile.privacy.leaderboardVisible, true);
});

test('Codeforces handles are strictly validated', () => {
  assert.deepEqual(authValidation.codeforcesHandle.body({ handle }), { handle });
  assert.throws(() => authValidation.codeforcesHandle.body({ handle: 'bad handle' }), /valid Codeforces handle/);
  assert.throws(() => authValidation.codeforcesHandle.body({ handle, verified: true }), /Unexpected field/);
});

test('all Codeforces verification endpoints require authentication', async () => {
  const responses = await Promise.all([
    fetch(`${baseUrl}/auth/codeforces-verification`),
    fetch(`${baseUrl}/auth/codeforces-verification/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    }),
    fetch(`${baseUrl}/auth/codeforces-verification/check`, { method: 'POST' }),
  ]);
  assert.deepEqual(responses.map(response => response.status), [401, 401, 401]);
});

test('student dashboard API requires Codeforces verification', async () => {
  const response = await fetch(`${baseUrl}/dashboard`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.message, 'Sign in to continue.');
  const dashboardRoute = studentDashboardRoutes.stack.find(layer => layer.route?.path === '/').route;
  assert.ok(dashboardRoute.stack.some(layer => layer.handle.name === 'requireCodeforcesVerification'));
  assert.ok(dashboardRoute.stack.some(layer => layer.handle.name === 'requireStudent'));
});

test('roadmap and cycle routes do not require Codeforces verification', () => {
  const protectedByVerification = roadmapRoutes.stack
    .filter(layer => layer.route)
    .filter(layer => layer.route.stack.some(handler => handler.handle.name === 'requireCodeforcesVerification'));
  assert.deepEqual(protectedByVerification, []);
  const enrollmentRoute = roadmapRoutes.stack.find(layer => layer.route?.path === '/:roadmapSlug/cycles/:cycleId/enroll').route;
  assert.ok(enrollmentRoute.stack.some(layer => layer.handle.name === 'enroll'));
});

test('verification handle index enforces uniqueness only when a normalized handle exists', () => {
  assert.ok(User.schema.indexes().some(([keys, options]) => (
    keys['profile.codeforcesVerification.normalizedHandle'] === 1
      && options.unique
      && options.partialFilterExpression['profile.codeforcesVerification.normalizedHandle'].$type === 'string'
  )));
});

test('user presentation never exposes a pending token hash or normalized handle', () => {
  const user = {
    id: userId,
    name: 'Student',
    email: 'student@example.test',
    role: 'user',
    profile: {
      toObject: () => ({
        codeforcesVerification: {
          status: 'pending',
          handle,
          normalizedHandle: handle.toLowerCase(),
          tokenHash: 'sensitive-hash',
          expiresAt: new Date('2027-01-01T00:15:00Z'),
        },
      }),
    },
  };
  const presented = presentUser(user);
  assert.deepEqual(presented.profile.codeforcesVerification, {
    status: 'pending',
    handle,
    expiresAt: new Date('2027-01-01T00:15:00Z'),
  });
  assert.equal(JSON.stringify(presented).includes('sensitive-hash'), false);
});

test('verification compares a hashed First Name English value in constant-time safe format', () => {
  const token = 'PUA-ICPC-example-token';
  assert.equal(matchesVerificationToken(token, hashVerificationToken(token)), true);
  assert.equal(matchesVerificationToken('another value', hashVerificationToken(token)), false);
  assert.equal(matchesVerificationToken(token, 'not-a-hash'), false);
  assert.equal(matchesVerificationToken(undefined, hashVerificationToken(token)), false);
});

test('Codeforces user lookup calls the public user.info API with the handle', async () => {
  let requestUrl;
  const result = await fetchCodeforcesUser(handle, async url => {
    requestUrl = new URL(url);
    return {
      ok: true,
      json: async () => ({ status: 'OK', result: [{ handle, firstName: 'First name', organization: 'not used' }] }),
    };
  });
  assert.equal(requestUrl.pathname, '/api/user.info');
  assert.equal(requestUrl.searchParams.get('handles'), handle);
  assert.equal(result.firstName, 'First name');
});

test('Codeforces verification remains pending when the token is not in First Name English', async t => {
  const now = new Date('2027-01-01T00:00:00Z');
  const tokenHash = hashVerificationToken('pending-token');
  const pending = {
    _id: userId,
    profile: { codeforcesVerification: {
      status: 'pending',
      handle,
      normalizedHandle: handle.toLowerCase(),
      tokenHash,
      expiresAt: new Date(now.getTime() + 60_000),
    } },
  };
  t.mock.method(User, 'findById', () => verificationQuery(pending));
  const complete = t.mock.method(User, 'findOneAndUpdate', () => {
    throw new Error('A mismatched firstName must not complete verification.');
  });

  const result = await checkCodeforcesVerification(userId, now, async () => ({
    ok: true,
    json: async () => ({ status: 'OK', result: [{ handle, firstName: 'Not the token', organization: 'pending-token' }] }),
  }));

  test('handle ownership lookup excludes the current user and matches normalized handles', () => {
    const query = findCodeforcesHandleOwner(handle.toLowerCase(), userId);
    assert.deepEqual(query.getFilter(), {
      'profile.codeforcesVerification.normalizedHandle': handle.toLowerCase(),
      _id: { $ne: userId },
    });
  });

  test('dashboard middleware rejects unverified students and non-student accounts', () => {
    const requestResult = (middleware, req) => {
      let response;
      let passed = false;
      const res = {
        status(status) {
          response = { status };
          return this;
        },
        json(body) {
          response.body = body;
          return this;
        },
      };
      middleware(req, res, () => { passed = true; });
      return { passed, response };
    };
    const blocked = requestResult(requireCodeforcesVerification, {
      user: { role: 'user', profile: { codeforcesVerification: { status: 'pending' } } },
    });
    assert.equal(blocked.passed, false);
    assert.equal(blocked.response.status, 403);
    assert.equal(blocked.response.body.error.code, 'CODEFORCES_VERIFICATION_REQUIRED');
    assert.equal(requestResult(requireCodeforcesVerification, {
      user: { role: 'user', profile: { codeforcesVerification: { status: 'verified' } } },
    }).passed, true);
    assert.equal(requestResult(requireStudent, { user: { role: 'admin' } }).response.status, 403);
    assert.equal(requestResult(requireStudent, { user: { role: 'user' } }).passed, true);
  });
  assert.equal(result.verification.status, 'pending');
  assert.match(result.message, /First Name English/);
  assert.equal(complete.mock.callCount(), 0);
});

test('Codeforces verification succeeds only when First Name English matches the token hash', async t => {
  const now = new Date('2027-01-01T00:00:00Z');
  const token = 'PUA-ICPC-exact-token';
  const tokenHash = hashVerificationToken(token);
  const pending = {
    _id: userId,
    profile: { codeforcesVerification: {
      status: 'pending',
      handle,
      normalizedHandle: handle.toLowerCase(),
      tokenHash,
      expiresAt: new Date(now.getTime() + 60_000),
    } },
  };
  t.mock.method(User, 'findById', () => verificationQuery(pending));
  let updateFilter;
  t.mock.method(User, 'findOneAndUpdate', (filter) => {
    updateFilter = filter;
    return {
      lean: async () => ({
        profile: { codeforcesVerification: { status: 'verified', handle, verifiedAt: now } },
      }),
    };
  });
  const result = await checkCodeforcesVerification(userId, now, async () => ({
    ok: true,
    json: async () => ({ status: 'OK', result: [{ handle, firstName: token, organization: 'irrelevant' }] }),
  }));
  assert.equal(result.verification.status, 'verified');
  assert.equal(result.verification.handle, handle);
  assert.equal(updateFilter['profile.codeforcesVerification.normalizedHandle'], handle.toLowerCase());
  assert.equal(updateFilter['profile.codeforcesVerification.tokenHash'], tokenHash);
});

test('expired pending tokens are cleared without calling the Codeforces API', async t => {
  const now = new Date('2027-01-01T00:15:00Z');
  const pending = {
    _id: userId,
    profile: { codeforcesVerification: {
      status: 'pending',
      handle,
      normalizedHandle: handle.toLowerCase(),
      tokenHash: hashVerificationToken('expired-token'),
      expiresAt: new Date(now.getTime() - 1),
    } },
  };
  t.mock.method(User, 'findById', () => verificationQuery(pending));
  let clearFilter;
  t.mock.method(User, 'findOneAndUpdate', filter => {
    clearFilter = filter;
    return { lean: async () => null };
  });
  const result = await checkCodeforcesVerification(userId, now, async () => {
    throw new Error('Expired tokens must not call Codeforces.');
  });
  assert.equal(result.verification.status, 'expired');
  assert.equal(clearFilter.$or[0]['profile.codeforcesVerification.expiresAt'].$lte.getTime(), now.getTime());
});

test('a verified user can replace their Codeforces handle and the new token is stored as a hash', async t => {
  const now = new Date('2027-01-01T00:00:00Z');
  t.mock.method(User, 'updateMany', async () => ({}));
  t.mock.method(User, 'findOne', () => ({
    select() {
      return { lean: async () => null };
    },
  }));
  t.mock.method(User, 'findById', () => verificationQuery({
    _id: userId,
    profile: { codeforcesVerification: {
      status: 'verified',
      handle: 'PreviousHandle',
      normalizedHandle: 'previoushandle',
      verifiedAt: new Date('2026-01-01T00:00:00Z'),
    } },
  }));
  let update;
  t.mock.method(User, 'findByIdAndUpdate', (_id, changes) => {
    update = changes;
    return {
      lean: async () => ({
        profile: { codeforcesVerification: {
          handle: changes.$set['profile.codeforcesVerification.handle'],
          status: changes.$set['profile.codeforcesVerification.status'],
          expiresAt: changes.$set['profile.codeforcesVerification.expiresAt'],
        } },
      }),
    };
  });

  const result = await generateCodeforcesVerification(userId, handle, now, async () => ({
    ok: true,
    json: async () => ({ status: 'OK', result: [{ handle }] }),
  }));
  const saved = update.$set['profile.codeforcesVerification.tokenHash'];
  assert.equal(result.verification.status, 'pending');
  assert.match(result.token, /^[A-Z0-9]{10}$/);
  assert.equal(saved, hashVerificationToken(result.token));
  assert.notEqual(saved, result.token);
  assert.equal(update.$set['profile.codeforcesVerification.normalizedHandle'], handle.toLowerCase());
  assert.equal(result.verification.expiresAt.getTime(), now.getTime() + 15 * 60 * 1000);
});

test('token generation rejects a Codeforces handle already reserved by another account', async t => {
  t.mock.method(User, 'updateMany', async () => ({}));
  t.mock.method(User, 'findOne', () => ({
    select() {
      return { lean: async () => ({ _id: '507f1f77bcf86cd799439012' }) };
    },
  }));
  await assert.rejects(
    generateCodeforcesVerification(userId, handle, new Date(), async () => ({
      ok: true,
      json: async () => ({ status: 'OK', result: [{ handle }] }),
    })),
    error => error.status === 409 && error.code === 'CODEFORCES_HANDLE_IN_USE',
  );
});

test('Codeforces lookup failures are reported without exposing provider response details', async () => {
  await assert.rejects(
    fetchCodeforcesUser(handle, async () => { throw new Error('private upstream failure'); }),
    error => error.status === 503 && error.code === 'CODEFORCES_UNAVAILABLE' && !error.message.includes('private upstream'),
  );
});
