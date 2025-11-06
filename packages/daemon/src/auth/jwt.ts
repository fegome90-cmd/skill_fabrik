import crypto from 'node:crypto';

function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4 || 4);
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad % 4);
  return Buffer.from(normalized, 'base64');
}

export function signHS256(payload: Record<string, unknown>, secret: string, opts?: { expSec?: number; sub?: string; iss?: string; aud?: string }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: Record<string, unknown> = { iat: now, ...payload };
  if (opts?.expSec) fullPayload.exp = now + opts.expSec;
  if (opts?.sub) fullPayload.sub = opts.sub;
  if (opts?.iss) fullPayload.iss = opts.iss;
  if (opts?.aud) fullPayload.aud = opts.aud;

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  const encodedSig = base64url(sig);
  return `${data}.${encodedSig}`;
}

export function verifyHS256(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  const expected = base64url(sig);
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(encodedSig))) return null;
  const payloadJson = base64urlDecode(encodedPayload).toString('utf8');
  try {
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const exp = (payload as any).exp;
    if (typeof exp === 'number' && Math.floor(Date.now() / 1000) > exp) return null;
    return payload;
  } catch {
    return null;
  }
}

