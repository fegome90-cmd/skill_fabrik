import crypto from 'node:crypto';
import type { WritePlan } from './sandbox.js';
import { createDistributedState, type KVState } from './state/distributed-state.js';

export type Challenge = {
  id: string;
  nonce: string;
  skill: string;
  cwd: string;
  plan: WritePlan;
  createdAt: number;
  ttlMs: number;
};

const challenges = new Map<string, Challenge>();
let challengeState: KVState<Challenge> | null = null;
async function ensureState(): Promise<KVState<Challenge> | null> {
  if (challengeState) return challengeState;
  try {
    challengeState = await createDistributedState<Challenge>('sf:challenge');
  } catch {
    challengeState = null;
  }
  return challengeState;
}
const TTL_MS_DEFAULT = 120_000;
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

function randomBase32(bytes: number): string {
  const buf = crypto.randomBytes(bytes);
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    out += BASE32_ALPHABET[buf[i] & 31];
  }
  return out;
}

export function newChallenge(
  skill: string,
  cwd: string,
  plan: WritePlan,
  ttlMs: number = TTL_MS_DEFAULT
): Challenge {
  const nonce = crypto.randomBytes(16).toString('base64url');
  const id = randomBase32(16);
  const challenge: Challenge = {
    id,
    nonce,
    skill,
    cwd,
    plan,
    createdAt: Date.now(),
    ttlMs,
  };
  challenges.set(id, challenge);
  // fire-and-forget distributed state write
  void (async () => {
    const rs = await ensureState();
    if (rs) {
      try { await rs.set(id, challenge, Math.floor(ttlMs / 1000)); } catch {}
    }
  })();
  return challenge;
}

export function getChallenge(id: string): Challenge | undefined {
  const challenge = challenges.get(id);
  if (!challenge) return undefined;
  if (Date.now() - challenge.createdAt > challenge.ttlMs) {
    challenges.delete(id);
    return undefined;
  }
  return challenge;
}

export function consumeChallenge(id: string): Challenge | undefined {
  const existing = getChallenge(id);
  if (!existing) return undefined;
  challenges.delete(id);
  void (async () => {
    const rs = await ensureState();
    if (rs) { try { await rs.del(id); } catch {} }
  })();
  return existing;
}

export function seedChallenge(challenge: Challenge): void {
  challenges.set(challenge.id, challenge);
  void (async () => {
    const rs = await ensureState();
    if (rs) {
      try { await rs.set(challenge.id, challenge, Math.floor(challenge.ttlMs / 1000)); } catch {}
    }
  })();
}

export function clearChallenges(): void {
  challenges.clear();
  // Redis clear omitted (dangerous without key scan); local only.
}

export function makeConfirmToken(challengeId: string, nonce: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${challengeId}:${nonce}`);
  return hmac.digest('base64url');
}

export function verifyConfirmToken(
  challengeId: string,
  nonce: string,
  token: string,
  secret: string
): boolean {
  if (!secret) return false;
  const expected = makeConfirmToken(challengeId, nonce, secret);
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  if (tokenBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}
