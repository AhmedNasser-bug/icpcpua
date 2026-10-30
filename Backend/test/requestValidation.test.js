import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../src/middleware/errors.js';
import { validate } from '../src/middleware/validate.js';
import * as authValidation from '../src/validation/auth.validation.js';
import * as adminValidation from '../src/validation/admin.validation.js';
import * as eventValidation from '../src/validation/events.validation.js';
import * as notificationValidation from '../src/validation/notifications.validation.js';
import * as roadmapValidation from '../src/validation/roadmaps.validation.js';

const validEvent = {
  title: 'Contest Night',
  description: 'Solve problems together.',
  category: 'Contest',
  startsAt: '2027-01-01T10:00:00.000Z',
  endsAt: '2027-01-01T12:00:00.000Z',
  mode: 'online',
};

function runValidation(middleware, req) {
  let nextCalled = false;
  let response;
  const res = {
    status(code) {
      response = { status: code };
      return this;
    },
    json(body) {
      response.body = body;
      return this;
    },
  };
  middleware(req, res, (error) => {
    nextCalled = true;
    if (error) throw error;
  });
  return { nextCalled, response, req };
}

test('validation middleware stores normalized values without replacing Express request properties', () => {
  const body = { ...validEvent, title: '  Contest Night  ' };
  const params = { eventId: '507f1f77bcf86cd799439011' };
  const query = { status: 'past', q: '  finals  ' };
  const req = { body, params, query };
  const result = runValidation(validate({
    body: adminValidation.eventCreate.body,
    params: eventValidation.eventDetails.params,
    query: eventValidation.list.query,
  }), req);

  assert.equal(result.nextCalled, true);
  assert.equal(req.body, body);
  assert.equal(req.params, params);
  assert.equal(req.query, query);
  assert.equal(req.validated.body.title, 'Contest Night');
  assert.equal(req.validated.params.eventId, params.eventId);
  assert.equal(req.validated.query.q, 'finals');
});

test('middleware rejects invalid input before the controller with field-level errors', () => {
  const result = runValidation(validate(adminValidation.eventCreate), { body: { ...validEvent, title: '' } });
  assert.equal(result.nextCalled, false);
  assert.equal(result.response.status, 400);
  assert.equal(result.response.body.error.message, 'Request validation failed.');
  assert.equal(result.response.body.error.fields[0].field, 'title');
});

test('event schemas reject missing fields, unknown fields, invalid queries, and malformed IDs', () => {
  assert.throws(() => adminValidation.eventCreate.body({ title: 'Missing fields' }), /description is required/);
  assert.throws(() => adminValidation.eventCreate.body({ ...validEvent, isAdmin: true }), /Unexpected field/);
  assert.throws(() => eventValidation.list.query({ status: 'future' }), /status must be upcoming or past/);
  assert.equal(eventValidation.eventDetails.params({ eventId: 'icpc-orientation' }).eventId, 'icpc-orientation');
  assert.throws(() => eventValidation.eventDetails.params({ eventId: 'invalid slug' }), /valid identifier or event slug/);
  assert.throws(() => eventValidation.checkInDetails.params({ eventId: 'icpc-orientation' }), /valid identifier/);
});

test('auth schemas validate credentials, strict fields, aliases, and partial profile updates', () => {
  const registered = authValidation.register.body({
    name: ' Student ',
    email: 'STUDENT@example.com',
    password: 'long-password',
    userName: 'Coder_42',
  });
  assert.equal(registered.name, 'Student');
  assert.equal(registered.email, 'student@example.com');
  assert.equal(registered.username, 'coder_42');
  assert.throws(() => authValidation.login.body({ email: 'bad', password: 'x' }), /valid email/);
  assert.throws(() => authValidation.studentId.body({ studentId: '123', extra: true }), /Unexpected field/);
  assert.deepEqual(authValidation.profile.body({ bio: '  hello  ' }), { bio: 'hello' });
});

test('Google auth schema accepts only a bounded ID token', () => {
  const idToken = `${'a'.repeat(20)}.${'b'.repeat(20)}.${'c'.repeat(20)}`;
  assert.deepEqual(authValidation.google.body({ idToken }), { idToken });
  assert.throws(() => authValidation.google.body({ idToken: 'not-a-token' }), /valid Google ID token/);
  assert.throws(() => authValidation.google.body({ idToken, email: 'student@example.test' }), /Unexpected field/);
});

test('notification and roadmap schemas validate filters, tokens, IDs, and progress partials', () => {
  assert.deepEqual(notificationValidation.list.query({ filter: 'unread' }), { filter: 'unread' });
  assert.throws(() => notificationValidation.list.query({ filter: 'other' }), /all or unread/);
  assert.throws(() => notificationValidation.markRead.params({ notificationId: 'bad' }), /valid identifier/);
  assert.throws(() => roadmapValidation.sessionCheckInDetails.query({ token: 'bad' }), /valid check-in token/);
  assert.throws(() => roadmapValidation.roadmapSlug.params({ roadmapSlug: 'bad slug' }), /valid slug/);
  assert.deepEqual(roadmapValidation.roadmapUpdate.body({ status: 'completed' }), { status: 'completed' });
});

test('admin schemas validate cycle, session, and attendance requests', () => {
  const id = '507f1f77bcf86cd799439011';
  assert.equal(adminValidation.cycleUpdate.params({ cycleId: id }).cycleId, id);
  assert.throws(() => adminValidation.sessionUpdate.params({ sessionId: 'invalid' }), /valid identifier/);
  assert.throws(() => adminValidation.attendanceCreate.body({ studentId: id, ignored: true }), /Unexpected field/);
  assert.throws(() => adminValidation.pointsReverse.body({ reason: 'x'.repeat(301) }), /300 characters/);
});

test('no-body action schemas reject unexpected fields while allowing an omitted body', () => {
  assert.deepEqual(eventValidation.eventAction.body(undefined), {});
  assert.throws(() => eventValidation.eventAction.body({ unexpected: true }), /Unexpected field/);
  assert.deepEqual(roadmapValidation.emptyAction.body(undefined), {});
});

test('body parser errors return sanitized client errors', () => {
  let response;
  const res = {
    status(code) {
      response = { status: code };
      return this;
    },
    json(body) {
      response.body = body;
      return this;
    },
  };

  errorHandler({ type: 'entity.parse.failed', message: 'secret parser detail' }, {}, res, () => {});
  assert.equal(response.status, 400);
  assert.equal(response.body.error.fields[0].field, 'body');
  assert.doesNotMatch(JSON.stringify(response.body), /secret parser detail/);

  errorHandler({ type: 'entity.too.large', message: 'internal size detail' }, {}, res, () => {});
  assert.equal(response.status, 413);
  assert.doesNotMatch(JSON.stringify(response.body), /internal size detail/);
});
