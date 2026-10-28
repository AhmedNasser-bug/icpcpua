import test from 'node:test';
import assert from 'node:assert/strict';
import RoadmapProgress from '../src/models/RoadmapProgress.js';
import { validateRoadmapProgressInput } from '../src/utils/roadmapValidation.js';

test('roadmap progress validation accepts a student problem state change', () => {
  const input = {
    nodeId: '64b000000000000000000001',
    problemUrl: 'https://example.com/problem',
    solved: true,
  };

  assert.deepEqual(validateRoadmapProgressInput(input), input);
  assert.throws(() => validateRoadmapProgressInput({ ...input, solved: 'yes' }), /solved must be a boolean/);
  assert.throws(() => validateRoadmapProgressInput({ ...input, problemUrl: 'javascript:alert(1)' }), /valid HTTP or HTTPS URL/);
});

test('roadmap progress has a unique per-student roadmap record', () => {
  assert.ok(RoadmapProgress.schema.indexes().some(([keys, options]) => (
    keys.roadmap === 1 && keys.student === 1 && options.unique
  )));
});
