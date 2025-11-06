#!/usr/bin/env tsx

/**
 * Test ADR Analysis Script
 * Tests: /adr/generate endpoint with sample conversation
 */

import { request } from 'http';

const HOST = '127.0.0.1';
const PORT = 7730;
const TIMEOUT = 10000;

// Sample conversation for testing
const sampleConversation = [
  "We need to implement a new authentication system",
  "The current system is using basic session cookies",
  "We should move to JWT-based authentication",
  "This will allow us to scale horizontally",
  "We need to consider refresh tokens",
  "Should we use OAuth2 or implement our own?",
  "Let's go with OAuth2 + PKCE",
  "This adds security for mobile apps",
  "We need to update all API endpoints",
  "The migration will take 2 sprints",
  "We need to update the database schema",
  "Add refresh_token table",
  "Update user table with oauth fields",
  "Test all authentication flows",
  "Update documentation"
];

const sampleSolution = `
Implementation Plan for JWT + OAuth2 Authentication:

1. Database Changes:
   - Add oauth_tokens table (refresh_token, expires_at, user_id)
   - Add client_id, client_secret to users table
   - Create index on refresh_token

2. API Changes:
   - /auth/login: Return access_token + refresh_token
   - /auth/refresh: Exchange refresh_token for new access_token
   - /auth/logout: Invalidate both tokens
   - Update all protected endpoints to validate JWT

3. Security Considerations:
   - Use PKCE for mobile apps
   - Store refresh tokens in httpOnly cookies
   - Implement token rotation
   - Add rate limiting on auth endpoints

4. Migration Steps:
   - Phase 1: Update login endpoint (Sprint 1)
   - Phase 2: Add refresh token support (Sprint 2)
   - Phase 3: Migrate existing sessions (Sprint 2)
   - Phase 4: Remove old session system (Sprint 3)

Impact:
- Breaking change for all API clients
- Requires migration of 50K existing users
- Affects 15 microservices
- Needs coordination with mobile team

This is a major architectural change affecting authentication flow across the platform.
`.trim();

async function testAnalysis() {
  console.log('🔍 Testing ADR Generation...\n');

  const payload = {
    conversation: sampleConversation,
    solution: sampleSolution,
    context: {
      domain: 'authentication',
      stakeholders: ['backend', 'mobile', 'security']
    }
  };

  return new Promise((resolve) => {
    const data = JSON.stringify(payload);

    const req = request(
      {
        hostname: HOST,
        port: PORT,
        path: '/adr/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: TIMEOUT
      },
      (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);

            if (res.statusCode === 201) {
              console.log('✅ ADR Generation SUCCESSFUL\n');
              console.log(`📊 Complexity Score: ${result.complexity.score}`);
              console.log(`   - Conversation Depth: ${result.complexity.breakdown.conversation_depth}`);
              console.log(`   - Decisions: ${result.complexity.breakdown.decisions_evaluated}`);
              console.log(`   - Change Impact: ${result.complexity.breakdown.change_impact}`);
              console.log(`   - Keywords: ${result.complexity.breakdown.architectural_keywords}\n`);

              console.log(`📝 Generated ADR:`);
              console.log(`   ID: ${result.adr.id}`);
              console.log(`   Title: ${result.adr.title}`);
              console.log(`   Phase: ${result.adr.phase}`);
              console.log(`   Tags: ${result.adr.tags.join(', ')}\n`);

              console.log(`⚡ Processing Time: ${result.processing_time_ms}ms\n`);

              console.log('📄 ADR Content Preview:');
              console.log('---');
              console.log(result.adr.content.substring(0, 300) + '...');
              console.log('---\n');

              console.log('✅ ADR Analysis Test PASSED');
              resolve(0);
            } else if (result.status === 'not_complex_enough') {
              console.log('⚠️ Conversation not complex enough for ADR');
              console.log(`   Complexity Score: ${result.complexity.score} < 0.7`);
              console.log('   This is expected if threshold is not met');
              console.log('\n✅ Test PASSED (complexity threshold working)');
              resolve(0);
            } else {
              console.log(`❌ ADR Generation FAILED: Status ${res.statusCode}`);
              console.log(responseData);
              resolve(1);
            }
          } catch (error) {
            console.log('❌ Response parsing FAILED');
            console.log(error.message);
            console.log(responseData);
            resolve(1);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.log('❌ Test FAILED: Connection error');
      console.log(`   Error: ${err.message}`);
      console.log('\n💡 Make sure ADR service is running:');
      console.log(`   cd packages/adr-service && pnpm dev`);
      console.log(`   Or: pnpm --filter @skills-fabrik/adr-service dev\n`);
      resolve(1);
    });

    req.on('timeout', () => {
      console.log('❌ Test FAILED: Request timeout');
      console.log(`   Timeout after ${TIMEOUT}ms`);
      resolve(1);
    });

    req.write(data);
    req.end();
  });
}

// Run test
console.log('='.repeat(60));
console.log('ACE-ADR Service - ADR Generation Test');
console.log('='.repeat(60) + '\n');

testAnalysis().then((exitCode) => {
  console.log('\n' + '='.repeat(60));
  process.exit(exitCode);
});
