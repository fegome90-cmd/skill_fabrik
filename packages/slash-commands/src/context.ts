/**
 * Slash Command Context Manager with MemTech Integration
 */

import { randomUUID } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

// Helper to get directory name (fallback to current working directory)
const __dirname = process.cwd();

import {
  SlashCommandContext,
  PersistentSlashContext,
  WorkspaceSnapshot,
  GitStatus,
  CommandMetadata,
  ParsedSlashCommand,
} from './types.js';

export class SlashCommandContextManager {
  private static instance: SlashCommandContextManager;
  private memTechL1Path: string;
  private contextCache: Map<string, SlashCommandContext> = new Map();
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(memTechL1Path?: string) {
    this.memTechL1Path = memTechL1Path || this.getDefaultMemTechPath();
  }

  static getInstance(memTechL1Path?: string): SlashCommandContextManager {
    if (!SlashCommandContextManager.instance) {
      SlashCommandContextManager.instance = new SlashCommandContextManager(memTechL1Path);
    }
    return SlashCommandContextManager.instance;
  }

  private getDefaultMemTechPath(): string {
    return join(__dirname, '..', '..', '.sf', 'cache', 'slash-contexts');
  }

  /**
   * Create a new slash command context
   */
  async createContext(
    sessionId: string,
    command: ParsedSlashCommand,
    workspace: WorkspaceSnapshot,
    initialState: Record<string, any> = {}
  ): Promise<SlashCommandContext> {
    const context: SlashCommandContext = {
      sessionId,
      workspace,
      command,
      metadata: {
        success: false,
        integrationType: 'native',
      },
      state: initialState,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Cache in memory
    this.contextCache.set(sessionId, context);

    // Persist to MemTech L1
    await this.persistContext(context);

    return context;
  }

  /**
   * Get context by session ID
   */
  async getContext(sessionId: string): Promise<SlashCommandContext | null> {
    // Check memory cache first
    if (this.contextCache.has(sessionId)) {
      return this.contextCache.get(sessionId)!;
    }

    // Load from MemTech L1
    const persistentContext = await this.loadPersistentContext(sessionId);
    if (!persistentContext) {
      return null;
    }

    // Convert back to SlashCommandContext
    const context = this.fromPersistentContext(persistentContext);
    this.contextCache.set(sessionId, context);

    return context;
  }

  /**
   * Update context state
   */
  async updateContext(
    sessionId: string,
    updates: {
      state?: Partial<Record<string, any>>;
      metadata?: Partial<CommandMetadata>;
      workspace?: Partial<WorkspaceSnapshot>;
    }
  ): Promise<SlashCommandContext | null> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return null;
    }

    // Apply updates
    if (updates.state) {
      context.state = { ...context.state, ...updates.state };
    }

    if (updates.metadata) {
      context.metadata = { ...context.metadata, ...updates.metadata };
    }

    if (updates.workspace) {
      context.workspace = { ...context.workspace, ...updates.workspace };
    }

    context.updatedAt = new Date();

    // Update cache and persist
    this.contextCache.set(sessionId, context);
    await this.persistContext(context);

    return context;
  }

  /**
   * Delete context
   */
  async deleteContext(sessionId: string): Promise<void> {
    this.contextCache.delete(sessionId);
    await this.deletePersistentContext(sessionId);
  }

  /**
   * Compact a context for long conversations
   */
  async compactContext(
    sessionId: string,
    maxHistoryItems: number = 50
  ): Promise<SlashCommandContext | null> {
    const context = await this.getContext(sessionId);
    if (!context) {
      return null;
    }

    // Extract key information to preserve
    const compactedState: Record<string, any> = {
      // Keep recent command history
      recentCommands: (context.state.commandHistory || []).slice(-maxHistoryItems),

      // Keep important state
      currentTask: context.state.currentTask,
      objectives: context.state.objectives,
      risks: context.state.risks,
      decisions: context.state.decisions,

      // Keep workspace state
      workspaceSnapshot: context.workspace,

      // Keep metadata
      executionSummary: context.metadata,

      // Compaction metadata
      compacted: true,
      compactedAt: new Date().toISOString(),
      originalContextSize: JSON.stringify(context).length,
    };

    // Update context with compacted state
    await this.updateContext(sessionId, { state: compactedState });

    return await this.getContext(sessionId);
  }

  /**
   * Get workspace snapshot
   */
  async captureWorkspaceSnapshot(rootPath: string): Promise<WorkspaceSnapshot> {
    const workspace: WorkspaceSnapshot = {
      root: rootPath,
    };

    try {
      // Get git status
      workspace.gitStatus = await this.getGitStatus(rootPath);

      // Read package.json if it exists
      const packageJsonPath = join(rootPath, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
        workspace.packageJson = JSON.parse(packageJsonContent);
      }

      // Get environment variables (non-sensitive)
      workspace.env = {
        NODE_ENV: process.env.NODE_ENV || 'development',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        SF_STORAGE_L0: process.env.SF_STORAGE_L0 || '.sf',
        SF_STORAGE_L1: process.env.SF_STORAGE_L1 || '.sf/cache',
      };

    } catch (error) {
      console.warn('Failed to capture complete workspace snapshot:', error);
    }

    return workspace;
  }

  /**
   * Get git status information
   */
  private async getGitStatus(rootPath: string): Promise<GitStatus | undefined> {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd use a Git library or execute git commands
      return {
        branch: 'main', // Would get from git
        commit: 'abc123', // Would get from git
        clean: false,
        modified: ['src/file1.ts', 'src/file2.ts'],
        staged: ['src/file3.ts'],
        untracked: ['new-file.ts'],
      };
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Persist context to MemTech L1
   */
  private async persistContext(context: SlashCommandContext): Promise<void> {
    const persistentContext: PersistentSlashContext = {
      id: context.sessionId,
      sessionId: context.sessionId,
      command: context.command.command,
      state: context.state,
      workspaceSnapshot: context.workspace,
      memtechL1Key: this.generateMemTechKey(context.sessionId),
      createdAt: context.createdAt.toISOString(),
      updatedAt: context.updatedAt.toISOString(),
      expiresAt: new Date(Date.now() + this.defaultTTL).toISOString(),
    };

    const filePath = this.getContextFilePath(context.sessionId);

    try {
      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });

      // Write context to file
      await writeFile(filePath, JSON.stringify(persistentContext, null, 2));
    } catch (error) {
      console.error('Failed to persist context:', error);
      throw error;
    }
  }

  /**
   * Load persistent context from MemTech L1
   */
  private async loadPersistentContext(sessionId: string): Promise<PersistentSlashContext | null> {
    const filePath = this.getContextFilePath(sessionId);

    try {
      if (!existsSync(filePath)) {
        return null;
      }

      const content = await readFile(filePath, 'utf-8');
      const persistentContext = JSON.parse(content) as PersistentSlashContext;

      // Check if expired
      if (persistentContext.expiresAt && new Date(persistentContext.expiresAt) < new Date()) {
        await this.deletePersistentContext(sessionId);
        return null;
      }

      return persistentContext;
    } catch (error) {
      console.error('Failed to load persistent context:', error);
      return null;
    }
  }

  /**
   * Delete persistent context
   */
  private async deletePersistentContext(sessionId: string): Promise<void> {
    const filePath = this.getContextFilePath(sessionId);

    try {
      if (existsSync(filePath)) {
        await this.unlink(filePath);
      }
    } catch (error) {
      console.error('Failed to delete persistent context:', error);
    }
  }

  /**
   * Convert persistent context back to SlashCommandContext
   */
  private fromPersistentContext(persistent: PersistentSlashContext): SlashCommandContext {
    return {
      sessionId: persistent.sessionId,
      workspace: persistent.workspaceSnapshot,
      command: {
        raw: `/${persistent.command}`,
        command: persistent.command,
        args: [],
        flags: {},
        options: {},
      },
      metadata: {
        success: true,
        integrationType: 'native',
      },
      state: persistent.state,
      createdAt: new Date(persistent.createdAt),
      updatedAt: new Date(persistent.updatedAt),
    };
  }

  /**
   * Generate MemTech L1 key for context
   */
  private generateMemTechKey(sessionId: string): string {
    return `slash:context:${sessionId}`;
  }

  /**
   * Get file path for context
   */
  private getContextFilePath(sessionId: string): string {
    return join(this.memTechL1Path, `${sessionId}.json`);
  }

  /**
   * Clean up expired contexts
   */
  async cleanupExpiredContexts(): Promise<number> {
    let cleanedCount = 0;

    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.memTechL1Path);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = join(this.memTechL1Path, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const persistentContext = JSON.parse(content) as PersistentSlashContext;

        if (persistentContext.expiresAt && new Date(persistentContext.expiresAt) < new Date()) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired contexts:', error);
    }

    return cleanedCount;
  }

  /**
   * Get context statistics
   */
  async getStats(): Promise<{
    totalContexts: number;
    activeContexts: number;
    expiredContexts: number;
    averageContextSize: number;
    oldestContext: Date | null;
    newestContext: Date | null;
  }> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.memTechL1Path);

      let totalSize = 0;
      let activeCount = 0;
      let expiredCount = 0;
      let oldestDate: Date | null = null;
      let newestDate: Date | null = null;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = join(this.memTechL1Path, file);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        const persistentContext = JSON.parse(content) as PersistentSlashContext;

        totalSize += stats.size;

        const createdAt = new Date(persistentContext.createdAt);
        if (!oldestDate || createdAt < oldestDate) oldestDate = createdAt;
        if (!newestDate || createdAt > newestDate) newestDate = createdAt;

        if (persistentContext.expiresAt && new Date(persistentContext.expiresAt) < new Date()) {
          expiredCount++;
        } else {
          activeCount++;
        }
      }

      return {
        totalContexts: files.filter(f => f.endsWith('.json')).length,
        activeContexts: activeCount,
        expiredContexts: expiredCount,
        averageContextSize: files.length > 0 ? totalSize / files.length : 0,
        oldestContext: oldestDate,
        newestContext: newestDate,
      };
    } catch (error) {
      console.error('Failed to get context stats:', error);
      return {
        totalContexts: 0,
        activeContexts: 0,
        expiredContexts: 0,
        averageContextSize: 0,
        oldestContext: null,
        newestContext: null,
      };
    }
  }

  /**
   * Unlink file helper (Node.js 20+)
   */
  private async unlink(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.unlink(filePath);
  }
}