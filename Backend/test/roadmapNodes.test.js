import test from 'node:test';
import assert from 'node:assert/strict';
import RoadmapNode from '../src/models/RoadmapNode.js';
import { getRoadmapPublicationErrors, validateRoadmapNodeInput } from '../src/utils/roadmapValidation.js';
import { hasValidRoadmapNodeDependencyGraph } from '../src/utils/roadmapGraph.js';

const first = '64b000000000000000000001';
const second = '64b000000000000000000002';
const third = '64b000000000000000000003';

test('learning topic validation accepts multiple dependencies and safe resource links', () => {
  const topic = validateRoadmapNodeInput({
    title: 'Graph traversal',
    dependencies: [first, second],
    resources: [{ title: 'Guide', url: 'https://example.com/graphs' }],
    problems: [{ title: 'Practice', url: 'https://example.com/problems' }],
    isRequired: false,
  });

  assert.deepEqual(topic.dependencies, [first, second]);
  assert.equal(topic.resources[0].title, 'Guide');
  assert.equal(topic.problems[0].difficulty, 'medium');
  assert.equal(topic.isRequired, false);
  assert.throws(() => validateRoadmapNodeInput({
    title: 'Unsafe',
    resources: [{ title: 'Script', url: 'javascript:alert(1)' }],
  }), /valid HTTP or HTTPS URL/);
  assert.throws(() => validateRoadmapNodeInput({ title: 'Invalid', dependencies: ['not-an-object-id'] }), /valid learning topic IDs/);
});

test('learning topic problems accept supported difficulties and reject unknown values', () => {
  const topic = validateRoadmapNodeInput({
    title: 'Sorting',
    problems: [
      { title: 'Intro', url: 'https://example.com/easy', difficulty: 'easy' },
      { title: 'Advanced', url: 'https://example.com/hard', difficulty: 'hard' },
    ],
  });

  assert.deepEqual(topic.problems.map(({ difficulty }) => difficulty), ['easy', 'hard']);
  assert.throws(() => validateRoadmapNodeInput({
    title: 'Invalid',
    problems: [{ title: 'Practice', url: 'https://example.com', difficulty: 'expert' }],
  }), /difficulty must be easy, medium, or hard/);
});

test('learning topic dependency graph permits branches but rejects self, foreign, and circular links', () => {
  const nodes = [
    { _id: first, dependencies: [] },
    { _id: second, dependencies: [] },
    { _id: third, dependencies: [first, second] },
  ];

  assert.equal(hasValidRoadmapNodeDependencyGraph(nodes, third, [first, second]), true);
  assert.equal(hasValidRoadmapNodeDependencyGraph(nodes, first, [first]), false);
  assert.equal(hasValidRoadmapNodeDependencyGraph(nodes, first, [third]), false);
  assert.equal(hasValidRoadmapNodeDependencyGraph(nodes, third, ['64b000000000000000000004']), false);
  assert.equal(hasValidRoadmapNodeDependencyGraph([
    { _id: first, dependencies: ['64b000000000000000000004'] },
  ], null, []), false);
  assert.equal(hasValidRoadmapNodeDependencyGraph([
    { _id: first, dependencies: [second, second] },
    { _id: second, dependencies: [] },
  ], null, []), false);
});

test('roadmap publication requires valid fields, topics, content, and prerequisite references', () => {
  const roadmap = { title: 'Roadmap', description: 'Learn core concepts' };
  assert.deepEqual(getRoadmapPublicationErrors(roadmap, []), [
    { field: 'nodes', message: 'Add at least one learning topic before publishing.' },
  ]);
  assert.deepEqual(getRoadmapPublicationErrors(roadmap, [
    { _id: first, title: 'Basics', dependencies: [], resources: [], problems: [] },
    { _id: second, title: 'Practice', dependencies: [first], resources: [], problems: [] },
  ]), []);
  const errors = getRoadmapPublicationErrors({ title: ' ', description: '' }, [
    { _id: first, title: 'Basics', dependencies: [], resources: [{ title: 'Broken', url: 'javascript:alert(1)' }], problems: [] },
    { _id: second, title: '', dependencies: [third], resources: [], problems: [] },
  ]);
  assert.ok(errors.some(({ field }) => field === 'title'));
  assert.ok(errors.some(({ field }) => field === 'description'));
  assert.ok(errors.some(({ field }) => field === 'nodes.2.title'));
  assert.ok(errors.some(({ field }) => field.startsWith('nodes.1.resources')));
  assert.ok(errors.some(({ field }) => field === 'dependencies'));
  assert.ok(getRoadmapPublicationErrors(roadmap, [
    { _id: first, title: 'Basics', dependencies: [], resources: [], problems: [{ title: 'Unsafe', url: 'javascript:alert(1)' }] },
  ]).some(({ field }) => field.startsWith('nodes.1.problems')));
  assert.ok(getRoadmapPublicationErrors(roadmap, [
    { _id: first, title: 'Basics', dependencies: [second], resources: [], problems: [] },
    { _id: second, title: 'Advanced', dependencies: [first], resources: [], problems: [] },
  ]).some(({ field }) => field === 'dependencies'));
});

test('learning topic model indexes roadmap ordering for path rendering', () => {
  assert.ok(RoadmapNode.schema.indexes().some(([keys]) => keys.roadmap === 1 && keys.position === 1));
});
