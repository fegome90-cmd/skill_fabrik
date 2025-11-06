/**
 * Project Index Manager - FASE 2
 * Handles persistent project index for fast cold starts
 */

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { constants } from 'fs';
import { resolve, join } from 'path';
import { existsSync } from 'fs';

export interface ProjectIndex {
  version: string;
  timestamp: number;
  globPatterns: Record<string, string[]>;
  byKeyword: Record<string, string[]>;
  lastScan: number;
  projectPath: string;
  scanDuration?: number;
}

export interface IndexConfig {
  indexPath: string;
  autoUpdate: boolean;
  maxAge: number; // Maximum age in ms before regeneration
  includePatterns: string[];
  excludePatterns: string[];
}

const DEFAULT_CONFIG: IndexConfig = {
  indexPath: '.sf/project-index.json',
  autoUpdate: true,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  includePatterns: ['**/*.ts', '**/*.js', '**/*.json', '**/*.md'],
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
    '**/.cache/**'
  ]
};

class ProjectIndexManager {
  private config: IndexConfig;
  private currentIndex: ProjectIndex | null = null;
  private lastAccess: number = 0;

  constructor(config?: Partial<IndexConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Load existing index or generate new one
   */
  async loadIndex(cwd: string): Promise<ProjectIndex | null> {
    const indexPath = resolve(cwd, this.config.indexPath);

    try {
      // Check if index exists
      await access(indexPath, constants.F_OK);

      // Read index file
      const content = await readFile(indexPath, 'utf-8');
      const index = JSON.parse(content) as ProjectIndex;

      // Check if index is stale
      const age = Date.now() - index.timestamp;
      if (age > this.config.maxAge && this.config.autoUpdate) {
        console.log(`Index is stale (${Math.round(age / 1000 / 60)} minutes old), regenerating...`);
        return await this.generateIndex(cwd);
      }

      this.currentIndex = index;
      this.lastAccess = Date.now();
      return index;
    } catch (error) {
      // Index doesn't exist or couldn't be read
      if (this.config.autoUpdate) {
        console.log('No valid index found, generating new one...');
        return await this.generateIndex(cwd);
      }
      return null;
    }
  }

  /**
   * Generate new project index
   */
  async generateIndex(cwd: string): Promise<ProjectIndex> {
    const startTime = Date.now();
    const indexPath = resolve(cwd, this.config.indexPath);

    const index: ProjectIndex = {
      version: '2.0.0',
      timestamp: Date.now(),
      globPatterns: {},
      byKeyword: {},
      lastScan: Date.now(),
      projectPath: cwd
    };

    // Ensure .sf directory exists
    const sfDir = resolve(cwd, '.sf');
    if (!existsSync(sfDir)) {
      await mkdir(sfDir, { recursive: true });
    }

    try {
      // Index by glob patterns
      for (const pattern of this.config.includePatterns) {
        try {
          const files = await this.scanPattern(pattern, cwd);
          index.globPatterns[pattern] = files;
        } catch (error) {
          console.warn(`Failed to index pattern ${pattern}:`, error);
          index.globPatterns[pattern] = [];
        }
      }

      // Index by keywords
      index.byKeyword = await this.indexByKeywords(index.globPatterns, cwd);

      // Add scan duration
      index.scanDuration = Date.now() - startTime;

      // Save index to file
      await writeFile(indexPath, JSON.stringify(index, null, 2));

      console.log(`✅ Index generated in ${index.scanDuration}ms`);
      console.log(`   Indexed ${Object.values(index.globPatterns).flat().length} files`);

      this.currentIndex = index;
      this.lastAccess = Date.now();
      return index;
    } catch (error) {
      console.error('Failed to generate index:', error);
      throw error;
    }
  }

  /**
   * Scan files matching a pattern
   */
  private async scanPattern(pattern: string, cwd: string): Promise<string[]> {
    const { workerThreadManager } = await import('./worker-thread-manager.js');
    const { resolve } = await import('path');

    // Use worker thread for intensive scanning
    try {
      const task = {
        id: `scan-${Date.now()}`,
        type: 'index_generation' as const,
        data: { cwd, pattern }
      };

      const result = await workerThreadManager.executeTask(task);
      if (result.success && result.data) {
        const patterns = result.data.globPatterns || {};
        return patterns[pattern] || [];
      }
    } catch (error) {
      console.warn('Worker thread scan failed, falling back:', error);
    }

    // Fallback to basic scanning
    return this.basicScan(pattern, cwd);
  }

  /**
   * Basic file scanning (fallback)
   */
  private async basicScan(pattern: string, cwd: string): Promise<string[]> {
    const { readdir, stat } = await import('fs/promises');
    const { constants } = await import('fs');
    const { resolve, join, relative, sep } = await import('path');

    const found: string[] = [];
    const maxDepth = 5;
    const maxFiles = 1000;

    async function scanDir(dirPath: string, depth: number): Promise<void> {
      if (found.length >= maxFiles || depth > maxDepth) {
        return;
      }

      try {
        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          if (found.length >= maxFiles) break;

          // Check exclusions
          const fullPath = join(dirPath, entry.name);
          const relPath = relative(cwd, fullPath).replace(/\\/g, '/');

          if (entry.name.startsWith('.') ||
              entry.name === 'node_modules' ||
              entry.name === 'dist' ||
              entry.name === 'build' ||
              entry.name === '.git' ||
              entry.name === 'coverage') {
            continue;
          }

          if (entry.isDirectory() && depth < maxDepth) {
            await scanDir(fullPath, depth + 1);
          } else if (entry.isFile()) {
            // Simple pattern matching
            if (pattern.includes('**/*.ts') && relPath.endsWith('.ts')) {
              found.push(relPath);
            } else if (pattern.includes('**/*.js') && relPath.endsWith('.js')) {
              found.push(relPath);
            } else if (pattern.includes('**/*.json') && relPath.endsWith('.json')) {
              found.push(relPath);
            } else if (pattern.includes('**/*.md') && relPath.endsWith('.md')) {
              found.push(relPath);
            }
          }
        }
      } catch (error) {
        // Directory not accessible
      }
    }

    await scanDir(cwd, 0);
    return found;
  }

  /**
   * Index files by keywords
   */
  private async indexByKeywords(globPatterns: Record<string, string[]>, cwd: string): Promise<Record<string, string[]>> {
    const tsFiles = globPatterns['**/*.ts'] || [];
    const jsFiles = globPatterns['**/*.js'] || [];
    const allFiles = [...tsFiles, ...jsFiles];

    const keywordIndex: Record<string, string[]> = {
      database: [],
      api: [],
      cache: [],
      performance: [],
      router: [],
      daemon: [],
      cli: [],
      utils: [],
      config: [],
      test: [],
      type: []
    };

    // Simple keyword matching based on file paths
    for (const file of allFiles) {
      const lowerFile = file.toLowerCase();

      if (lowerFile.includes('database') || lowerFile.includes('db') || lowerFile.includes('prisma')) {
        keywordIndex.database.push(file);
      }
      if (lowerFile.includes('api') || lowerFile.includes('route') || lowerFile.includes('controller')) {
        keywordIndex.api.push(file);
      }
      if (lowerFile.includes('cache') || lowerFile.includes('redis') || lowerFile.includes('memtech')) {
        keywordIndex.cache.push(file);
      }
      if (lowerFile.includes('performance') || lowerFile.includes('benchmark') || lowerFile.includes('optimize')) {
        keywordIndex.performance.push(file);
      }
      if (lowerFile.includes('router')) {
        keywordIndex.router.push(file);
      }
      if (lowerFile.includes('daemon')) {
        keywordIndex.daemon.push(file);
      }
      if (lowerFile.includes('cli')) {
        keywordIndex.cli.push(file);
      }
      if (lowerFile.includes('util') || lowerFile.includes('helper')) {
        keywordIndex.utils.push(file);
      }
      if (lowerFile.includes('config')) {
        keywordIndex.config.push(file);
      }
      if (lowerFile.includes('test') || lowerFile.includes('spec')) {
        keywordIndex.test.push(file);
      }
      if (lowerFile.includes('type') || lowerFile.includes('interface')) {
        keywordIndex.type.push(file);
      }
    }

    return keywordIndex;
  }

  /**
   * Get files by keyword
   */
  async getFilesByKeyword(keyword: string, cwd: string): Promise<string[]> {
    if (!this.currentIndex) {
      await this.loadIndex(cwd);
    }

    if (this.currentIndex && this.currentIndex.byKeyword[keyword]) {
      this.lastAccess = Date.now();
      return this.currentIndex.byKeyword[keyword];
    }

    return [];
  }

  /**
   * Get files by glob pattern
   */
  async getFilesByPattern(pattern: string, cwd: string): Promise<string[]> {
    if (!this.currentIndex) {
      await this.loadIndex(cwd);
    }

    if (this.currentIndex && this.currentIndex.globPatterns[pattern]) {
      this.lastAccess = Date.now();
      return this.currentIndex.globPatterns[pattern];
    }

    return [];
  }

  /**
   * Check if index needs update
   */
  needsUpdate(cwd: string): boolean {
    if (!this.currentIndex) return true;

    const age = Date.now() - this.currentIndex.timestamp;
    return age > this.config.maxAge;
  }

  /**
   * Force index regeneration
   */
  async regenerate(cwd: string): Promise<ProjectIndex> {
    return await this.generateIndex(cwd);
  }

  /**
   * Get index statistics
   */
  getStats(): {
    exists: boolean;
    age: number;
    fileCount: number;
    lastAccess: number;
  } {
    if (!this.currentIndex) {
      return {
        exists: false,
        age: 0,
        fileCount: 0,
        lastAccess: 0
      };
    }

    return {
      exists: true,
      age: Date.now() - this.currentIndex.timestamp,
      fileCount: Object.values(this.currentIndex.globPatterns).flat().length,
      lastAccess: this.lastAccess
    };
  }

  /**
   * Cleanup old index
   */
  async cleanup(cwd: string): Promise<void> {
    const indexPath = resolve(cwd, this.config.indexPath);

    try {
      await access(indexPath, constants.F_OK);
      // Delete old index
      await writeFile(indexPath, '');
      this.currentIndex = null;
      console.log('🧹 Index cleaned up');
    } catch (error) {
      // Index doesn't exist
    }
  }
}

// Export singleton instance
export const projectIndexManager = new ProjectIndexManager();

export default ProjectIndexManager;
