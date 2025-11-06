import fetch from 'node-fetch';

export const endpoint = () => process.env.SF_ENDPOINT || 'http://127.0.0.1:7727';

export async function post(path: string, body: any): Promise<{ ok: boolean; status: number; json: any }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (process.env.SF_API_KEY) headers['x-api-key'] = String(process.env.SF_API_KEY);
  const res = await fetch(`${endpoint()}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}
