#!/usr/bin/env node
import crypto from 'node:crypto';

const [challengeId, nonce = ''] = process.argv.slice(2);
const secret = process.env.CONFIRM_SECRET || '';

if (!challengeId || !secret) {
  console.error('Usage: node scripts/make-confirm-token.mjs <challenge_id> [nonce] (requires CONFIRM_SECRET)');
  process.exit(2);
}

const hmac = crypto.createHmac('sha256', secret);
hmac.update(nonce ? `${challengeId}:${nonce}` : challengeId);
process.stdout.write(hmac.digest('base64url'));
