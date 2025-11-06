import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { CLIHelper } from '../utils/test-helpers';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';

describe('CLI KPI Commands Integration Tests', () => {
  const testKpiDir = join(__dirname, '../../../test-kpi');
  const eventsFile = join(testKpiDir, 'events.jsonl');
  const dashboardFile = join(testKpiDir, 'dashboard.md');

  beforeAll(() => {
    mkdirSync(testKpiDir, { recursive: true });

    // Create sample KPI events
    const sampleEvents = [
      JSON.stringify({
        timestamp: new Date('2025-10-24T10:00:00Z').toISOString(),
        event: 'skill_activated',
        skill: 'plan-architect',
        duration: 250,
        success: true
      }),
      JSON.stringify({
        timestamp: new Date('2025-10-24T11:00:00Z').toISOString(),
        event: 'skill_activated',
        skill: 'database-verification',
        duration: 180,
        success: true
      }),
      JSON.stringify({
        timestamp: new Date('2025-10-24T12:00:00Z').toISOString(),
        event: 'skill_activated',
        skill: 'secrets-and-config',
        duration: 320,
        success: false,
        error: 'validation_failed'
      }),
      JSON.stringify({
        timestamp: new Date('2025-10-25T09:00:00Z').toISOString(),
        event: 'plan_created',
        plan_type: 'cloop',
        complexity: 'medium'
      }),
      JSON.stringify({
        timestamp: new Date('2025-10-25T14:00:00Z').toISOString(),
        event: 'cli_command',
        command: 'skills lint',
        duration: 1200,
        success: true
      })
    ].join('\n');

    writeFileSync(eventsFile, sampleEvents);
  });

  afterAll(() => {
    rmSync(testKpiDir, { recursive: true, force: true });
  });

  describe('kpi command with --days flag', () => {
    test('should show KPIs for last 7 days', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '7'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KPI');
      expect(result.stdout).toContain('activations');
    });

    test('should show KPIs for custom time range', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '3'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KPI');
    });

    test('should handle default days parameter', async () => {
      const result = await CLIHelper.kpiCommand([]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KPI');
    });
  });

  describe('kpi with --output flag', () => {
    test('should generate dashboard markdown file', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--output', dashboardFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Dashboard');
      expect(existsSync(dashboardFile)).toBe(true);

      if (existsSync(dashboardFile)) {
        const dashboardContent = require('fs').readFileSync(dashboardFile, 'utf8');
        expect(dashboardContent).toContain('# KPI Dashboard');
        expect(dashboardContent).toContain('## Metrics');
      }
    });

    test('should generate dashboard in different formats', async () => {
      const jsonDashboard = join(testKpiDir, 'dashboard.json');
      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--output', jsonDashboard,
        '--format', 'json'
      ]);

      expect(result.exitCode).toBe(0);
      expect(existsSync(jsonDashboard)).toBe(true);

      if (existsSync(jsonDashboard)) {
        const dashboardContent = JSON.parse(require('fs').readFileSync(jsonDashboard, 'utf8'));
        expect(dashboardContent.metrics).toBeDefined();
        expect(dashboardContent.period).toBeDefined();
      }
    });
  });

  describe('kpi with custom events file', () => {
    test('should process custom events file', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--events', eventsFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KPI');
    });

    test('should handle empty events file', async () => {
      const emptyEventsFile = join(testKpiDir, 'empty-events.jsonl');
      writeFileSync(emptyEventsFile, '');

      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--events', emptyEventsFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('No events');
    });
  });

  describe('KPI metrics accuracy', () => {
    test('should calculate activation metrics correctly', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--events', eventsFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('3'); // We have 3 skill activations in test data
    });

    test('should calculate success rate correctly', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--events', eventsFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('66.7'); // 2 out of 3 activations succeeded
    });

    test('should calculate average duration', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--events', eventsFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('ms'); // Duration should be shown in milliseconds
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle non-existent events file', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--events', '/nonexistent/events.jsonl'
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('not found');
    });

    test('should handle malformed JSONL events', async () => {
      const malformedEventsFile = join(testKpiDir, 'malformed-events.jsonl');
      writeFileSync(malformedEventsFile, 'invalid json\n{"valid": "json"}\n{invalid}');

      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--events', malformedEventsFile
      ]);

      expect(result.exitCode).toBe(0); // Should handle gracefully
      expect(result.stdout).toContain('KPI');
    });

    test('should handle invalid days parameter', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', 'invalid'
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('days');
    });

    test('should handle negative days parameter', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '-1'
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('days');
    });

    test('should handle very large days parameter', async () => {
      const result = await CLIHelper.kpiCommand([
        '--days', '365'
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KPI');
    });
  });

  describe('Performance tests', () => {
    test('should handle large events file efficiently', async () => {
      const largeEventsFile = join(testKpiDir, 'large-events.jsonl');
      const largeEvents = [];

      // Generate 1000 events
      for (let i = 0; i < 1000; i++) {
        largeEvents.push(JSON.stringify({
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          event: 'skill_activated',
          skill: `test-skill-${i % 10}`,
          duration: Math.floor(Math.random() * 1000) + 100,
          success: Math.random() > 0.1
        }));
      }

      writeFileSync(largeEventsFile, largeEvents.join('\n'));

      const startTime = Date.now();
      const result = await CLIHelper.kpiCommand([
        '--days', '30',
        '--events', largeEventsFile
      ]);
      const duration = Date.now() - startTime;

      expect(result.exitCode).toBe(0);
      expect(duration).toBeLessThan(5000); // Should process 1000 events within 5 seconds
    });

    test('should handle dashboard generation efficiently', async () => {
      const largeDashboard = join(testKpiDir, 'large-dashboard.md');

      const startTime = Date.now();
      const result = await CLIHelper.kpiCommand([
        '--days', '7',
        '--events', eventsFile,
        '--output', largeDashboard
      ]);
      const duration = Date.now() - startTime;

      expect(result.exitCode).toBe(0);
      expect(duration).toBeLessThan(2000); // Should generate dashboard within 2 seconds
      expect(existsSync(largeDashboard)).toBe(true);
    });
  });

  describe('KPI integration with other systems', () => {
    test('should work with different event types', async () => {
      const mixedEventsFile = join(testKpiDir, 'mixed-events.jsonl');
      const mixedEvents = [
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'skill_activated',
          skill: 'test-skill',
          duration: 200,
          success: true
        }),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'plan_created',
          plan_type: 'agile',
          complexity: 'high'
        }),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'cli_command',
          command: 'guardrail check',
          duration: 500,
          success: true
        }),
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'error_occurred',
          error_type: 'validation',
          component: 'router'
        })
      ].join('\n');

      writeFileSync(mixedEventsFile, mixedEvents);

      const result = await CLIHelper.kpiCommand([
        '--days', '1',
        '--events', mixedEventsFile
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('KPI');
    });
  });
});