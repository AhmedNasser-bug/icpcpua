import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../src/models/User.js';
import Notification from '../src/models/Notification.js';
import { getLeaderboardEntries } from '../src/repositories/registrationRepository.js';
import { markUserNotificationRead } from '../src/repositories/notificationRepository.js';
import { updateStudentProfile } from '../src/repositories/userRepository.js';
import { applyPublicProfilePrivacy } from '../src/utils/profilePrivacy.js';
import { validateNotificationPreferencesInput, validateProfilePrivacyInput, validateStudentProfileInput } from '../src/utils/validation.js';
import { notificationCategoryForEvent } from '../src/services/notificationService.js';

test('student profile accepts an empty optional profile and legacy account data', () => {
  assert.deepEqual(validateStudentProfileInput({}), {});
  const legacyUser = new User({ name: 'A Student', email: 'student@example.test', passwordHash: 'hash' });
  assert.ok(legacyUser.profile);
  assert.equal(legacyUser.profile.privacy.profileVisible, true);
  assert.equal(legacyUser.validateSync(), undefined);
});

test('student profile accepts gradual partial updates without external links', () => {
  const result = validateStudentProfileInput({ university: 'PUA', trainingTopics: ['Graphs'] });
  assert.deepEqual(result, { university: 'PUA', trainingTopics: ['Graphs'] });
  assert.deepEqual(validateStudentProfileInput({}), {});
});

test('student profile allows explicitly clearing optional fields', () => {
  const result = validateStudentProfileInput({
    pictureUrl: '',
    graduationYear: '',
    externalProfiles: { githubUrl: '', codeforcesHandle: '' },
    cpStats: { problemsSolved: '' },
    trainingGoals: [],
  });
  assert.equal(result.pictureUrl, '');
  assert.equal(result.graduationYear, null);
  assert.deepEqual(result.externalProfiles, { githubUrl: '', codeforcesHandle: '' });
  assert.deepEqual(result.cpStats, { problemsSolved: null });
  assert.deepEqual(result.trainingGoals, []);
});

test('partial profile updates target only supplied paths and preserve other fields', () => {
  const query = updateStudentProfile('507f1f77bcf86cd799439011', {
    university: 'PUA',
    externalProfiles: { githubUrl: '' },
  });

  test('privacy updates target only the authenticated user profile paths', async () => {
    const { updateProfilePrivacy } = await import('../src/repositories/userRepository.js');
    const query = updateProfilePrivacy('507f1f77bcf86cd799439011', { externalProfilesVisible: false });
    assert.deepEqual(query.getUpdate(), { $set: { 'profile.privacy.externalProfilesVisible': false } });
  });
  assert.deepEqual(query.getUpdate(), {
    $set: {
      'profile.university': 'PUA',
      'profile.externalProfiles.githubUrl': '',
    },
  });
});

test('student profile validates supplied external URLs and rejects unsafe schemes', () => {
  assert.equal(validateStudentProfileInput({ externalProfiles: { githubUrl: 'https://github.com/student' } }).externalProfiles.githubUrl, 'https://github.com/student');
  assert.throws(() => validateStudentProfileInput({ externalProfiles: { linkedinUrl: 'not a URL' } }), /valid HTTP or HTTPS URL/);
  assert.throws(() => validateStudentProfileInput({ pictureUrl: 'javascript:alert(1)' }), /valid HTTP or HTTPS URL/);
});

test('profile input does not accept private account fields or user-claimed verification flags', () => {
  assert.throws(() => validateStudentProfileInput({ email: 'private@example.test' }), /Unexpected field/);
  assert.throws(() => validateStudentProfileInput({ cpStats: { isVerified: true } }), /Unexpected field/);
});

test('privacy preferences are strictly boolean and only accept supported controls', () => {
  assert.deepEqual(validateProfilePrivacyInput({ profileVisible: false, trainingVisible: true, attendanceHistoryVisible: false }), {
    profileVisible: false,
    trainingVisible: true,
    attendanceHistoryVisible: false,
  });
  assert.throws(() => validateProfilePrivacyInput({ cpStatsVisible: 'false' }), /must be true or false/);
  assert.throws(() => validateProfilePrivacyInput({ exposeEmail: false }), /Unexpected privacy setting/);
});

test('notification preferences allow only implemented contest and event categories', () => {
  assert.deepEqual(validateNotificationPreferencesInput({ contestAnnouncements: false }), { contestAnnouncements: false });
  assert.throws(() => validateNotificationPreferencesInput({ teamInvitations: true }), /Unsupported notification preference/);
  assert.deepEqual(notificationCategoryForEvent({ category: 'ICPC Contest' }), {
    category: 'contest_announcement',
    preference: 'contestAnnouncements',
  });
  assert.deepEqual(notificationCategoryForEvent({ category: 'Training' }), {
    category: 'icpc_event',
    preference: 'icpcEvents',
  });
});

test('notifications are unique per student and publication event and reads are owner-scoped', () => {
  assert.ok(Notification.schema.indexes().some(([keys, options]) => (
    keys.user === 1 && keys.sourceKey === 1 && options.unique === true
  )));
  const userId = '507f1f77bcf86cd799439011';
  const notificationId = '507f191e810c19729de860ea';
  assert.deepEqual(markUserNotificationRead(userId, notificationId).getFilter(), {
    _id: notificationId,
    user: userId,
  });
});

test('public profile privacy removes disabled sections and hides private profiles', () => {
  const source = {
    bio: 'Hello',
    externalProfiles: { githubUrl: 'https://github.com/example' },
    cpStats: { problemsSolved: 100 },
    trainingGoals: ['Graphs'],
    teamStatus: 'looking',
    teamPreferences: { preferredLanguage: 'C++' },
    icpcJourney: [{ contestName: 'Regional' }],
    privacy: { externalProfilesVisible: false, teamStatusVisible: false, journeyVisible: false },
  };
  const result = applyPublicProfilePrivacy(source);
  assert.equal(result.profile.externalProfiles, undefined);
  assert.equal(result.profile.teamStatus, undefined);
  assert.equal(result.profile.teamPreferences, undefined);
  assert.equal(result.profile.icpcJourney, undefined);
  assert.equal(result.attendanceHistoryVisible, false);
  assert.deepEqual(result.profile.cpStats, { problemsSolved: 100 });
  assert.equal(result.profile.privacy, undefined);
  assert.equal(applyPublicProfilePrivacy({ privacy: { profileVisible: false } }), null);
  assert.equal(applyPublicProfilePrivacy({ trainingGoals: ['Graphs'] }).profile.trainingGoals[0], 'Graphs');
});

test('attendance history privacy does not hide legacy ICPC journey profile data', () => {
  const result = applyPublicProfilePrivacy({
    icpcJourney: [{ contestName: 'Regional' }],
    privacy: { attendanceHistoryVisible: false },
  });
  assert.deepEqual(result.profile.icpcJourney, [{ contestName: 'Regional' }]);
  assert.equal(result.attendanceHistoryVisible, false);
});

test('private profiles are excluded from the public leaderboard aggregation', () => {
  const pipeline = getLeaderboardEntries().pipeline();
  assert.ok(pipeline.some((stage) => stage.$match?.['user.profile.privacy.profileVisible']?.$ne === false));
});

test('profile update requires authentication', async () => {
  process.env.JWT_SECRET ||= 'test-profile-route-secret-that-is-long-enough';
  process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/profile-tests';
  const { default: app } = await import('../src/app.js');
  const server = app.listen(0);
  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const { port } = server.address();
    for (const path of ['/api/auth/profile', '/api/auth/privacy', '/api/auth/notification-preferences']) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: 'Should not be saved without a session.' }),
      });
      assert.equal(response.status, 401);
    }
    const notifications = await fetch(`http://127.0.0.1:${port}/api/notifications`);
    assert.equal(notifications.status, 401);
    for (const [path, method] of [
      ['/api/roadmaps/my', 'GET'],
      ['/api/roadmaps/cycles/507f1f77bcf86cd799439011/enroll', 'POST'],
      ['/api/admin/roadmaps', 'GET'],
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, { method });
      assert.equal(response.status, 401);
    }
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
