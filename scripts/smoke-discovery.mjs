#!/usr/bin/env node
// Discovery smoke: validate that an endpoint for sf-daemon can be obtained.
const base = process.env.DISCOVERY_URL || 'http://127.0.0.1:8877';
const service = process.env.SF_SERVICE_NAME || 'sf-daemon';

try {
  const res = await fetch(`${base}/services/${service}/endpoint`);
  if (!res.ok) {
    console.error('❌ discovery endpoint not OK', res.status);
    process.exit(1);
  }
  const j = await res.json();
  if (!j?.success || !j?.endpoint?.url) {
    console.error('❌ discovery endpoint invalid payload');
    process.exit(1);
  }
  console.log('✅ discovery endpoint OK', j.endpoint.url);
  process.exit(0);
} catch (e) {
  console.error('❌ discovery smoke FAIL:', e instanceof Error ? e.message : String(e));
  process.exit(1);
}

