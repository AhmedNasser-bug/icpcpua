import test from 'node:test';
import assert from 'node:assert/strict';
import { getRoadmapLeaderboardEntries, getSolvedProblemCounts } from '../src/repositories/roadmapRepository.js';
import { addSolvedProblemCounts, mergeLeaderboardEntries, rankLeaderboard } from '../src/utils/leaderboard.js';

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

test('leaderboard includes solved problem totals without affecting point-based ranks', () => {
  const entries = [
    { userId: 'user-a', name: 'Ari', points: 40, eventsAttended: 3 },
    { userId: 'user-b', name: 'Bea', points: 20, eventsAttended: 1 },
  ];
  const withCounts = addSolvedProblemCounts(entries, [
    { userId: 'user-a', problemsSolved: 5 },
  ]);

  assert.deepEqual(rankLeaderboard(withCounts).map(({ rank, problemsSolved }) => ({ rank, problemsSolved })), [
    { rank: 1, problemsSolved: 5 },
    { rank: 2, problemsSolved: 0 },
  ]);
});

test('solved problem aggregation counts each problem URL once per user', () => {
  const pipeline = getSolvedProblemCounts().pipeline();
  assert.ok(pipeline.some((stage) => stage.$match?.['user.profile.privacy.profileVisible']?.$ne === false));
  assert.ok(pipeline.some((stage) => stage.$match?.['user.profile.privacy.leaderboardVisible']?.$ne === false));
  assert.ok(pipeline.some((stage) => stage.$group?.problemUrls?.$addToSet === '$solvedProblems.problemUrl'));
  assert.ok(pipeline.some((stage) => stage.$project?.problemsSolved?.$size === '$problemUrls'));
});

test('roadmap leaderboard excludes users who opted out and includes profile avatars', () => {
  const pipeline = getRoadmapLeaderboardEntries().pipeline();
  assert.ok(pipeline.some((stage) => stage.$match?.['user.profile.privacy.profileVisible']?.$ne === false));
  assert.ok(pipeline.some((stage) => stage.$match?.['user.profile.privacy.leaderboardVisible']?.$ne === false));
  assert.ok(pipeline.some((stage) => stage.$project?.avatarUrl === '$user.profile.pictureUrl'));
});
