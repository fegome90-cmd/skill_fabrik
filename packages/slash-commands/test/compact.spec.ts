/**
 * Runtime Tests for Compact Handler
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { CompactHandler } from '../src/handlers/compact.js';
import { SlashCommandContextManager } from '../src/context.js';
import { ParsedSlashCommand, SlashCommandContext } from '../src/types.js';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join, mkdtempSync, rmdirSync, writeFileSync, mkdirSync } from 'path';

describe('/compact command', () => {
  let handler: CompactHandler;
  let contextManager: SlashCommandContextManager;
  let testWorkspace: string;
  let context: SlashCommandContext;

  beforeAll(async () => {
    contextManager = SlashCommandContextManager.getInstance();
    handler = new CompactHandler(
      {
        name: 'compact',
        description: 'Compact workspace and optimize storage',
        category: 'utilities',
        handler: 'compact',
        requiresAuth: false,
        persistenceLevel: 'session'
      },
      contextManager
    );

    // Create temporary workspace
    testWorkspace = mkdtempSync(join(tmpdir(), 'compact-test-'));

    // Initialize Git repository
    execSync('git init', { cwd: testWorkspace, stdio: 'pipe' });
    execSync('git config user.name "Test User"', { cwd: testWorkspace, stdio: 'pipe' });
    execSync('git config user.email "test@example.com"', { cwd: testWorkspace, stdio: 'pipe' });

    // Create some files and make Git history
    writeFileSync(join(testWorkspace, 'package.json'), JSON.stringify({
      name: 'test-project',
      version: '1.0.0'
    }, null, 2));

    execSync('git add .', { cwd: testWorkspace, stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { cwd: testWorkspace, stdio: 'pipe' });

    // Create more commits to have some Git history
    for (let i = 1; i <= 5; i++) {
      writeFileSync(join(testWorkspace, `file${i}.txt`), `Content ${i}\n`);
      execSync(`git add file${i}.txt`, { cwd: testWorkspace, stdio: 'pipe' });
      execSync(`git commit -m "Add file ${i}"`, { cwd: testWorkspace, stdio: 'pipe' });
    }

    // Create build artifacts and cache directories
    mkdirSync(join(testWorkspace, 'dist'), { recursive: true });
    writeFileSync(join(testWorkspace, 'dist', 'bundle.js'), 'console.log("hello");');

    mkdirSync(join(testWorkspace, '.cache'), { recursive: true });
    writeFileSync(join(testWorkspace, '.cache', 'cache1'), 'cached data');
    writeFileSync(join(testWorkspace, '.cache', 'cache2'), 'more cached data');

    // Create MemTech L1 cache directory structure
    mkdirSync(join(testWorkspace, '.sf', 'cache'), { recursive: true });
    writeFileSync(join(testWorkspace, '.sf', 'cache', 'old-cache'), 'old cached content');

    // Set file modification times to simulate old cache
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const fs = require('fs');
    fs.utimesSync(join(testWorkspace, '.sf', 'cache', 'old-cache'), oldDate, oldDate);

    context = await contextManager.createContext(
      'test-session',
      { raw: '/compact', command: 'compact', args: [], flags: {}, options: {} },
      {
        root: testWorkspace,
        packageJson: { name: 'test-project', version: '1.0.0' },
        env: process.env as Record<string, string>
      }
    );
  });

  afterAll(() => {
    // Clean up test workspace
    try {
      rmdirSync(testWorkspace, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Reset context state
    context.state = {};
  });

  describe('validation', () => {
    it('should validate command in Git repository', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: { aggressive: false },
        options: {}
      };

      const result = await handler.validateCommand(parsedCommand, context);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid flag types', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact --aggressive=invalid',
        command: 'compact',
        args: [],
        flags: { aggressive: 'invalid' },
        options: {}
      };

      const result = await handler.validateCommand(parsedCommand, context);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('boolean');
    });

    it('should fail in non-Git repository', async () => {
      const nonGitContext: SlashCommandContext = {
        ...context,
        workspace: { root: '/tmp/non-git' }
      };

      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: {},
        options: {}
      };

      const result = await handler.validateCommand(parsedCommand, nonGitContext);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Git repository');
    });
  });

  describe('execution', () => {
    it('should run compact operation successfully', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact --verbose',
        command: 'compact',
        args: [],
        flags: { verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Workspace Compact Results');
      expect(result.data).toBeDefined();
      expect(result.metadata?.executionTimeMs).toBeGreaterThan(0);
    });

    it('should optimize Git repository', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: { verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('gitOptimization');
      expect(result.data.gitOptimization.success).toBe(true);
      expect(result.data.gitOptimization.operations.length).toBeGreaterThan(0);
    });

    it('should optimize MemTech L1 cache', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: { verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('memTechOptimization');
      expect(result.data.memTechOptimization.success).toBe(true);
    });

    it('should clean build artifacts', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: { verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('buildArtifactsCleanup');
      expect(result.data.buildArtifactsCleanup.success).toBe(true);
    });

    it('should handle aggressive mode', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact --aggressive',
        command: 'compact',
        args: [],
        flags: { aggressive: true, verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.data.memTechOptimization.expiredEntries).toBeGreaterThanOrEqual(0);
    });

    it('should handle dry run mode', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact --dry-run',
        command: 'compact',
        args: [],
        flags: { 'dry-run': true, verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Dry run');

      // Check that files still exist after dry run
      const fs = require('fs');
      expect(fs.existsSync(join(testWorkspace, 'dist'))).toBe(true);
    });

    it('should provide recommendations', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: {},
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toBeDefined();
      expect(Array.isArray(result.data.recommendations)).toBe(true);
      expect(result.data.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide next actions', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: {},
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.nextActions).toBeDefined();
      expect(result.nextActions.length).toBeGreaterThan(0);
      expect(result.nextActions[0]).toContain('/');
    });
  });

  describe('space calculation', () => {
    it('should calculate space saved correctly', async () => {
      // Create large temporary files
      const largeContent = 'x'.repeat(10000); // 10KB
      writeFileSync(join(testWorkspace, 'dist', 'large.js'), largeContent);
      writeFileSync(join(testWorkspace, '.cache', 'large-cache'), largeContent);

      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: { verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.data.totalSpaceSaved).toBeGreaterThanOrEqual(0);
      expect(typeof result.data.totalSpaceSaved).toBe('number');
    });

    it('should format byte sizes correctly', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: { verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+ [A-Z]{2,}/); // Should match formatted byte sizes
    });
  });

  describe('MemTech L1 integration', () => {
    it('should handle missing MemTech directory', async () => {
      // Remove MemTech directory
      const fs = require('fs');
      try {
        fs.rmdirSync(join(testWorkspace, '.sf'), { recursive: true });
      } catch (error) {
        // Directory might not exist
      }

      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: { verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.data.memTechOptimization.success).toBe(true);
    });

    it('should persist results to MemTech L1', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: {},
        options: {}
      };

      await handler.execute(parsedCommand, context);

      // Check if results were persisted
      const updatedContext = await contextManager.getContext(context.sessionId);
      expect(updatedContext.state).toHaveProperty('compactResults');
      expect(updatedContext.metadata?.memtechL1Key).toContain('compact:');
    });
  });

  describe('error handling', () => {
    it('should handle Git operation failures gracefully', async () => {
      // Corrupt Git repository
      try {
        execSync('rm -rf .git/objects', { cwd: testWorkspace, stdio: 'pipe' });
      } catch (error) {
        // Ignore if already removed
      }

      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: { verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true); // Should still succeed with other operations
      expect(result.data.gitOptimization.success).toBe(false);
    });

    it('should handle permission errors gracefully', async () => {
      // Create a file with restricted permissions (if possible)
      const restrictedFile = join(testWorkspace, 'restricted.txt');
      writeFileSync(restrictedFile, 'restricted content');

      try {
        execSync(`chmod 000 ${restrictedFile}`, { cwd: testWorkspace, stdio: 'pipe' });
      } catch (error) {
        // Might not work on all systems
      }

      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: { verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true); // Should handle permission errors gracefully

      // Restore permissions for cleanup
      try {
        execSync(`chmod 644 ${restrictedFile}`, { cwd: testWorkspace, stdio: 'pipe' });
      } catch (error) {
        // Ignore
      }
    });
  });

  describe('performance', () => {
    it('should complete execution within reasonable time', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: {},
        options: {}
      };

      const startTime = Date.now();
      const result = await handler.execute(parsedCommand, context);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max
      expect(result.metadata?.executionTimeMs).toBeGreaterThan(0);
      expect(result.metadata?.executionTimeMs).toBeLessThan(30000);
    });

    it('should handle large number of files efficiently', async () => {
      // Create many small files
      for (let i = 0; i < 100; i++) {
        writeFileSync(join(testWorkspace, '.cache', `cache-${i}`), `content ${i}`);
      }

      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: {},
        options: {}
      };

      const startTime = Date.now();
      const result = await handler.execute(parsedCommand, context);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(60000); // 60 seconds max for many files
    });
  });

  describe('KPI tracking', () => {
    it('should track execution metrics', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: {},
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.executionTimeMs).toBeGreaterThan(0);
      expect(result.metadata.integrationType).toBe('native');
      expect(result.metadata.persistenceKey).toBeDefined();
    });

    it('should track compact-specific metrics', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/compact',
        command: 'compact',
        args: [],
        flags: {},
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.data).toHaveProperty('totalSpaceSaved');
      expect(result.data).toHaveProperty('totalDuration');
      expect(result.data).toHaveProperty('gitOptimization');
      expect(result.data).toHaveProperty('memTechOptimization');
      expect(result.data).toHaveProperty('buildArtifactsCleanup');
    });
  });
});