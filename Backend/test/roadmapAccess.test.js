import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('roadmap cycle lists, details, and enrollment reject unauthenticated requests', async () => {
  const requests = [
    fetch(`${baseUrl}/roadmaps/public-roadmap/cycles`),
    fetch(`${baseUrl}/roadmaps/public-roadmap/cycles/64b000000000000000000001`),
    fetch(`${baseUrl}/roadmaps/public-roadmap/cycles/64b000000000000000000001/enroll`, { method: 'POST' }),
    fetch(`${baseUrl}/roadmaps/public-roadmap/progress`),
    fetch(`${baseUrl}/roadmaps/public-roadmap/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: '64b000000000000000000001', problemUrl: 'https://example.com/problem', solved: true }),
    }),
  ];
  const responses = await Promise.all(requests);

  assert.deepEqual(responses.map(({ status }) => status), [401, 401, 401, 401, 401]);
  for (const response of responses) {
    const body = await response.json();
    assert.equal(body.error.message, 'Sign in to continue.');
  }
});
