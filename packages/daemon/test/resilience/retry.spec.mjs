import test from 'node:test';
import assert from 'node:assert/strict';
import { withRetry } from '../../dist/resilience/retry.js';

await test('withRetry succeeds on second attempt', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 2) throw new Error('ETIMEDOUT test');
    return 'ok';
  };
  const res = await withRetry(fn, { maxAttempts: 3, initialDelay: 5, backoffMultiplier: 1, jitter: false, operationName: 'unit' });
  assert.equal(res, 'ok');
  assert.equal(attempts, 2);
});

await test('withRetry does not retry on non-retryable error', async () => {
  let attempts = 0;
  const fn = async () => { attempts++; throw new Error('validation'); };
  await assert.rejects(() => withRetry(fn, { maxAttempts: 3, initialDelay: 5, jitter: false, operationName: 'unit' }));
  assert.equal(attempts, 1);
});

