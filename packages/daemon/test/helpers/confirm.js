import crypto from 'node:crypto';

export function makeToken(challengeId, nonce, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${challengeId}:${nonce}`);
  return hmac.digest('base64url');
}
