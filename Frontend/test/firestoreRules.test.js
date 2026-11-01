import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(import.meta.dirname, '../../firestore.rules');

test('Firestore Security Rules Structural & Security Invariants Verification', async t => {
  const rules = fs.readFileSync(rulesPath, 'utf8');

  await t.test('1. Enforces rules_version = 2 and cloud.firestore service block', () => {
    assert.match(rules, /rules_version\s*=\s*'2';/);
    assert.match(rules, /service\s+cloud\.firestore\s*\{/);
  });

  await t.test('2. Protects user role and points from client-side privilege escalation', () => {
    assert.match(rules, /request\.resource\.data\.role\s*==\s*'user'/);
    assert.match(rules, /request\.resource\.data\.attendancePoints\s*==\s*0/);
    assert.match(rules, /request\.resource\.data\.role\s*==\s*resource\.data\.role/);
  });

  await t.test('3. Enforces uniqueness lock collections for usernames and studentIds', () => {
    assert.match(rules, /match\s+\/usernames\/\{username\}/);
    assert.match(rules, /match\s+\/studentIds\/\{studentId\}/);
    assert.match(rules, /allow\s+create:\s+if\s+isSignedIn\(\)/);
  });

  await t.test('4. Protects userSecrets and enforces default-deny on unmatched paths', () => {
    assert.match(rules, /match\s+\/userSecrets\/\{uid\}/);
    assert.match(rules, /function\s+isAdmin\(\)/);
    assert.match(rules, /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s*false;/);
  });
});
