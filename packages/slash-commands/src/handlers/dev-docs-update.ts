/**
 * /dev-docs-update Command Handler
 * Updates existing dev-docs with new content and context
 */

import { SlashCommandHandler } from './base.js';
import { writeFile, readFile, mkdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import {
  ParsedSlashCommand,
  SlashCommandContext,
  SlashCommandResult,
} from '../types.js';

export class DevDocsUpdateHandler extends SlashCommandHandler {
  constructor() {
    super({
      name: 'dev-docs-update',
      description: 'Update existing dev-docs with new content and context',
      category: 'dev-docs',
      requiresAuth: false,
      persistenceLevel: 'session',
      examples: [
        '/dev-docs-update user-auth --type status --status completed',
        '/dev-docs-update user-auth --type content --content "Added OAuth integration"',
        '/dev-docs-update user-auth --type context',
        '/dev-docs-update user-auth --type plan --content "Updated implementation plan"',
        '/dev-docs-update user-auth --type tasks --content "Test authentication flow"'
      ],
      aliases: []
    });
  }
  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const taskName = this.requireArgument(parsedCommand, 0, 'task name');
    const updateType = this.getFlag(parsedCommand, 'type', 'status' as string);
    const content = this.getFlag(parsedCommand, 'content', '' as string);
    const status = this.getFlag(parsedCommand, 'status', 'in-progress' as string);
    const dryRun = this.hasFlag(parsedCommand, 'dry-run');

    const devDocsPath = join(process.cwd(), 'dev', 'active', taskName);

    if (!existsSync(devDocsPath)) {
      return this.createErrorResult(
        this.createError('validation', `Dev-docs for task '${taskName}' not found at ${devDocsPath}`)
      );
    }

    if (dryRun) {
      return this.createSuccessResult(
        `🔍 Dry run: Would update dev-docs for '${taskName}'\n` +
        `Update type: ${updateType}\n` +
        `Status: ${status}\n` +
        `Content: ${content ? `"${content}"` : 'None'}`,
        null,
        ['Execute without --dry-run to apply changes']
      );
    }

    try {
      switch (updateType) {
        case 'status':
          return await this.updateStatus(devDocsPath, status, context);
        case 'content':
          return await this.updateContent(devDocsPath, content, context);
        case 'context':
          return await this.updateContext(devDocsPath, context);
        case 'plan':
          return await this.updatePlan(devDocsPath, content, context);
        case 'tasks':
          return await this.updateTasks(devDocsPath, content, context);
        default:
          return this.createErrorResult(
            this.createError('validation', `Invalid update type: ${updateType}. Valid types: status, content, context, plan, tasks`)
          );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        this.createError('execution', `Failed to update dev-docs: ${errorMessage}`)
      );
    }
  }

  private async updateStatus(
    devDocsPath: string,
    status: string,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const planMdPath = join(devDocsPath, 'plan.md');

    if (!existsSync(planMdPath)) {
      return this.createErrorResult(
        this.createError('validation', `plan.md not found in ${devDocsPath}`)
      );
    }

    let content = await readFile(planMdPath, 'utf-8');

    // Update status in plan.md
    const statusRegex = /(\*\*Status:\*\*)\s*(.+)/i;
    const statusMatch = content.match(statusRegex);

    if (statusMatch) {
      content = content.replace(statusRegex, `$1 ${status}`);
    } else {
      // Add status if not found
      content += `\n\n**Status:** ${status}`;
    }

    await writeFile(planMdPath, content);

    return this.createSuccessResult(
      `✅ Updated status to "${status}" in plan.md`,
      { file: planMdPath, status, timestamp: new Date().toISOString() }
    );
  }

  private async updateContent(
    devDocsPath: string,
    newContent: string,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const contextMdPath = join(devDocsPath, 'context.md');

    let content = '';
    if (existsSync(contextMdPath)) {
      content = await readFile(contextMdPath, 'utf-8');
    }

    // Add new content with timestamp
    const timestamp = new Date().toISOString();
    const updateSection = `\n\n## Update - ${timestamp}\n\n${newContent}`;

    content += updateSection;
    await writeFile(contextMdPath, content);

    return this.createSuccessResult(
      `✅ Added content to context.md`,
      { file: contextMdPath, timestamp, contentLength: newContent.length }
    );
  }

  private async updateContext(
    devDocsPath: string,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const contextMdPath = join(devDocsPath, 'context.md');

    // Capture current workspace state
    const workspaceSnapshot = await this.captureWorkspace();

    let content = '';
    if (existsSync(contextMdPath)) {
      content = await readFile(contextMdPath, 'utf-8');
    }

    const timestamp = new Date().toISOString();
    const contextSection = `\n\n## Context Update - ${timestamp}\n\n` +
      `**Session:** ${context.sessionId}\n` +
      `**Git Status:** ${workspaceSnapshot.gitStatus?.clean ? 'Clean' : 'Modified'}\n` +
      `**Modified Files:** ${workspaceSnapshot.gitStatus?.modified?.join(', ') || 'None'}\n` +
      `**Environment:** ${workspaceSnapshot.env?.NODE_ENV || 'development'}\n` +
      `**Command:** ${context.command.raw}\n`;

    content += contextSection;
    await writeFile(contextMdPath, content);

    return this.createSuccessResult(
      `✅ Updated context.md with current state`,
      { file: contextMdPath, timestamp, workspaceState: true }
    );
  }

  private async updatePlan(
    devDocsPath: string,
    planContent: string,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const planMdPath = join(devDocsPath, 'plan.md');

    if (!planContent) {
      return this.createErrorResult(
        this.createError('validation', 'Plan content is required for plan update. Use --content "your plan content"')
      );
    }

    let content = '';
    if (existsSync(planMdPath)) {
      content = await readFile(planMdPath, 'utf-8');
    }

    const timestamp = new Date().toISOString();
    const updatedPlan = `# Plan Updated - ${timestamp}\n\n${planContent}\n\n---\n\n${content}`;

    await writeFile(planMdPath, updatedPlan);

    return this.createSuccessResult(
      `✅ Updated plan.md with new content`,
      { file: planMdPath, timestamp, contentLength: planContent.length }
    );
  }

  private async updateTasks(
    devDocsPath: string,
    taskContent: string,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const tasksMdPath = join(devDocsPath, 'tasks.md');

    let content = '';
    if (existsSync(tasksMdPath)) {
      content = await readFile(tasksMdPath, 'utf-8');
    }

    const timestamp = new Date().toISOString();
    const taskEntry = `\n- [ ] ${taskContent} *(added ${timestamp})*`;

    if (!content) {
      content = `# Tasks\n\nGenerated at: ${timestamp}\n\n${taskEntry}`;
    } else {
      content += taskEntry;
    }

    await writeFile(tasksMdPath, content);

    return this.createSuccessResult(
      `✅ Added task to tasks.md`,
      { file: tasksMdPath, timestamp, task: taskContent }
    );
  }

  protected getIntegrationType(): 'skill' | 'daemon' | 'cli' | 'native' {
    return 'cli';
  }
}