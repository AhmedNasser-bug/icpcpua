import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

process.env.JWT_SECRET ||= 'google-auth-test-secret-that-is-long-enough';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/google-auth-tests';
process.env.GOOGLE_CLIENT_ID = 'google-client-id.apps.googleusercontent.com';

const {
  authenticateUser,
  authenticateWithGoogle,
  changePassword,
} = await import('../src/services/authService.js');
const { OAuth2Client } = await import('google-auth-library');
const { default: app } = await import('../src/app.js');

const validPayload = {
  sub: 'google-subject-123',
  email: 'student@example.test',
  email_verified: true,
  name: 'Google Student',
  picture: 'https://lh3.googleusercontent.com/profile-picture',
};

function mockGoogleVerification(t, payload) {
  let receivedOptions;
  t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async (options) => {
    receivedOptions = options;
    return { getPayload: () => payload };
  });
  return () => receivedOptions;
}

test('Google authentication verifies the configured audience and creates a student account', async (t) => {
  const getOptions = mockGoogleVerification(t, validPayload);
  const createdUsers = [];
  t.mock.method(User, 'findOne', async () => null);
  t.mock.method(User, 'findOneAndUpdate', async () => null);
  t.mock.method(User, 'create', async (data) => {
    createdUsers.push(data);
    return { id: 'new-user-id', ...data };
  });

  const user = await authenticateWithGoogle('header.payload.signature');

  assert.deepEqual(getOptions(), {
    idToken: 'header.payload.signature',
    audience: 'google-client-id.apps.googleusercontent.com',
  });
  assert.equal(user.email, validPayload.email);
  assert.equal(user.googleId, validPayload.sub);
  assert.equal(user.profile.pictureUrl, validPayload.picture);
  assert.equal(user.role, 'user');
  assert.equal(user.passwordHash, undefined);
  assert.equal(createdUsers.length, 1);
  assert.equal(createdUsers[0].role, 'user');
  assert.equal(createdUsers[0].passwordHash, undefined);
});

test('Google authentication rejects unverified email before accessing accounts', async (t) => {
  mockGoogleVerification(t, { ...validPayload, email_verified: false });
  const findOne = t.mock.method(User, 'findOne', async () => null);

  await assert.rejects(authenticateWithGoogle('header.payload.signature'), {
    status: 403,
    message: 'Verify your Google email address before signing in.',
  });
  assert.equal(findOne.mock.callCount(), 0);
});

test('Google authentication preserves an existing account role when linking by verified email', async (t) => {
  mockGoogleVerification(t, validPayload);
  const existingUser = {
    id: 'existing-admin-id',
    email: validPayload.email,
    googleId: validPayload.sub,
    role: 'admin',
    passwordHash: 'existing-password-hash',
    profile: { pictureUrl: 'https://example.test/existing-picture.png' },
  };
  t.mock.method(User, 'findOne', async () => null);
  const linkAccount = t.mock.method(User, 'findOneAndUpdate', async () => existingUser);
  const createUser = t.mock.method(User, 'create', async () => {
    throw new Error('Existing account must not be duplicated.');
  });

  const user = await authenticateWithGoogle('header.payload.signature');

  assert.equal(user, existingUser);
  assert.equal(user.role, 'admin');
  assert.equal(user.passwordHash, 'existing-password-hash');
  assert.equal(linkAccount.mock.callCount(), 1);
  assert.equal(createUser.mock.callCount(), 0);
});

test('Google-only accounts cannot authenticate with an email password', async (t) => {
  t.mock.method(User, 'findOne', () => ({
    select: async () => ({ email: validPayload.email, role: 'user' }),
  }));
  assert.equal(await authenticateUser(validPayload.email, 'password'), null);
});

test('email and password authentication still works for linked accounts', async (t) => {
  const user = {
    id: 'existing-user-id',
    email: validPayload.email,
    role: 'user',
    passwordHash: await bcrypt.hash('correct-password', 4),
  };
  t.mock.method(User, 'findOne', () => ({
    select: async () => user,
  }));
  assert.equal(await authenticateUser(validPayload.email, 'correct-password'), user);
});

test('Google-only accounts cannot change a password without an existing password credential', async (t) => {
  t.mock.method(User, 'findById', () => ({
    select: async () => ({ id: 'google-user-id', passwordHash: undefined }),
  }));
  assert.equal(await changePassword('google-user-id', 'current-password', 'new-password'), 'incorrect');
});

test('Google verification failures return a sanitized authentication error', async (t) => {
  t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => {
    throw new Error('invalid token contents must not be returned');
  });

  await assert.rejects(authenticateWithGoogle('header.payload.signature'), {
    status: 401,
    message: 'The Google sign-in token is invalid or expired.',
  });
});

test('Google auth endpoint validates its token request body', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'invalid' }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.message, 'Request validation failed.');
});

test('Google auth endpoint returns the existing JWT and user response shape', async (t) => {
  mockGoogleVerification(t, validPayload);
  t.mock.method(User, 'findOne', async () => null);
  t.mock.method(User, 'findOneAndUpdate', async () => null);
  t.mock.method(User, 'create', async (data) => ({
    id: 'google-user-id',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    profile: {},
    notificationPreferences: {},
    ...data,
  }));
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'header.payload.signature' }),
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(result).sort(), ['token', 'user']);
  assert.equal(jwt.verify(result.token, process.env.JWT_SECRET).sub, 'google-user-id');
  assert.equal(result.user.id, 'google-user-id');
  assert.equal(result.user.email, validPayload.email);
  assert.equal(result.user.role, 'user');
  assert.equal(result.user.googleId, undefined);
  assert.equal(result.user.passwordHash, undefined);
});

test('Google-only user documents validate without a password hash and default to student role', () => {
  const user = new User({
    name: 'Google Student',
    email: validPayload.email,
    googleId: validPayload.sub,
  });
  assert.equal(user.validateSync(), undefined);
  assert.equal(user.role, 'user');
  assert.equal(user.passwordHash, undefined);
});
