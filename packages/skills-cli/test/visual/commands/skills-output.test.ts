/**
 * Visual Regression Tests - Skills Command Output
 * Validates visual consistency and formatting of skills command outputs
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { MockCLI, MockCLIFactory, MockScenarios } from '../../utils/cli-mocks.js';
import { SnapshotManager } from '../utils/snapshot-manager.js';
import { VisualValidator } from '../utils/visual-validators.js';

describe('Skills Command Visual Regression Tests', () => {
  let mockCLI: MockCLI;
  let snapshotManager: SnapshotManager;
  let visualValidator: VisualValidator;

  beforeAll(() => {
    mockCLI = MockCLIFactory.createRealisticCLI();
    snapshotManager = new SnapshotManager('./test/visual');
    visualValidator = new VisualValidator();

    // Ensure test environment
    process.env.NODE_ENV = 'test';
    process.env.FORCE_COLOR = '1';
  });

  afterAll(() => {
    mockCLI.clearHistory();
  });

  describe('Skills Lint Command Visual Output', () => {
    test('should maintain consistent output formatting', async () => {
      const result = await mockCLI.executeCommand('skills lint', ['./skills', '--strict']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('✓');
      expect(result.stdout).toContain('Validation completed');

      // Validate visual elements
      const visualValidation = visualValidator.validateAll(result.stdout, {
        expectColors: ['success', 'primary'],
        expectIcons: ['success'],
        expectStructure: {
          headers: 0,
          lists: 0
        }
      });

      expect(visualValidation.passed).toBe(true);
      expect(visualValidation.warnings.length).toBeLessThan(3);
    });

    test('should handle error output formatting consistently', async () => {
      // Mock error output
      mockCLI.addMockResponse('skills lint /nonexistent', {
        stdout: '',
        stderr: '❌ Error: Directory /nonexistent not found\n💡 Please check the path and try again',
        exitCode: 1,
        duration: 50
      });

      const result = await mockCLI.executeCommand('skills lint', ['/nonexistent']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('❌');
      expect(result.stderr).toContain('💡');

      // Validate error formatting
      const visualValidation = visualValidator.validateAll(result.stderr, {
        expectColors: ['error'],
        expectIcons: ['error', 'info']
      });

      expect(visualValidation.passed).toBe(true);
    });

    test('should create and compare snapshot for skills lint', async () => {
      const result = await mockCLI.executeCommand('skills lint', ['./skills']);

      // Create snapshot if it doesn't exist
      if (!snapshotManager.hasSnapshot('skills lint', ['./skills'])) {
        const snapshot = snapshotManager.createSnapshot('skills lint', ['./skills'], result.stdout);
        snapshotManager.saveSnapshot(snapshot);
      }

      // Compare with snapshot
      const comparison = snapshotManager.compareSnapshot('skills lint', ['./skills'], result.stdout, {
        ignoreNumbers: true,
        ignoreTimestamps: true,
        tolerance: 0.1
      });

      expect(comparison.passed).toBe(true);
      expect(comparison.difference).toBeLessThanOrEqual(0.1);
    });
  });

  describe('Skills Check Command Visual Output', () => {
    test('should display skill matching results with proper formatting', async () => {
      const result = await mockCLI.executeCommand('skills check', ['implement user authentication']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Checking intent');
      expect(result.stdout).toContain('implement user authentication');

      // Validate visual structure
      const visualValidation = visualValidator.validateAll(result.stdout, {
        expectColors: ['primary', 'info'],
        expectStructure: {
          headers: 0,
          lists: 1 // Bullet points for matching skills
        }
      });

      expect(visualValidation.passed).toBe(true);
      expect(visualValidation.metadata.elementsFound.lists).toBeGreaterThan(0);
    });

    test('should handle no matching skills gracefully', async () => {
      const result = await mockCLI.executeCommand('skills check', ['very specific query that matches nothing']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('⚠️');
      expect(result.stdout).toContain('No matching skills');

      // Validate warning formatting
      const visualValidation = visualValidator.validateAll(result.stdout, {
        expectColors: ['warning'],
        expectIcons: ['warning']
      });

      expect(visualValidation.passed).toBe(true);
    });

    test('should maintain consistent formatting for multiple skill matches', async () => {
      // Mock response with multiple matches
      const multiMatchResult = {
        stdout: 'Checking intent: "implement authentication system"\n✅ Found 3 matching skills:\n• authentication-flow (0.92 match)\n  📋 Creates complete authentication flow with login/logout\n• security-guidelines (0.78 match)\n  📋 Provides security best practices and guidelines\n• user-management (0.65 match)\n  📋 Handles user registration and profile management',
        stderr: '',
        exitCode: 0,
        duration: 180
      };

      mockCLI.addMockResponse('skills check "implement authentication system"', multiMatchResult);

      const result = await mockCLI.executeCommand('skills check', ['implement authentication system']);

      // Validate multi-match formatting
      const visualValidation = visualValidator.validateAll(result.stdout, {
        expectColors: ['success', 'primary', 'info'],
        expectIcons: ['success', 'info'],
        expectStructure: {
          lists: 1 // Nested list structure
        }
      });

      expect(visualValidation.passed).toBe(true);
      expect(result.stdout).toContain('0.92 match');
      expect(result.stdout).toContain('0.78 match');
      expect(result.stdout).toContain('0.65 match');
    });
  });

  describe('Skills Rules Command Visual Output', () => {
    test('should display skill rules with consistent formatting', async () => {
      const result = await mockCLI.executeCommand('skills rules');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Current skill rules');

      // Validate rules display formatting
      const visualValidation = visualValidator.validateAll(result.stdout, {
        expectColors: ['primary', 'info'],
        expectStructure: {
          headers: 1, // Main header
          lists: 1   // Rules list
        }
      });

      expect(visualValidation.passed).toBe(true);
    });

    test('should handle rules output with metadata', async () => {
      // Mock rules output with metadata
      const rulesResult = {
        stdout: '# Current Skill Rules\n\n📋 Configuration loaded from: ./configs/skill-rules.json\n\n🎯 Active Rules (12 total):\n• skill-activation-threshold: 0.6\n• max-concurrent-skills: 3\n• error-recovery-enabled: true\n• color-output: auto\n• verbose-logging: false\n\n📊 Last updated: 2025-10-31T14:30:00Z\n🔧 Configuration version: v1.2.0',
        stderr: '',
        exitCode: 0,
        duration: 120
      };

      mockCLI.addMockResponse('skills rules', rulesResult);

      const result = await mockCLI.executeCommand('skills rules');

      // Validate comprehensive rules formatting
      const visualValidation = visualValidator.validateAll(result.stdout, {
        expectColors: ['primary', 'info'],
        expectIcons: ['info', 'success'],
        expectStructure: {
          headers: 1,
          lists: 2  // Configuration and rules lists
        },
        expectMetadata: {
          timestamps: true,
          versionNumbers: true
        }
      });

      expect(visualValidation.passed).toBe(true);
      expect(result.stdout).toContain('Configuration loaded from');
      expect(result.stdout).toContain('Last updated');
    });
  });

  describe('Skills Index Command Visual Output', () => {
    test('should display indexing progress and results', async () => {
      const result = await mockCLI.executeCommand('skills index', ['./skills', '--out', './registry/index.json']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Indexed');
      expect(result.stdout).toContain('skills');

      // Validate indexing output
      const visualValidation = visualValidator.validateAll(result.stdout, {
        expectColors: ['success'],
        expectIcons: ['success'],
        expectMetadata: {
          paths: true
        }
      });

      expect(visualValidation.passed).toBe(true);
    });

    test('should show progress indicators for large skill sets', async () => {
      // Mock large indexing operation
      const largeIndexResult = {
        stdout: 'Indexing skills from: ./skills\n\n📊 Processing 25 skills...\n[████████████████████████████████] 100%\n\n✅ Indexed 25 skills\nRegistry written to: ./registry/index.json\n\n⏱️  Completed in 1.2s',
        stderr: '',
        exitCode: 0,
        duration: 1200
      };

      mockCLI.addMockResponse('skills index ./skills --verbose', largeIndexResult);

      const result = await mockCLI.executeCommand('skills index', ['./skills', '--verbose']);

      // Validate progress indicators
      const visualValidation = visualValidator.validateAll(result.stdout, {
        expectColors: ['info', 'success'],
        expectIcons: ['success', 'info'],
        expectProgress: true
      });

      expect(visualValidation.passed).toBe(true);
      expect(result.stdout).toContain('[████████████]');
      expect(result.stdout).toContain('100%');
      expect(result.stdout).toContain('1.2s');
    });
  });

  describe('Color Consistency Tests', () => {
    test('should maintain consistent color usage across commands', async () => {
      const commands = [
        { cmd: 'skills lint', args: ['./skills'] },
        { cmd: 'skills check', args: ['test query'] },
        { cmd: 'skills rules', args: [] }
      ];

      const colorUsage = new Map<string, Set<string>>();

      for (const { cmd, args } of commands) {
        const result = await mockCLI.executeCommand(cmd, args);
        const colorValidation = visualValidator.validateColors(result.stdout);

        // Track which colors are used by each command
        Object.entries(colorValidation.metadata.elementsFound).forEach(([color, count]) => {
          if (count > 0) {
            if (!colorUsage.has(cmd)) {
              colorUsage.set(cmd, new Set());
            }
            colorUsage.get(cmd)!.add(color);
          }
        });
      }

      // Validate consistent color usage
      expect(colorUsage.size).toBeGreaterThan(0);

      // Success color should be used by successful commands
      const successColorUsed = Array.from(colorUsage.values()).some(colors => colors.has('success'));
      expect(successColorUsed).toBe(true);
    });

    test('should handle color output correctly with environment variables', async () => {
      // Test with different color settings
      const colorTests = [
        { env: { FORCE_COLOR: '1' }, expectedColors: true },
        { env: { NO_COLOR: '1' }, expectedColors: false },
        { env: {}, expectedColors: true } // Default to colors
      ];

      for (const test of colorTests) {
        // Set environment
        Object.entries(test.env).forEach(([key, value]) => {
          process.env[key] = value;
        });

        const result = await mockCLI.executeCommand('skills lint', ['./skills']);

        if (test.expectedColors) {
          expect(result.stdout).toMatch(/\x1b\[/); // Should contain ANSI codes
        } else {
          expect(result.stdout).not.toMatch(/\x1b\[/); // Should not contain ANSI codes
        }
      }

      // Reset environment
      delete process.env.FORCE_COLOR;
      delete process.env.NO_COLOR;
    });
  });

  describe('Format Consistency Tests', () => {
    test('should maintain consistent formatting across different skill counts', async () => {
      const skillCounts = [1, 5, 10, 25];

      for (const count of skillCounts) {
        const mockResult = MockScenarios.generateSkillValidationResults(count, Math.floor(count * 0.1));
        mockCLI.addMockResponse(`skills lint ./test-skills-${count}`, mockResult);

        const result = await mockCLI.executeCommand('skills lint', [`./test-skills-${count}`]);

        // Validate format consistency
        expect(result.stdout).toContain('Validation completed');
        expect(result.stdout).toContain(`${count - Math.floor(count * 0.1)}/${count}`);

        const visualValidation = visualValidator.validateAll(result.stdout, {
          expectColors: ['success', 'warning'],
          expectIcons: ['success', 'warning']
        });

        expect(visualValidation.passed).toBe(true);
      }
    });

    test('should maintain consistent table formatting in skill listings', async () => {
      // Mock tabular skill listing
      const tableResult = {
        stdout: '# Available Skills\n\n┌─────────────────────┬─────────────┬──────────┬─────────────┐\n│ Name                │ Type        │ Severity │ Triggers   │\n├─────────────────────┼─────────────┼──────────┼─────────────┤\n│ authentication-flow │ workflow    │ high     │ auth,login │\n│ database-setup     │ guideline   │ medium   │ db,sql     │\n│ api-design         │ workflow    │ medium   │ api,rest   │\n└─────────────────────┴─────────────┴──────────┴─────────────┘',
        stderr: '',
        exitCode: 0,
        duration: 200
      };

      mockCLI.addMockResponse('skills list --format table', tableResult);

      const result = await mockCLI.executeCommand('skills list', ['--format', 'table']);

      // Validate table formatting
      expect(result.stdout).toContain('┌');
      expect(result.stdout).toContain('│');
      expect(result.stdout).toContain('├');
      expect(result.stdout).toContain('└');

      const visualValidation = visualValidator.validateStructure(result.stdout, {
        tables: 1
      });

      expect(visualValidation.passed).toBe(true);
      expect(visualValidation.metadata.elementsFound.tables).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Visual Tests', () => {
    test('should format error messages consistently', async () => {
      const errorScenarios = [
        { command: 'skills lint', args: ['/invalid'], expectedPattern: /❌/ },
        { command: 'skills check', args: [''], expectedPattern: /⚠️/ },
        { command: 'skills index', args: ['/nonexistent'], expectedPattern: /❌/ }
      ];

      for (const scenario of errorScenarios) {
        const result = await mockCLI.executeCommand(scenario.command, scenario.args);

        if (result.exitCode !== 0) {
          expect(result.stderr).toMatch(scenario.expectedPattern);
        }
      }
    });

    test('should provide helpful visual feedback for common errors', async () => {
      const helpfulErrors = [
        {
          command: 'skills lint',
          args: [''],
          expectedContent: ['Usage:', 'Example:']
        },
        {
          command: 'skills check',
          args: [''],
          expectedContent: ['provide a query', 'Example:']
        }
      ];

      for (const error of helpfulErrors) {
        const result = await mockCLI.executeCommand(error.command, error.args);

        if (result.exitCode !== 0) {
          error.expectedContent.forEach(content => {
            expect(result.stderr + result.stdout).toContain(content);
          });
        }
      }
    });
  });
});