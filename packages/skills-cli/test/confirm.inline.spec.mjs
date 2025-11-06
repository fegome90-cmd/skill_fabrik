import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);
const INLINE_PATH = '../dist/lib/inline-execute.js';

async function makeToken(id, nonce, secret) {
  const result = await execFileAsync(process.execPath, ['scripts/make-confirm-token.mjs', id, nonce], {
    cwd: process.cwd(),
    env: { ...process.env, CONFIRM_SECRET: secret },
  });
  return result.stdout.toString().trim();
}

test('inline confirm flow writes to sandbox', async () => {
  const secret = 'test-secret-inline';
  process.env.CONFIRM_SECRET = secret;
  const { seedInlineChallenge, inlineExecute, inlineClose } = await import(INLINE_PATH);

  const challengeId = 'inline-test-challenge';
  const nonce = 'inline-test-nonce';
  const seed = {
    id: challengeId,
    nonce,
    skill: 'policy-s1',
    cwd: '.',
    plan: {
      files: [{ path: 'out/a.txt', bytes: 6 }],
      summary: 'inline test',
    },
    createdAt: Date.now(),
    ttlMs: 120_000,
  };

  await seedInlineChallenge(seed);
  const confirmToken = await makeToken(challengeId, nonce, secret);

  try {
    const response = await inlineExecute({
      skill_id: 'policy-s1',
      challenge_id: challengeId,
      confirm_token: confirmToken,
      needs: ['fs.write'],
      cwd: '.',
    });

    assert.equal(response.statusCode, 200);
    const body = await response.json();
    assert.equal(body.rollback_plan?.files?.length, 1);
    assert.equal(body.rollback_plan.files[0], 'workspace/sandbox/out/a.txt');
  } finally {
    await inlineClose();
    await rm(join('workspace'), { recursive: true, force: true }).catch(() => {});
    delete process.env.CONFIRM_SECRET;
  }
});
