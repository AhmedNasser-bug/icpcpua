import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

test('Deployment Architecture & Turnkey Configuration Verification', async t => {
  await t.test('1. Vercel Root Config: vercel.json has build command, output dir, and SPA rewrite', () => {
    const vPath = path.join(REPO_ROOT, 'vercel.json');
    assert.ok(fs.existsSync(vPath), 'Root vercel.json must exist');
    const vConfig = JSON.parse(fs.readFileSync(vPath, 'utf8'));

    assert.equal(vConfig.outputDirectory, 'Frontend/dist');
    assert.ok(vConfig.buildCommand.includes('npm run build'));
    assert.ok(Array.isArray(vConfig.rewrites), 'rewrites must be an array');
    assert.equal(vConfig.rewrites[0].destination, '/index.html');
  });

  await t.test('2. Vercel Frontend Subdirectory Config: Frontend/vercel.json is valid', () => {
    const fvPath = path.join(REPO_ROOT, 'Frontend', 'vercel.json');
    assert.ok(fs.existsSync(fvPath), 'Frontend/vercel.json must exist');
    const fvConfig = JSON.parse(fs.readFileSync(fvPath, 'utf8'));

    assert.ok(Array.isArray(fvConfig.rewrites));
    assert.equal(fvConfig.rewrites[0].destination, '/index.html');
  });

  await t.test('3. Firebase Project Config: .firebaserc and firebase.json target icpc-pua', () => {
    const rcPath = path.join(REPO_ROOT, '.firebaserc');
    assert.ok(fs.existsSync(rcPath), '.firebaserc must exist');
    const rc = JSON.parse(fs.readFileSync(rcPath, 'utf8'));
    assert.equal(rc.projects?.default, 'icpc-pua');

    const fbPath = path.join(REPO_ROOT, 'firebase.json');
    assert.ok(fs.existsSync(fbPath), 'firebase.json must exist');
    const fb = JSON.parse(fs.readFileSync(fbPath, 'utf8'));
    assert.equal(fb.firestore?.rules, 'firestore.rules');
    assert.equal(fb.firestore?.indexes, 'firestore.indexes.json');

    const rulesPath = path.join(REPO_ROOT, 'firestore.rules');
    assert.ok(fs.existsSync(rulesPath), 'firestore.rules must exist');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    assert.match(rules, /rules_version\s*=\s*'2';/);
  });

  await t.test('4. Production Build Artifacts: Frontend/dist contains index.html, JS, and CSS bundles', () => {
    const distIndex = path.join(REPO_ROOT, 'Frontend', 'dist', 'index.html');
    assert.ok(fs.existsSync(distIndex), 'Frontend/dist/index.html must exist');
    const indexHtml = fs.readFileSync(distIndex, 'utf8');
    assert.match(indexHtml, /<div\s+id="root">\s*<\/div>/);
    assert.match(indexHtml, /<script\s+type="module"\s+crossorigin\s+src="\/assets\/index-/);

    const assetsDir = path.join(REPO_ROOT, 'Frontend', 'dist', 'assets');
    assert.ok(fs.existsSync(assetsDir), 'Frontend/dist/assets must exist');
    const files = fs.readdirSync(assetsDir);
    assert.ok(files.some(f => f.endsWith('.js')), 'Production JS bundle must exist');
    assert.ok(files.some(f => f.endsWith('.css')), 'Production CSS bundle must exist');
  });

  await t.test('5. Seed Fixture & Environment Configuration: seedFixture.json and .env.example are complete', () => {
    const seedPath = path.join(REPO_ROOT, 'Frontend', 'src', 'shared', 'data', 'seedFixture.json');
    assert.ok(fs.existsSync(seedPath), 'seedFixture.json must exist');
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    assert.ok(seed.roadmaps?.length >= 1, 'Must contain seeded roadmaps');
    assert.ok(seed.roadmapNodes?.length >= 8, 'Must contain 8 topic nodes');
    assert.ok(seed.events?.length >= 2, 'Must contain published events');

    const envExPath = path.join(REPO_ROOT, 'Frontend', '.env.example');
    assert.ok(fs.existsSync(envExPath), '.env.example must exist');
    const envEx = fs.readFileSync(envExPath, 'utf8');
    assert.match(envEx, /VITE_FIREBASE_PROJECT_ID=icpc-pua/);
    assert.match(envEx, /VITE_ACPC_TARGET_DATE=/);
  });
});
