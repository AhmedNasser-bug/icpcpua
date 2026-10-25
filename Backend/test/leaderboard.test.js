import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeLeaderboardEntries, rankLeaderboard } from '../src/utils/leaderboard.js';

test('leaderboard assigns dense ranks for tied points with stable display ordering', () => {
  const ranked = rankLeaderboard([
    { name: 'Ari', points: 40, eventsAttended: 4, userId: 'user-a' },
    { name: 'Bea', points: 40, eventsAttended: 2, userId: 'user-b' },
    { name: 'Cy', points: 25, eventsAttended: 3, userId: 'user-c' },
    { name: 'Dee', points: 10, eventsAttended: 1, userId: 'user-d' },
  ]);

  assert.deepEqual(ranked.map(({ rank }) => rank), [1, 1, 2, 3]);
  assert.deepEqual(ranked.map(({ name }) => name), ['Ari', 'Bea', 'Cy', 'Dee']);
});

test('leaderboard returns no entries when no attendance points have been awarded', () => {
  assert.deepEqual(rankLeaderboard([]), []);
});

test('leaderboard combines roadmap points without changing event attendance counts', () => {
  const combined = mergeLeaderboardEntries(
    [{ userId: 'user-a', name: 'Ari', username: 'ari', points: 20, eventsAttended: 2 }],
    [
      { userId: 'user-a', name: 'Ari', username: 'ari', points: 15, sessionsAttended: 3 },
      { userId: 'user-b', name: 'Bea', username: 'bea', points: 8, sessionsAttended: 2 },
    ],
  );

  assert.deepEqual(combined.map(({ userId, points, eventsAttended, sessionsAttended }) => (
    { userId, points, eventsAttended, sessionsAttended }
  )), [
    { userId: 'user-a', points: 35, eventsAttended: 2, sessionsAttended: 3 },
    { userId: 'user-b', points: 8, eventsAttended: 0, sessionsAttended: 2 },
  ]);
});
