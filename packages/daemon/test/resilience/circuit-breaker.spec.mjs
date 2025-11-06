import test from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker } from '../../dist/resilience/circuit-breaker.js';

await test('CircuitBreaker transitions CLOSED -> OPEN -> HALF_OPEN -> CLOSED', async () => {
  const cb = new CircuitBreaker({
    name: 'unit:cb',
    failureThreshold: 2,
    successThreshold: 1,
    resetTimeout: 50,
    timeout: 100,
  });

  let calls = 0;
  const failing = async () => { calls++; throw new Error('ETIMEDOUT'); };
  const succeeding = async () => { calls++; return 'ok'; };

  // two failures trigger OPEN
  await assert.rejects(() => cb.execute(failing));
  await assert.rejects(() => cb.execute(failing));

  // while OPEN, immediate call should reject without invoking fn
  const before = calls;
  await assert.rejects(() => cb.execute(succeeding));
  assert.equal(calls, before, 'should not call underlying fn while OPEN');

  // wait for resetTimeout to enter HALF_OPEN
  await new Promise(r => setTimeout(r, 60));
  const res = await cb.execute(succeeding);
  assert.equal(res, 'ok');
});

