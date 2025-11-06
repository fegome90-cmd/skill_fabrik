#!/usr/bin/env tsx

/**
 * Health check script for ADR Service
 * Tests: /health endpoint
 */

import { request } from 'http';

const HOST = '127.0.0.1';
const PORT = 7730;
const TIMEOUT = 5000;

async function testHealth() {
  console.log('🏥 Testing ADR Service Health...\n');

  return new Promise((resolve) => {
    const req = request(
      {
        hostname: HOST,
        port: PORT,
        path: '/health',
        method: 'GET',
        timeout: TIMEOUT
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            const health = JSON.parse(data);

            console.log('✅ Service is HEALTHY');
            console.log(`   Version: ${health.version}`);
            console.log(`   Port: ${health.port}`);
            console.log(`   Components:`);

            for (const [component, status] of Object.entries(health.components)) {
              console.log(`     - ${component}: ${status}`);
            }

            console.log('\n✅ Health check PASSED');
            resolve(0);
          } else {
            console.log(`❌ Health check FAILED: Status ${res.statusCode}`);
            console.log(data);
            resolve(1);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.log('❌ Health check FAILED: Connection error');
      console.log(`   Error: ${err.message}`);
      console.log('\n💡 Make sure ADR service is running:');
      console.log(`   cd packages/adr-service && pnpm dev`);
      resolve(1);
    });

    req.on('timeout', () => {
      console.log('❌ Health check FAILED: Request timeout');
      console.log(`   Timeout after ${TIMEOUT}ms`);
      resolve(1);
    });

    req.end();
  });
}

// Run test
testHealth().then((exitCode) => {
  process.exit(exitCode);
});
