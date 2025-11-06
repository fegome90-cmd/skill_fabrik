/**
 * Runtime Tests for Build and Fix Handler
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { BuildAndFixHandler } from '../src/handlers/build-and-fix.js';
import { SlashCommandContextManager } from '../src/context.js';
import { ParsedSlashCommand, SlashCommandContext } from '../src/types.js';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join, mkdtempSync, rmdirSync, writeFileSync, mkdirSync } from 'path';

describe('/build-and-fix command', () => {
  let handler: BuildAndFixHandler;
  let contextManager: SlashCommandContextManager;
  let testWorkspace: string;
  let context: SlashCommandContext;

  beforeAll(async () => {
    contextManager = SlashCommandContextManager.getInstance();
    handler = new BuildAndFixHandler(
      {
        name: 'build-and-fix',
        description: 'Build and fix project issues',
        category: 'quality',
        handler: 'build-and-fix',
        requiresAuth: false,
        persistenceLevel: 'session'
      },
      contextManager
    );

    // Create temporary workspace
    testWorkspace = mkdtempSync(join(tmpdir(), 'build-and-fix-test-'));

    // Initialize a basic Node.js project
    execSync('npm init -y', { cwd: testWorkspace, stdio: 'pipe' });
    execSync('npm install -D typescript @types/node prettier jest', { cwd: testWorkspace, stdio: 'pipe' });

    // Create TypeScript config
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        outDir: './dist'
      }
    };
    writeFileSync(join(testWorkspace, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

    // Create basic source files
    mkdirSync(join(testWorkspace, 'src'), { recursive: true });

    // Create a file with TypeScript errors
    const badTsFile = `
export function badFunction() {
  const x: number = "this will cause an error";
  return x;
}

export function unusedFunction() {
  return "this function is never used";
}
    `;
    writeFileSync(join(testWorkspace, 'src', 'bad.ts'), badTsFile);

    // Create a file that needs prettier formatting
    const unformattedFile = `
const unformatted=
{foo:'bar',baz:1}
    `;
    writeFileSync(join(testWorkspace, 'src', 'unformatted.ts'), unformattedFile);

    // Create a test file
    const testFile = `
import { badFunction } from '../src/bad';

describe('test', () => {
  it('should fail', () => {
    expect(badFunction()).toBe("this will fail");
  });
});
    `;
    writeFileSync(join(testWorkspace, 'test', 'bad.test.ts'), testFile);

    context = await contextManager.createContext(
      'test-session',
      { raw: '/build-and-fix', command: 'build-and-fix', args: [], flags: {}, options: {} },
      {
        root: testWorkspace,
        packageJson: require(join(testWorkspace, 'package.json')),
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
    it('should validate command in valid project directory', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true },
        options: {}
      };

      const result = await handler.validateCommand(parsedCommand, context);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid flag types', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix --fix=invalid',
        command: 'build-and-fix',
        args: [],
        flags: { fix: 'invalid' },
        options: {}
      };

      const result = await handler.validateCommand(parsedCommand, context);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('boolean');
    });

    it('should fail in non-project directory', async () => {
      const nonProjectContext: SlashCommandContext = {
        ...context,
        workspace: { root: '/tmp/non-existent' }
      };

      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix',
        command: 'build-and-fix',
        args: [],
        flags: {},
        options: {}
      };

      const result = await handler.validateCommand(parsedCommand, nonProjectContext);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('package.json');
    });
  });

  describe('execution', () => {
    it('should run build and fix successfully', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix --fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true, verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Build and Fix Results');
      expect(result.data).toBeDefined();
      expect(result.metadata?.executionTimeMs).toBeGreaterThan(0);
    }, 30000); // Longer timeout for build operations

    it('should detect and report TypeScript errors', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix --fix=false',
        command: 'build-and-fix',
        args: [],
        flags: { fix: false, verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(false); // Should fail due to TypeScript errors
      expect(result.data).toHaveProperty('typescript');
      expect(result.data.typescript.errors.length).toBeGreaterThan(0);
    }, 30000);

    it('should run prettier formatting', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix --fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true, verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('prettier');
      expect(result.data.prettier.success).toBe(true);
    }, 30000);

    it('should run tests when requested', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix --test',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true, test: true, verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('tests');
      expect(result.data.tests.duration).toBeGreaterThan(0);
    }, 45000); // Even longer timeout for tests

    it('should handle dry run mode', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix --dry-run',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true, 'dry-run': true, verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Dry run');
    }, 30000);

    it('should provide next actions based on results', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.nextActions).toBeDefined();
      expect(result.nextActions.length).toBeGreaterThan(0);
      expect(result.nextActions[0]).toContain('/');
    }, 30000);
  });

  describe('error handling', () => {
    it('should handle missing dependencies gracefully', async () => {
      // Remove node_modules to simulate missing dependencies
      try {
        execSync('rm -rf node_modules', { cwd: testWorkspace, stdio: 'pipe' });
      } catch (error) {
        // Ignore if already removed
      }

      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('execution');
    }, 30000);

    it('should handle TypeScript compilation errors', async () => {
      // Create a file with severe TypeScript errors
      const veryBadTsFile = `
export const veryBadFunction: any = "this is completely wrong";
const undefinedVariable = undefinedVariable + 1;
      `;
      writeFileSync(join(testWorkspace, 'src', 'very-bad.ts'), veryBadTsFile);

      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix --fix=false',
        command: 'build-and-fix',
        args: [],
        flags: { fix: false, verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.success).toBe(false);
      expect(result.data.typescript.errors.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('integration', () => {
    it('should persist results to MemTech L1', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true },
        options: {}
      };

      await handler.execute(parsedCommand, context);

      // Check if results were persisted
      const updatedContext = await contextManager.getContext(context.sessionId);
      expect(updatedContext.state).toHaveProperty('buildResults');
      expect(updatedContext.metadata?.memtechL1Key).toContain('build-and-fix:');
    }, 30000);

    it('should integrate with CLI commands', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true, verbose: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.metadata?.integrationType).toBe('cli');
      expect(result.data).toBeDefined();
    }, 30000);
  });

  describe('performance', () => {
    it('should complete execution within reasonable time', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix --fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true },
        options: {}
      };

      const startTime = Date.now();
      const result = await handler.execute(parsedCommand, context);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max
      expect(result.metadata?.executionTimeMs).toBeGreaterThan(0);
      expect(result.metadata?.executionTimeMs).toBeLessThan(30000);
    }, 35000);

    it('should handle concurrent executions', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true },
        options: {}
      };

      // Run multiple commands concurrently
      const promises = Array(3).fill(null).map(() =>
        handler.execute(parsedCommand, context)
      );

      const results = await Promise.all(promises);

      // All should succeed (though some might be no-ops if files are already fixed)
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.metadata?.executionTimeMs).toBeGreaterThan(0);
      });
    }, 60000); // Longer timeout for concurrent execution
  });

  describe('KPI tracking', () => {
    it('should track execution metrics', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.executionTimeMs).toBeGreaterThan(0);
      expect(result.metadata.integrationType).toBe('cli');
      expect(result.metadata.persistenceKey).toBeDefined();
    }, 30000);

    it('should track build-specific metrics', async () => {
      const parsedCommand: ParsedSlashCommand = {
        raw: '/build-and-fix --fix --test',
        command: 'build-and-fix',
        args: [],
        flags: { fix: true, test: true },
        options: {}
      };

      const result = await handler.execute(parsedCommand, context);

      expect(result.data).toHaveProperty('totalErrors');
      expect(result.data).toHaveProperty('autoFixed');
      expect(result.data).toHaveProperty('suggestions');
      expect(Array.isArray(result.data.suggestions)).toBe(true);
    }, 45000);
  });
});