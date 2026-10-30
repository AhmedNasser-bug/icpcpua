import test from 'node:test';
import assert from 'node:assert/strict';
import RoadmapProgress from '../src/models/RoadmapProgress.js';
import { validateRoadmapProgressInput } from '../src/utils/roadmapValidation.js';
import {
  areRoadmapPrerequisitesComplete,
  hasSolvedRoadmapProgressForNode,
  removesSolvedRoadmapProblems,
} from '../src/utils/roadmapGraph.js';

const prerequisite = '64b000000000000000000010';
const dependent = '64b000000000000000000011';

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

test('student can solve problems only after all prerequisite problems are complete', () => {
  const nodes = [
    { _id: prerequisite, dependencies: [], problems: [{ url: 'https://example.com/one' }, { url: 'https://example.com/two' }] },
    { _id: dependent, dependencies: [prerequisite], problems: [{ url: 'https://example.com/next' }] },
  ];

  assert.equal(areRoadmapPrerequisitesComplete(nodes[1], nodes, new Set()), false);
  assert.equal(areRoadmapPrerequisitesComplete(nodes[1], nodes, new Set([
    `${prerequisite}\u0000https://example.com/one`,
  ])), false);
  assert.equal(areRoadmapPrerequisitesComplete(nodes[1], nodes, new Set([
    `${prerequisite}\u0000https://example.com/one`,
    `${prerequisite}\u0000https://example.com/two`,
  ])), true);
});

test('zero-problem prerequisites are complete without percentage or division calculations', () => {
  const nodes = [
    { _id: prerequisite, dependencies: [], problems: [] },
    { _id: dependent, dependencies: [prerequisite], problems: [{ url: 'https://example.com/next' }] },
  ];

  assert.equal(areRoadmapPrerequisitesComplete(nodes[1], nodes, new Set()), true);
});

test('missing prerequisite references fail closed', () => {
  const node = { _id: dependent, dependencies: ['64b000000000000000000012'], problems: [] };
  assert.equal(areRoadmapPrerequisitesComplete(node, [node], new Set()), false);
  assert.equal(areRoadmapPrerequisitesComplete({ ...node, dependencies: [null] }, [node], new Set()), false);
});

test('roadmap structural updates cannot remove solved problem progress or its topic', () => {
  const progress = [{
    solvedProblems: [
      { node: prerequisite, problemUrl: 'https://example.com/solved' },
      { node: dependent, problemUrl: 'https://example.com/other' },
    ],
  }];
  assert.equal(hasSolvedRoadmapProgressForNode(progress, prerequisite), true);
  assert.equal(removesSolvedRoadmapProblems(progress, prerequisite, []), true);
  assert.equal(removesSolvedRoadmapProblems(progress, prerequisite, [
    { title: 'Renamed problem', url: 'https://example.com/solved' },
  ]), false);
  assert.equal(hasSolvedRoadmapProgressForNode(progress, '64b000000000000000000012'), false);
});
