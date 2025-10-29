#!/usr/bin/env node
/**
 * Test script para endpoints autenticados
 * Uso: node scripts/test-auth-route.js http://localhost:3002/api/endpoint
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

(async () => {
  const target = process.argv[2];

  if (!target) {
    console.error('Usage: test-auth-route <URL>');
    console.error('Example: node scripts/test-auth-route.js http://localhost:3002/api/users');
    process.exit(2);
  }

  // TODO: Obtén token real según tu auth (Keycloak/issuer local/etc.)
  const fakeToken = 'Bearer REPLACE_ME';
  const fakeCookie = 'session=REPLACE_ME';

  const u = new URL(target);
  const lib = u.protocol === 'https:' ? https : http;

  const opts = {
    method: 'GET',
    headers: {
      Authorization: fakeToken,
      Cookie: fakeCookie,
      'Content-Type': 'application/json',
    },
  };

  const req = lib.request(u, opts, res => {
    let body = '';

    res.on('data', chunk => {
      body += chunk;
    });

    res.on('end', () => {
      console.log('\n📊 Response:');
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      console.log('\nHeaders:');
      console.log(JSON.stringify(res.headers, null, 2));
      console.log('\nBody (first 1000 chars):');
      console.log(body.slice(0, 1000));

      if (res.statusCode >= 400) {
        console.error('\n❌ Request failed');
        process.exit(1);
      } else {
        console.log('\n✅ Request successful');
        process.exit(0);
      }
    });
  });

  req.on('error', error => {
    console.error('❌ Request error:', error.message);
    process.exit(1);
  });

  req.setTimeout(10000, () => {
    console.error('❌ Request timeout');
    req.destroy();
    process.exit(1);
  });

  req.end();
})();
