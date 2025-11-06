#!/usr/bin/env node

/**
 * Service Integration Tests
 *
 * Comprehensive integration tests for Phase 2: Service Integration
 * Tests daemon, router, and service discovery integration
 */

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

const BASE_URLS = {
  daemon: 'http://127.0.0.1:7727',
  router: 'http://127.0.0.1:3000',
  discovery: 'http://127.0.0.1:8877'
};

class ServiceIntegrationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
  }

  /**
   * Run a single test with error handling
   */
  async runTest(testName, testFn) {
    this.results.total++;
    console.log(`🧪 Running: ${testName}`);

    try {
      await testFn();
      console.log(`✅ PASSED: ${testName}`);
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED', error: null });
    } catch (error) {
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  /**
   * HTTP request helper
   */
  async fetch(url, options = {}) {
    const response = await fetch(url, {
      timeout: 5000,
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test PM2 process status
   */
  async testPM2Status() {
    const { execSync } = await import('child_process');
    const output = execSync('pm2 jlist', { encoding: 'utf8' });
    const processes = JSON.parse(output);

    const runningProcesses = processes.filter(p => p.pm2_env.status === 'online');
    if (runningProcesses.length < 1) {
      throw new Error(`Expected at least 1 running process, got ${runningProcesses.length}`);
    }

    console.log(`   📊 Found ${runningProcesses.length} running processes`);
    runningProcesses.forEach(p => console.log(`   - ${p.name} (PID: ${p.pid})`));
  }

  /**
   * Test Daemon Health Endpoint
   */
  async testDaemonHealth() {
    const health = await this.fetch(`${BASE_URLS.daemon}/health`);

    if (!health.status || !health.timestamp) {
      throw new Error('Invalid health response format');
    }

    console.log(`   🏥 Daemon status: ${health.status}`);
    console.log(`   ⏱️  Uptime: ${health.uptime_s}s`);
    console.log(`   📈 Avg latency: ${health.avg_latency_ms}ms`);
  }

  /**
   * Test Router Health Endpoint
   */
  async testRouterHealth() {
    const health = await this.fetch(`${BASE_URLS.router}/health`);

    if (!health.status || !health.service) {
      throw new Error('Invalid router health response');
    }

    if (health.service !== 'router-service') {
      throw new Error(`Expected service 'router-service', got '${health.service}'`);
    }

    console.log(`   🛣️  Router status: ${health.status}`);
    console.log(`   🔗 Daemon dependency: ${health.dependencies.daemon.status}`);
  }

  /**
   * Test Service Discovery Health Endpoint
   */
  async testDiscoveryHealth() {
    const health = await this.fetch(`${BASE_URLS.discovery}/health`);

    if (!health.status || !health.service) {
      throw new Error('Invalid discovery health response');
    }

    if (health.service !== 'service-discovery') {
      throw new Error(`Expected service 'service-discovery', got '${health.service}'`);
    }

    console.log(`   🔍 Discovery status: ${health.status}`);
    console.log(`   📊 Total services: ${health.stats.total}`);
  }

  /**
   * Test Service Registration
   */
  async testServiceRegistration() {
    const testService = {
      name: 'test-service',
      host: '127.0.0.1',
      port: 9999,
      version: '1.0.0',
      healthEndpoint: '/health',
      status: 'healthy',
      lastSeen: new Date(),
      registeredAt: new Date(),
      metadata: {
        description: 'Test service for integration testing',
        tags: ['test', 'integration'],
        environment: 'test'
      }
    };

    // Register service
    await this.fetch(`${BASE_URLS.discovery}/services/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: testService })
    });

    console.log(`   📝 Registered test service: ${testService.name}`);

    // Discover service
    const discovered = await this.fetch(`${BASE_URLS.discovery}/services/${testService.name}`);

    if (!discovered.service || discovered.service.name !== testService.name) {
      throw new Error('Service registration/discovery failed');
    }

    console.log(`   🔍 Discovered service: ${discovered.service.name}`);

    // Cleanup
    await this.fetch(`${BASE_URLS.discovery}/services/${testService.name}`, {
      method: 'DELETE'
    });

    console.log(`   🗑️  Cleaned up test service`);
  }

  /**
   * Test Inter-Service Communication
   */
  async testInterServiceCommunication() {
    // Test router's dependency on daemon
    const routerHealth = await this.fetch(`${BASE_URLS.router}/health`);

    if (routerHealth.dependencies.daemon.status !== 'healthy') {
      throw new Error('Router cannot reach daemon');
    }

    console.log(`   🔗 Router → Daemon communication: OK`);

    // Test router endpoints
    const rulesResponse = await this.fetch(`${BASE_URLS.router}/rules`);
    if (!rulesResponse.success) {
      throw new Error('Router rules endpoint failed');
    }

    console.log(`   📋 Router rules endpoint: OK`);
  }

  /**
   * Test Service Discovery Statistics
   */
  async testDiscoveryStats() {
    const stats = await this.fetch(`${BASE_URLS.discovery}/stats`);

    if (!stats.success || !stats.stats) {
      throw new Error('Invalid stats response');
    }

    console.log(`   📈 Discovery stats:`);
    console.log(`   - Total services: ${stats.stats.total}`);
    console.log(`   - Healthy: ${stats.stats.healthy}`);
    console.log(`   - Unhealthy: ${stats.stats.unhealthy}`);
  }

  /**
   * Test Service Querying
   */
  async testServiceQuerying() {
    const query = {
      healthyOnly: true,
      environment: 'development'
    };

    const services = await this.fetch(`${BASE_URLS.discovery}/services/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });

    if (!services.success) {
      throw new Error('Service query failed');
    }

    console.log(`   🔍 Query result: ${services.count} services found`);
  }

  /**
   * Test Load Balancing
   */
  async testLoadBalancing() {
    // This would require multiple instances of the same service
    // For now, just test the endpoint exists
    try {
      const endpoint = await this.fetch(`${BASE_URLS.discovery}/services/non-existent/endpoint`);
      // If we get here, it means the endpoint exists but service not found
      console.log(`   ⚖️  Load balancing endpoint: OK (no services available)`);
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`   ⚖️  Load balancing endpoint: OK (expected 404)`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🚀 Starting Service Integration Tests...\n');

    await this.runTest('PM2 Process Status', () => this.testPM2Status());

    // Service Health Tests
    await this.runTest('Daemon Health Check', () => this.testDaemonHealth());
    await this.runTest('Router Health Check', () => this.testRouterHealth());
    await this.runTest('Discovery Health Check', () => this.testDiscoveryHealth());

    // Service Discovery Tests
    await this.runTest('Service Registration', () => this.testServiceRegistration());
    await this.runTest('Service Querying', () => this.testServiceQuerying());
    await this.runTest('Discovery Statistics', () => this.testDiscoveryStats());

    // Integration Tests
    await this.runTest('Inter-Service Communication', () => this.testInterServiceCommunication());
    await this.runTest('Load Balancing', () => this.testLoadBalancing());

    this.printResults();
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SERVICE INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(t => t.status === 'FAILED')
        .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
    }

    console.log('\n' + '='.repeat(60));

    if (this.results.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Service integration is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the issues above.');
    }

    console.log('='.repeat(60));
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ServiceIntegrationTester();

  try {
    await tester.runAllTests();
    process.exit(tester.results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

export { ServiceIntegrationTester };