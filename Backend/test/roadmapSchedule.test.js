import test from 'node:test';
import assert from 'node:assert/strict';
import RoadmapEnrollment from '../src/models/RoadmapEnrollment.js';
import RoadmapAttendance from '../src/models/RoadmapAttendance.js';
import { generateSessionSchedule } from '../src/utils/roadmapSchedule.js';
import { validateCycleInput, validateRoadmapInput } from '../src/utils/roadmapValidation.js';

const baseCycle = {
  startDate: '2027-01-04',
  endDate: '2027-02-28',
  sessionsPerWeek: 2,
  trainingDays: [1, 4],
  startTime: '18:30',
  sessionDurationMinutes: 120,
  timeZone: 'Africa/Cairo',
  registrationOpensAt: '2026-12-01T00:00:00.000Z',
  registrationClosesAt: '2027-01-03T23:59:59.000Z',
};

test('roadmap schedule generates actual dates and the expected eight-week session count', () => {
  const sessions = generateSessionSchedule(baseCycle);

  assert.equal(sessions.length, 16);
  assert.equal(sessions[0].ordinal, 1);
  assert.equal(sessions[0].title, 'Session 1');
  assert.equal(sessions[0].startsAt.toISOString(), '2027-01-04T16:30:00.000Z');
  assert.equal(sessions[15].ordinal, 16);
  assert.equal(sessions.every((session) => session.endsAt - session.startsAt === 120 * 60_000), true);
});

test('roadmap schedule handles partial weeks and one session per selected weekday', () => {
  const sessions = generateSessionSchedule({
    ...baseCycle,
    startDate: '2027-01-05',
    endDate: '2027-01-11',
    sessionsPerWeek: 3,
    trainingDays: [2, 4, 0],
    timeZone: 'UTC',
  });

  assert.deepEqual(sessions.map(({ startsAt }) => startsAt.toISOString().slice(0, 10)), [
    '2027-01-05',
    '2027-01-07',
    '2027-01-10',
  ]);
});

test('roadmap schedule respects daylight-saving time while keeping configured local start time', () => {
  const sessions = generateSessionSchedule({
    ...baseCycle,
    startDate: '2027-03-22',
    endDate: '2027-03-29',
    sessionsPerWeek: 1,
    trainingDays: [1],
    startTime: '18:30',
    timeZone: 'Europe/London',
  });

  assert.equal(sessions[0].startsAt.toISOString(), '2027-03-22T18:30:00.000Z');
  assert.equal(sessions[1].startsAt.toISOString(), '2027-03-29T17:30:00.000Z');
});

test('roadmap schedule rejects invalid ranges, frequencies, weekdays, and nonexistent local times', () => {
  assert.throws(() => generateSessionSchedule({ ...baseCycle, endDate: '2027-01-03' }), /endDate must be on or after/);
  assert.throws(() => generateSessionSchedule({ ...baseCycle, trainingDays: [1] }), /must match sessionsPerWeek/);
  assert.throws(() => generateSessionSchedule({ ...baseCycle, trainingDays: [1, 1] }), /unique weekdays/);
  assert.throws(() => generateSessionSchedule({
    ...baseCycle,
    startDate: '2027-03-28',
    endDate: '2027-03-28',
    sessionsPerWeek: 1,
    trainingDays: [0],
    startTime: '01:30',
    timeZone: 'Europe/London',
  }), /local session time does not exist/);
});

test('roadmap and cycle validators reject unsupported values and malformed URLs', () => {
  assert.equal(validateRoadmapInput({ title: '  Graphs  ', description: 'Path', status: 'draft' }).title, 'Graphs');
  assert.throws(() => validateRoadmapInput({ title: 'Path', description: 'Details', coverImageUrl: 'javascript:alert(1)' }), /valid HTTP or HTTPS URL/);
  assert.throws(() => validateCycleInput({ ...baseCycle, order: 1, title: 'Beginner', description: 'Details', difficulty: 'expert' }), /difficulty must be/);
  assert.throws(() => validateCycleInput({ ...baseCycle, order: 1, title: 'Beginner', description: 'Details', difficulty: 'beginner', trainingDays: [1] }), /must match sessionsPerWeek/);
});

test('enrollment and session attendance enforce unique student-cycle and student-session relationships', () => {
  assert.ok(RoadmapEnrollment.schema.indexes().some(([keys, options]) => (
    keys.cycle === 1 && keys.student === 1 && options.unique === true
  )));
  assert.ok(RoadmapAttendance.schema.indexes().some(([keys, options]) => (
    keys.session === 1 && keys.student === 1 && options.unique === true
  )));
});
