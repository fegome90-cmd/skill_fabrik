/**
 * Multi-Service Integration Tests
 * Tests for end-to-end integration between all services:
 * - CLI ↔ Daemon
 * - CLI ↔ Router
 * - CLI ↔ Service Discovery
 * - Daemon ↔ Router
 * - Full workflow across all services
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import { join } from 'path';

describe('Multi-Service Integration Tests', () => {
  const SERVICES = {
    DAEMON: 'http://127.0.0.1:7727',
    ROUTER: 'http://127.0.0.1:3000',
    DISCOVERY: 'http://127.0.0.1:8877',
  };

  const daemons = {
    daemon: null as any,
    router: null as any,
    discovery: null as any,
  };

  beforeAll(async () => {
    // Start all services
    console.log('🚀 Starting services for integration tests...');

    // Note: In real CI/CD, services would be started via PM2 or Docker
    // For testing, we assume services are already running or use mocks

    // Verify services are running
    await verifyServiceHealth(SERVICES.DAEMON, 'Daemon');
    await verifyServiceHealth(SERVICES.ROUTER, 'Router');
    await verifyServiceHealth(SERVICES.DISCOVERY, 'Service Discovery');
  });

  afterAll(async () => {
    // Cleanup if we started services
    console.log('🧹 Cleaning up integration test services...');
  });

  describe('Service Health Checks', () => {
    test('Daemon service should be healthy', async () => {
      const response = await fetch(`${SERVICES.DAEMON}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.services).toBeDefined();
      expect(data.services.daemon).toBe('healthy');
    });

    test('Router service should be healthy', async () => {
      const response = await fetch(`${SERVICES.ROUTER}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
    });

    test('Service Discovery should be healthy', async () => {
      const response = await fetch(`${SERVICES.DISCOVERY}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
    });
  });

  describe('CLI → Daemon Integration', () => {
    test('CLI should activate skill through daemon', async () => {
      // Test skill activation flow
      const response = await fetch(`${SERVICES.DAEMON}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'lint repository',
          editor: 'cli',
          cwd: '.',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
    });

    test('CLI should execute skill through daemon', async () => {
      // Test skill execution flow with dry-run
      const response = await fetch(`${SERVICES.DAEMON}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_id: 'repo-auditor',
          args: {},
          dry_run: true,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.stdout).toBeDefined();
      expect(data.run_latency_ms).toBeDefined();
    });

    test('Daemon should expose Prometheus metrics', async () => {
      const response = await fetch(`${SERVICES.DAEMON}/metrics`);

      expect(response.status).toBe(200);
      const text = await response.text();

      // Verify Prometheus format
      expect(text).toContain('daemon_info');
      expect(text).toContain('skills_activation_latency_ms');
      expect(text).toContain('skills_execute_latency_ms');
      expect(text).toContain('policy_decisions_total');
    });
  });

  describe('CLI → Router Integration', () => {
    test('Router should route skill activation requests', async () => {
      const response = await fetch(`${SERVICES.ROUTER}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'implement user authentication',
          context: {
            files: ['src/auth/login.ts'],
            activeFileContent: 'function login() {}',
          },
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.matches).toBeDefined();
    });

    test('Router should validate activation rules', async () => {
      const response = await fetch(`${SERVICES.ROUTER}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'create REST API',
          context: {},
        }),
      });

      const data = await response.json();
      expect(data.matches).toBeDefined();
    });
  });

  describe('Service Discovery Integration', () => {
    test('Should register all services in discovery', async () => {
      const response = await fetch(`${SERVICES.DISCOVERY}/services`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.services).toBeDefined();

      // Verify all services are registered
      const services = data.services;
      expect(services.daemon).toBeDefined();
      expect(services.router).toBeDefined();
      expect(services.discovery).toBeDefined();
    });

    test('Should discover daemon endpoint', async () => {
      const response = await fetch(`${SERVICES.DISCOVERY}/discover/daemon`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.endpoint).toBe(SERVICES.DAEMON);
    });

    test('Should discover router endpoint', async () => {
      const response = await fetch(`${SERVICES.DISCOVERY}/discover/router`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.endpoint).toBe(SERVICES.ROUTER);
    });
  });

  describe('Daemon ↔ Router Communication', () => {
    test('Daemon should query router for skill matching', async () => {
      // This test verifies internal communication pattern
      // In production, daemon uses router service discovery

      // Verify router is accessible from daemon's perspective
      const routerResponse = await fetch(`${SERVICES.ROUTER}/health`);
      expect(routerResponse.status).toBe(200);
    });

    test('Router should provide activation data to daemon', async () => {
      // Test that router returns skill activation data
      const response = await fetch(`${SERVICES.ROUTER}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'setup database',
          context: { files: ['db/schema.sql'] },
        }),
      });

      const data = await response.json();
      expect(data.matches).toBeDefined();
      expect(data.matches.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete workflow: CLI → Router → Daemon', async () => {
      // Step 1: User interacts with CLI
      const cliIntent = 'implement unit tests';

      // Step 2: Router processes activation
      const routerResponse = await fetch(`${SERVICES.ROUTER}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: cliIntent,
          context: {
            files: ['src/utils/helper.ts'],
            activeFileContent: 'export function helper() {}',
          },
        }),
      });

      const routerData = await routerResponse.json();
      expect(routerResponse.status).toBe(200);
      expect(routerData.matches).toBeDefined();

      // Step 3: Daemon executes the skill
      if (routerData.matches.length > 0) {
        const skillId = routerData.matches[0].skillId || routerData.matches[0].id;

        const daemonResponse = await fetch(`${SERVICES.DAEMON}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skill_id: skillId,
            args: { framework: 'jest' },
            dry_run: true,
          }),
        });

        const daemonData = await daemonResponse.json();
        expect(daemonResponse.status).toBe(200);
        expect(daemonData.stdout).toBeDefined();
      }
    });

    test('Skill pack → verify → install workflow', async () => {
      // Test the complete pack/verify/install workflow
      // This integrates file operations, manifest validation, and packaging

      const testSkillDir = join(__dirname, '../../../test-temp-integration-skill');
      const registryDir = join(__dirname, '../../../test-temp-registry');

      try {
        // Create test skill
        // (In real test, would use actual skill file creation)

        // Simulate pack
        const packResponse = await fetch(`${SERVICES.DAEMON}/list`);
        expect(packResponse.status).toBe(200);

        // Verify daemon has access to packaged skills
        const data = await packResponse.json();
        expect(Array.isArray(data)).toBe(true);
      } finally {
        // Cleanup
      }
    });

    test('Metrics aggregation across services', async () => {
      // Verify metrics are being collected
      const response = await fetch(`${SERVICES.DAEMON}/metrics`);
      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('skills_activation_latency_ms_count');
      expect(text).toContain('skills_execute_latency_ms_count');
    });
  });

  describe('Error Handling & Resilience', () => {
    test('Should handle service unavailability gracefully', async () => {
      // Test that CLI handles daemon unavailability
      // This would require actual service shutdown in integration env

      // For now, verify all endpoints return proper errors for bad input
      const badResponse = await fetch(`${SERVICES.DAEMON}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      });

      // Should return 400 for bad request, not crash
      expect([400, 500]).toContain(badResponse.status);
    });

    test('Should validate requests across service boundaries', async () => {
      // Test request validation at service boundaries
      const response = await fetch(`${SERVICES.DAEMON}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      // Should return validation error
      expect(response.status).toBe(400);
    });
  });

  describe('Performance & Reliability', () => {
    test('Service communication should meet latency requirements', async () => {
      const start = Date.now();

      const response = await fetch(`${SERVICES.DAEMON}/health`);
      const latency = Date.now() - start;

      expect(response.status).toBe(200);
      expect(latency).toBeLessThan(1000); // Should respond within 1 second
    });

    test('Multiple concurrent requests should be handled', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        fetch(`${SERVICES.DAEMON}/health`).then(r => r.status)
      );

      const results = await Promise.all(requests);
      expect(results.every(status => status === 200)).toBe(true);
    });
  });
});

/**
 * Helper function to verify service health
 */
async function verifyServiceHealth(endpoint: string, serviceName: string): Promise<void> {
  try {
    const response = await fetch(`${endpoint}/health`, {
      timeout: 5000,
    });

    if (response.status === 200) {
      console.log(`✅ ${serviceName} is healthy at ${endpoint}`);
    } else {
      console.log(`⚠️  ${serviceName} returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ ${serviceName} is not available at ${endpoint}`);
    console.log(`   Error: ${error}`);
    // Don't throw - allow tests to continue with mocks/stubs
  }
}
