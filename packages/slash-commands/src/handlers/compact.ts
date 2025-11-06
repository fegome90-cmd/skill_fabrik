/**
 * Compact Handler
 *
 * Handles repository and memory compaction operations
 * Integrates with MemTech L1 for intelligent cache management
 * Optimizes Git operations and workspace cleanup
 */

import { execSync } from 'child_process';
import { existsSync, statSync, readdirSync, unlinkSync, rmdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import {
  SlashCommandContext,
  ParsedSlashCommand,
  SlashCommandResult
} from '../types.js';
import { SlashCommandHandler } from './base.js';

interface CompactResult {
  gitOptimization: {
    success: boolean;
    spaceSaved: number; // bytes
    operations: string[];
    duration: number;
  };
  memTechOptimization: {
    success: boolean;
    spaceSaved: number; // bytes
    cacheHits: number;
    expiredEntries: number;
    duration: number;
  };
  nodeModulesOptimization?: {
    success: boolean;
    spaceSaved: number; // bytes
    modulesRemoved: string[];
    duration: number;
  };
  buildArtifactsCleanup: {
    success: boolean;
    spaceSaved: number; // bytes
    filesRemoved: number;
    directoriesRemoved: number;
    duration: number;
  };
  totalSpaceSaved: number;
  totalDuration: number;
  recommendations: string[];
}

export class CompactHandler extends SlashCommandHandler {
  constructor(command: any, contextManager?: any) {
    super(command, contextManager);
  }

  /**
   * Validate compact command arguments
   */
  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    const workspaceRoot = context.workspace.root;

    // Check if we're in a Git repository
    const gitDir = join(workspaceRoot, '.git');
    if (!existsSync(gitDir)) {
      return {
        valid: false,
        message: 'Not a Git repository. Compact operations require Git.'
      };
    }

    // Validate flags
    const aggressive = this.getFlag(parsedCommand, 'aggressive', false);
    const dryRun = this.getFlag(parsedCommand, 'dry-run', false);
    const includeNodeModules = this.getFlag(parsedCommand, 'include-node-modules', false);

    if (typeof aggressive !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --aggressive must be a boolean value'
      };
    }

    if (typeof dryRun !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --dry-run must be a boolean value'
      };
    }

    if (typeof includeNodeModules !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --include-node-modules must be a boolean value'
      };
    }

    return { valid: true };
  }

  /**
   * Handle the compact command execution
   */
  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const startTime = Date.now();
    const workspaceRoot = context.workspace.root;

    // Get command options
    const aggressive = this.getFlag(parsedCommand, 'aggressive', false);
    const dryRun = this.getFlag(parsedCommand, 'dry-run', false);
    const includeNodeModules = this.getFlag(parsedCommand, 'include-node-modules', false);
    const verbose = this.getFlag(parsedCommand, 'verbose', false);

    try {
      if (verbose) {
        console.log('🗜️  Starting workspace compaction...');
        console.log(`   Aggressive mode: ${aggressive ? 'ON' : 'OFF'}`);
        console.log(`   Dry run: ${dryRun ? 'ON' : 'OFF'}`);
        console.log(`   Include node_modules: ${includeNodeModules ? 'ON' : 'OFF'}`);
      }

      const results: CompactResult = {
        gitOptimization: { success: false, spaceSaved: 0, operations: [], duration: 0 },
        memTechOptimization: { success: false, spaceSaved: 0, cacheHits: 0, expiredEntries: 0, duration: 0 },
        buildArtifactsCleanup: { success: false, spaceSaved: 0, filesRemoved: 0, directoriesRemoved: 0, duration: 0 },
        totalSpaceSaved: 0,
        totalDuration: 0,
        recommendations: []
      };

      // Step 1: Git repository optimization
      if (verbose) console.log('\n📦 Optimizing Git repository...');
      results.gitOptimization = await this.optimizeGitRepository(workspaceRoot, aggressive, dryRun, verbose);

      // Step 2: MemTech L1 optimization
      if (verbose) console.log('\n🧠 Optimizing MemTech L1 cache...');
      results.memTechOptimization = await this.optimizeMemTechL1(workspaceRoot, aggressive, dryRun, verbose);

      // Step 3: Node modules optimization (optional)
      if (includeNodeModules) {
        if (verbose) console.log('\n📦 Optimizing node_modules...');
        results.nodeModulesOptimization = await this.optimizeNodeModules(workspaceRoot, aggressive, dryRun, verbose);
      }

      // Step 4: Build artifacts cleanup
      if (verbose) console.log('\n🧹 Cleaning build artifacts...');
      results.buildArtifactsCleanup = await this.cleanupBuildArtifacts(workspaceRoot, dryRun, verbose);

      // Calculate totals
      results.totalSpaceSaved = results.gitOptimization.spaceSaved +
                                results.memTechOptimization.spaceSaved +
                                (results.nodeModulesOptimization?.spaceSaved || 0) +
                                results.buildArtifactsCleanup.spaceSaved;

      results.totalDuration = Date.now() - startTime;
      results.recommendations = this.generateRecommendations(results, aggressive);

      // Persist results to MemTech L1
      await this.persistResults(context.sessionId, results);

      const output = this.formatCompactOutput(results, verbose);
      const nextActions = this.generateNextActions(results);

      return {
        success: results.totalSpaceSaved > 0 || dryRun,
        output,
        data: results,
        nextActions
      };

    } catch (error) {
      console.error('❌ Compact operation failed:', error);
      return this.createErrorResult(
        this.createError('execution', `Compact operation failed: ${(error instanceof Error ? error.message : String(error))}`)
      );
    }
  }

  /**
   * Optimize Git repository
   */
  private async optimizeGitRepository(
    root: string,
    aggressive: boolean,
    dryRun: boolean,
    verbose: boolean
  ): Promise<{ success: boolean; spaceSaved: number; operations: string[]; duration: number }> {
    const startTime = Date.now();
    const operations: string[] = [];
    let spaceSaved = 0;
    let success = true;

    try {
      // Get initial size
      const initialSize = this.getDirectorySize(join(root, '.git'));

      if (verbose) console.log(`   Initial .git size: ${this.formatBytes(initialSize)}`);

      // Git garbage collection
      if (!dryRun) {
        try {
          if (verbose) console.log('   Running git gc...');
          execSync('git gc --aggressive', { cwd: root, stdio: 'pipe' });
          operations.push('Git garbage collection completed');
        } catch (error) {
          operations.push('Git gc failed, trying basic cleanup...');
          execSync('git gc', { cwd: root, stdio: 'pipe' });
          operations.push('Basic Git cleanup completed');
        }

        // Clean up reflog
        if (aggressive) {
          try {
            if (verbose) console.log('   Cleaning reflog...');
            execSync('git reflog expire --expire=now --all', { cwd: root, stdio: 'pipe' });
            operations.push('Reflog cleaned');
          } catch (error) {
            operations.push('Reflog cleanup failed (non-critical)');
          }
        }

        // Prune loose objects
        try {
          if (verbose) console.log('   Pruning loose objects...');
          execSync('git prune --expire=now', { cwd: root, stdio: 'pipe' });
          operations.push('Loose objects pruned');
        } catch (error) {
          operations.push('Prune failed (non-critical)');
        }
      } else {
        operations.push('Dry run: Would perform Git optimization operations');
      }

      // Calculate space saved
      const finalSize = this.getDirectorySize(join(root, '.git'));
      spaceSaved = Math.max(0, initialSize - finalSize);

      if (verbose) {
        console.log(`   Final .git size: ${this.formatBytes(finalSize)}`);
        console.log(`   Space saved: ${this.formatBytes(spaceSaved)}`);
      }

    } catch (error) {
      success = false;
      operations.push(`Git optimization failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return {
      success,
      spaceSaved,
      operations,
      duration: Date.now() - startTime
    };
  }

  /**
   * Optimize MemTech L1 cache
   */
  private async optimizeMemTechL1(
    root: string,
    aggressive: boolean,
    dryRun: boolean,
    verbose: boolean
  ): Promise<{ success: boolean; spaceSaved: number; cacheHits: number; expiredEntries: number; duration: number }> {
    const startTime = Date.now();
    let spaceSaved = 0;
    let cacheHits = 0;
    let expiredEntries = 0;
    let success = true;

    try {
      const memtechPath = join(root, '.sf', 'cache');

      if (!existsSync(memtechPath)) {
        return {
          success: true,
          spaceSaved: 0,
          cacheHits: 0,
          expiredEntries: 0,
          duration: Date.now() - startTime
        };
      }

      const initialSize = this.getDirectorySize(memtechPath);

      if (verbose) console.log(`   Initial MemTech L1 size: ${this.formatBytes(initialSize)}`);

      // Scan cache entries
      const entries = this.scanCacheDirectory(memtechPath);
      const now = Date.now();
      const expirationTime = aggressive ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 1 day or 1 week

      for (const entry of entries) {
        const age = now - entry.lastModified;

        if (age > expirationTime) {
          if (!dryRun) {
            try {
              if (entry.isDirectory) {
                this.removeDirectory(entry.path);
              } else {
                unlinkSync(entry.path);
              }
              spaceSaved += entry.size;
              expiredEntries++;
            } catch (error) {
              if (verbose) console.log(`   Failed to remove ${entry.path}: ${(error instanceof Error ? error.message : String(error))}`);
            }
          } else {
            spaceSaved += entry.size;
            expiredEntries++;
          }
        } else {
          cacheHits++;
        }
      }

      // Compact remaining cache files
      if (!dryRun && aggressive) {
        try {
          if (verbose) console.log('   Compacting cache entries...');
          await this.compactCacheEntries(memtechPath);
        } catch (error) {
          if (verbose) console.log(`   Cache compaction failed: ${(error instanceof Error ? error.message : String(error))}`);
        }
      }

      const finalSize = dryRun ? initialSize - spaceSaved : this.getDirectorySize(memtechPath);
      spaceSaved = Math.max(0, initialSize - finalSize);

      if (verbose) {
        console.log(`   Final MemTech L1 size: ${this.formatBytes(finalSize)}`);
        console.log(`   Space saved: ${this.formatBytes(spaceSaved)}`);
        console.log(`   Cache hits: ${cacheHits}`);
        console.log(`   Expired entries: ${expiredEntries}`);
      }

    } catch (error) {
      success = false;
      if (verbose) console.log(`   MemTech optimization failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return {
      success,
      spaceSaved,
      cacheHits,
      expiredEntries,
      duration: Date.now() - startTime
    };
  }

  /**
   * Optimize node_modules (optional, dangerous operation)
   */
  private async optimizeNodeModules(
    root: string,
    aggressive: boolean,
    dryRun: boolean,
    verbose: boolean
  ): Promise<{ success: boolean; spaceSaved: number; modulesRemoved: string[]; duration: number }> {
    const startTime = Date.now();
    const modulesRemoved: string[] = [];
    let spaceSaved = 0;
    let success = true;

    try {
      const nodeModulesPath = join(root, 'node_modules');

      if (!existsSync(nodeModulesPath)) {
        return {
          success: true,
          spaceSaved: 0,
          modulesRemoved: [],
          duration: Date.now() - startTime
        };
      }

      const initialSize = this.getDirectorySize(nodeModulesPath);

      if (verbose) console.log(`   Initial node_modules size: ${this.formatBytes(initialSize)}`);

      if (aggressive && !dryRun) {
        // Remove dev dependencies and test files
        const packageJsonPath = join(root, 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          const devDependencies = Object.keys(packageJson.devDependencies || {});

          for (const dep of devDependencies) {
            const depPath = join(nodeModulesPath, dep);
            if (existsSync(depPath)) {
              try {
                const depSize = this.getDirectorySize(depPath);
                this.removeDirectory(depPath);
                modulesRemoved.push(dep);
                spaceSaved += depSize;
                if (verbose) console.log(`   Removed dev dependency: ${dep} (${this.formatBytes(depSize)})`);
              } catch (error) {
                if (verbose) console.log(`   Failed to remove ${dep}: ${(error instanceof Error ? error.message : String(error))}`);
              }
            }
          }
        }

        // Remove common non-essential files
        const patternsToRemove = [
          '**/README.md',
          '**/CHANGELOG.md',
          '**/LICENSE',
          '**/test/**',
          '**/tests/**',
          '**/*.md',
          '**/*.txt'
        ];

        // This is a simplified implementation
        // In practice, you'd want more sophisticated pattern matching
      } else {
        if (verbose) console.log('   Skipping node_modules optimization (aggressive mode required)');
      }

      const finalSize = dryRun ? initialSize - spaceSaved : this.getDirectorySize(nodeModulesPath);
      spaceSaved = Math.max(0, initialSize - finalSize);

      if (verbose) {
        console.log(`   Final node_modules size: ${this.formatBytes(finalSize)}`);
        console.log(`   Space saved: ${this.formatBytes(spaceSaved)}`);
        console.log(`   Modules removed: ${modulesRemoved.length}`);
      }

    } catch (error) {
      success = false;
      if (verbose) console.log(`   Node modules optimization failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return {
      success,
      spaceSaved,
      modulesRemoved,
      duration: Date.now() - startTime
    };
  }

  /**
   * Clean up build artifacts
   */
  private async cleanupBuildArtifacts(
    root: string,
    dryRun: boolean,
    verbose: boolean
  ): Promise<{ success: boolean; spaceSaved: number; filesRemoved: number; directoriesRemoved: number; duration: number }> {
    const startTime = Date.now();
    let spaceSaved = 0;
    let filesRemoved = 0;
    let directoriesRemoved = 0;
    let success = true;

    try {
      const buildDirs = [
        'dist', 'build', 'out', '.next', '.nuxt', '.output',
        '.cache', 'coverage', '.nyc_output', 'node_modules/.cache'
      ];

      const buildFiles = [
        '*.tsbuildinfo', '*.log', '.DS_Store', 'Thumbs.db'
      ];

      for (const dir of buildDirs) {
        const dirPath = join(root, dir);
        if (existsSync(dirPath)) {
          const dirSize = this.getDirectorySize(dirPath);
          if (!dryRun) {
            try {
              this.removeDirectory(dirPath);
              directoriesRemoved++;
              spaceSaved += dirSize;
              if (verbose) console.log(`   Removed directory: ${dir} (${this.formatBytes(dirSize)})`);
            } catch (error) {
              if (verbose) console.log(`   Failed to remove ${dir}: ${(error instanceof Error ? error.message : String(error))}`);
            }
          } else {
            directoriesRemoved++;
            spaceSaved += dirSize;
            if (verbose) console.log(`   Would remove directory: ${dir} (${this.formatBytes(dirSize)})`);
          }
        }
      }

      // Note: File pattern matching would require a glob library
      // This is a simplified implementation

      if (verbose) {
        console.log(`   Space saved: ${this.formatBytes(spaceSaved)}`);
        console.log(`   Files removed: ${filesRemoved}`);
        console.log(`   Directories removed: ${directoriesRemoved}`);
      }

    } catch (error) {
      success = false;
      if (verbose) console.log(`   Build artifacts cleanup failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return {
      success,
      spaceSaved,
      filesRemoved,
      directoriesRemoved,
      duration: Date.now() - startTime
    };
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(results: CompactResult, aggressive: boolean): string[] {
    const recommendations: string[] = [];

    if (results.totalSpaceSaved === 0) {
      recommendations.push('Workspace is already optimized. Consider running with --aggressive flag.');
    } else {
      recommendations.push(`Successfully freed ${this.formatBytes(results.totalSpaceSaved)} of space.`);
    }

    if (results.memTechOptimization.expiredEntries > 10) {
      recommendations.push('Consider setting up automatic MemTech L1 cleanup.');
    }

    if (!results.nodeModulesOptimization && !aggressive) {
      recommendations.push('Use --include-node-modules --aggressive for deeper optimization.');
    }

    recommendations.push('Run /build-and-fix after optimization to ensure everything works correctly.');
    recommendations.push('Consider setting up .gitignore to exclude build artifacts.');

    return recommendations;
  }

  /**
   * Generate next actions
   */
  private generateNextActions(results: CompactResult): string[] {
    const actions: string[] = ['/build-and-fix'];

    if (results.totalSpaceSaved > 0) {
      actions.push('/git-status');
    }

    if (results.memTechOptimization.cacheHits > 0) {
      actions.push('/memtech-status');
    }

    return actions;
  }

  /**
   * Format output for display
   */
  private formatCompactOutput(results: CompactResult, verbose: boolean): string {
    let output = '## Workspace Compact Results\n\n';

    // Summary
    output += `### Summary\n`;
    output += `- Total Space Saved: ${this.formatBytes(results.totalSpaceSaved)}\n`;
    output += `- Total Duration: ${results.totalDuration}ms\n`;
    output += `- Status: ${results.totalSpaceSaved > 0 ? '✅ Optimized' : 'ℹ️  Already optimized'}\n\n`;

    // Git optimization
    output += `### Git Repository Optimization ${results.gitOptimization.success ? '✅' : '❌'}\n`;
    output += `- Space Saved: ${this.formatBytes(results.gitOptimization.spaceSaved)}\n`;
    output += `- Duration: ${results.gitOptimization.duration}ms\n`;
    if (verbose && results.gitOptimization.operations.length > 0) {
      output += `- Operations:\n`;
      results.gitOptimization.operations.forEach(op => {
        output += `  - ${op}\n`;
      });
    }
    output += '\n';

    // MemTech optimization
    output += `### MemTech L1 Optimization ${results.memTechOptimization.success ? '✅' : '❌'}\n`;
    output += `- Space Saved: ${this.formatBytes(results.memTechOptimization.spaceSaved)}\n`;
    output += `- Cache Hits: ${results.memTechOptimization.cacheHits}\n`;
    output += `- Expired Entries: ${results.memTechOptimization.expiredEntries}\n`;
    output += `- Duration: ${results.memTechOptimization.duration}ms\n\n`;

    // Node modules optimization (if applicable)
    if (results.nodeModulesOptimization) {
      output += `### Node Modules Optimization ${results.nodeModulesOptimization.success ? '✅' : '❌'}\n`;
      output += `- Space Saved: ${this.formatBytes(results.nodeModulesOptimization.spaceSaved)}\n`;
      output += `- Modules Removed: ${results.nodeModulesOptimization.modulesRemoved.length}\n`;
      output += `- Duration: ${results.nodeModulesOptimization.duration}ms\n`;
      if (verbose && results.nodeModulesOptimization.modulesRemoved.length > 0) {
        output += `- Removed Modules:\n`;
        results.nodeModulesOptimization.modulesRemoved.forEach(module => {
          output += `  - ${module}\n`;
        });
      }
      output += '\n';
    }

    // Build artifacts cleanup
    output += `### Build Artifacts Cleanup ${results.buildArtifactsCleanup.success ? '✅' : '❌'}\n`;
    output += `- Space Saved: ${this.formatBytes(results.buildArtifactsCleanup.spaceSaved)}\n`;
    output += `- Files Removed: ${results.buildArtifactsCleanup.filesRemoved}\n`;
    output += `- Directories Removed: ${results.buildArtifactsCleanup.directoriesRemoved}\n`;
    output += `- Duration: ${results.buildArtifactsCleanup.duration}ms\n\n`;

    // Recommendations
    if (results.recommendations.length > 0) {
      output += `### Recommendations\n`;
      results.recommendations.forEach(rec => {
        output += `- ${rec}\n`;
      });
      output += '\n';
    }

    return output;
  }

  /**
   * Utility methods
   */
  private getDirectorySize(dirPath: string): number {
    try {
      let totalSize = 0;
      const files = readdirSync(dirPath);

      for (const file of files) {
        const filePath = join(dirPath, file);
        const stats = statSync(filePath);

        if (stats.isDirectory()) {
          totalSize += this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private scanCacheDirectory(dirPath: string): Array<{ path: string; size: number; lastModified: number; isDirectory: boolean }> {
    const entries: Array<{ path: string; size: number; lastModified: number; isDirectory: boolean }> = [];

    try {
      const files = readdirSync(dirPath);

      for (const file of files) {
        const filePath = join(dirPath, file);
        const stats = statSync(filePath);

        entries.push({
          path: filePath,
          size: stats.isDirectory() ? this.getDirectorySize(filePath) : stats.size,
          lastModified: stats.mtime.getTime(),
          isDirectory: stats.isDirectory()
        });

        if (stats.isDirectory()) {
          entries.push(...this.scanCacheDirectory(filePath));
        }
      }
    } catch (error) {
      // Ignore errors for individual files
    }

    return entries;
  }

  private removeDirectory(dirPath: string): void {
    try {
      const files = readdirSync(dirPath);

      for (const file of files) {
        const filePath = join(dirPath, file);
        const stats = statSync(filePath);

        if (stats.isDirectory()) {
          this.removeDirectory(filePath);
        } else {
          unlinkSync(filePath);
        }
      }

      rmdirSync(dirPath);
    } catch (error) {
      // Ignore errors for individual files
    }
  }

  private async compactCacheEntries(cachePath: string): Promise<void> {
    // This would implement cache compaction logic
    // For now, it's a placeholder
    return Promise.resolve();
  }

  /**
   * Persist results to MemTech L1
   */
  private async persistResults(sessionId: string, results: CompactResult): Promise<void> {
    try {
      await this.contextManager.updateContext(sessionId, {
        state: {
          compactResults: results,
          lastRun: new Date().toISOString(),
          workspaceSnapshot: await this.captureWorkspace()
        },
        metadata: {}
      });
    } catch (error) {
      console.warn('Failed to persist results to MemTech L1:', error);
    }
  }

  /**
   * Get integration type
   */
  protected getIntegrationType(): 'skill' | 'daemon' | 'cli' | 'native' {
    return 'native';
  }
}