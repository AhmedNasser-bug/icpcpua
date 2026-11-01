import test from 'node:test';
import assert from 'node:assert/strict';
import { handleSparkRequest, resetSparkStoreForTests } from '../src/shared/services/sparkAdapter.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear(),
};

test('Spark Adapter Contract Tests — Full 31-Route Coverage', async t => {
  resetSparkStoreForTests();

  const ROADMAP_SLUG = 'level-0-37e4fa';

  await t.test('1. Seeded Curriculum & Events load from Atlas export fixture', async () => {
    const { roadmaps } = await handleSparkRequest('/roadmaps');
    assert.ok(roadmaps.length >= 1, 'Expected at least 1 roadmap from seedFixture.json');
    assert.equal(roadmaps[0].slug, ROADMAP_SLUG);
    assert.equal(roadmaps[0].title, 'Level 1');

    const { roadmap } = await handleSparkRequest(`/roadmaps/${ROADMAP_SLUG}`);
    assert.equal(roadmap.nodes.length, 8);

    const { events } = await handleSparkRequest('/events');
    assert.ok(events.length >= 2, 'Expected at least 2 published events from seedFixture.json');
  });

  let studentToken = '';
  let adminToken = '';

  await t.test('2. Auth registration, duplicate username rejection, and studentId lock', async () => {
    const reg = await handleSparkRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Youssef Test',
        email: 'youssef@pua.edu.eg',
        username: 'youssef_icpc',
        password: 'password123',
      }),
    });
    assert.ok(reg.token);
    assert.equal(reg.user.username, 'youssef_icpc');
    assert.equal(reg.user.role, 'user');
    studentToken = reg.token;

    // Duplicate username should fail with 409
    await assert.rejects(
      () =>
        handleSparkRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Another User',
            email: 'other@pua.edu.eg',
            username: 'youssef_icpc',
            password: 'password123',
          }),
        }),
      err => err.status === 409 && err.field === 'username',
    );

    // One-time Student ID assignment
    const sidResult = await handleSparkRequest('/auth/student-id', {
      method: 'PUT',
      token: studentToken,
      body: JSON.stringify({ studentId: '20240199' }),
    });
    assert.equal(sidResult.user.studentId, '20240199');

    // Second attempt to change Student ID must fail with 409
    await assert.rejects(
      () =>
        handleSparkRequest('/auth/student-id', {
          method: 'PUT',
          token: studentToken,
          body: JSON.stringify({ studentId: '20240200' }),
        }),
      err => err.status === 409,
    );
  });

  await t.test('3. OAuth (Google & GitHub) sign-in bootstrap and username onboarding', async () => {
    const oauthRes = await handleSparkRequest('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({
        uid: 'github-uid-42',
        email: 'github_coder@pua.edu.eg',
        name: 'GitHub Coder',
        pictureUrl: 'https://avatars.githubusercontent.com/u/42',
        provider: 'github',
      }),
    });
    assert.ok(oauthRes.token);
    assert.equal(oauthRes.user.username, null, 'New OAuth user should require username onboarding');

    const onboarded = await handleSparkRequest('/auth/username', {
      method: 'PUT',
      token: oauthRes.token,
      body: JSON.stringify({ username: 'gh_coder42' }),
    });
    assert.equal(onboarded.user.username, 'gh_coder42');
  });

  await t.test('4. Self-reported Codeforces handle (unverified) & unlocked Student Dashboard', async () => {
    const cfRes = await handleSparkRequest('/auth/codeforces-verification/generate', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({ handle: 'tourist_pua' }),
    });
    assert.equal(cfRes.verification.handle, 'tourist_pua');
    assert.equal(cfRes.verification.status, 'unverified');

    const dashRes = await handleSparkRequest('/dashboard', { token: studentToken });
    assert.ok(dashRes.dashboard);
    assert.equal(typeof dashRes.dashboard.stats.points, 'number');
  });

  await t.test('5. Admin OAuth/login, Event creation, QR generation, Student registration, Check-in, Double Check-in rejection, and Leaderboard', async () => {
    const adminOAuth = await handleSparkRequest('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({
        uid: 'admin-uid-1',
        email: 'enjoyplayax@gmail.com',
        name: 'Admin Lead',
        provider: 'google',
      }),
    });
    adminToken = adminOAuth.token;
    assert.equal(adminOAuth.user.role, 'admin');

    // Create a live published event whose check-in window is open right now
    const now = Date.now();
    const { event: liveEvent } = await handleSparkRequest('/admin/events', {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({
        title: 'Live Spark Verification Contest',
        description: 'End-to-end QR check-in and leaderboard verification contest.',
        category: 'Contest',
        startsAt: new Date(now - 10 * 60 * 1000).toISOString(),
        endsAt: new Date(now + 120 * 60 * 1000).toISOString(),
        attendancePoints: 25,
        mode: 'offline',
        location: 'PUA Lab C-204',
        capacity: 50,
        status: 'published',
      }),
    });
    assert.equal(liveEvent.status, 'published');

    // Register student for the live event
    const regEvent = await handleSparkRequest(`/events/${liveEvent.id}/registrations`, {
      method: 'POST',
      token: studentToken,
    });
    assert.ok(regEvent.registration.ticketId.startsWith('TCK-'));

    // Admin generates QR code for event
    const qrRes = await handleSparkRequest(`/admin/events/${liveEvent.id}/check-in-qr`, {
      method: 'POST',
      token: adminToken,
    });
    assert.ok(qrRes.checkInUrl);
    assert.ok(qrRes.qrCodeDataUrl.startsWith('data:image/png;base64,'));
    const qrToken = new URL(qrRes.checkInUrl).searchParams.get('token');
    assert.ok(qrToken);

    // Student checks in using QR token
    const checkInRes = await handleSparkRequest(`/events/${liveEvent.id}/check-in`, {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({ token: qrToken }),
    });
    assert.equal(checkInRes.attendance.pointsAwarded, 25);

    // Double check-in must fail with 409
    await assert.rejects(
      () =>
        handleSparkRequest(`/events/${liveEvent.id}/check-in`, {
          method: 'POST',
          token: studentToken,
          body: JSON.stringify({ token: qrToken }),
        }),
      err => err.status === 409,
    );

    // Leaderboard reflects awarded points
    const { leaderboard } = await handleSparkRequest('/events/leaderboard');
    const rankedStudent = leaderboard.find(row => row.username === 'youssef_icpc');
    assert.ok(rankedStudent, 'Checked-in student must appear on the leaderboard');
    assert.equal(rankedStudent.points, 25);
  });

  await t.test('6. Roadmap Topic DAG progress & Training Cycle enrollment', async () => {
    const { roadmap } = await handleSparkRequest(`/roadmaps/${ROADMAP_SLUG}`, { token: studentToken });
    assert.equal(roadmap.nodes.length, 8);
    const firstNode = roadmap.nodes[0];
    const firstProblem = firstNode.problems[0];

    // Toggle problem solved
    const probRes = await handleSparkRequest(`/roadmaps/${ROADMAP_SLUG}/progress`, {
      method: 'PUT',
      token: studentToken,
      body: JSON.stringify({
        nodeId: firstNode.id,
        problemUrl: firstProblem.url,
        solved: true,
      }),
    });
    assert.equal(probRes.solvedProblems.length, 1);

    // Enroll in Level 1 training cycle
    const { cycles } = await handleSparkRequest(`/roadmaps/${ROADMAP_SLUG}/cycles`, { token: studentToken });
    assert.ok(cycles.length >= 1);
    const cycleId = cycles[0]._id;

    const enrollRes = await handleSparkRequest(`/roadmaps/${ROADMAP_SLUG}/cycles/${cycleId}/enroll`, {
      method: 'POST',
      token: studentToken,
    });
    assert.ok(enrollRes.enrollment);

    const cycleDetail = await handleSparkRequest(`/roadmaps/${ROADMAP_SLUG}/cycles/${cycleId}`, {
      token: studentToken,
    });
    assert.equal(cycleDetail.enrolled, true);
    assert.equal(cycleDetail.sessions.length, 15);
  });
});
