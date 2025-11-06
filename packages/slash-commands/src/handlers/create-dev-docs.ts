/**
 * /create-dev-docs Command Handler
 * Materializes dev/active/<task>/{plan.md,context.md,tasks.md} + MemTech L1 snapshot
 */

import { SlashCommandHandler } from './base.js';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import {
  ParsedSlashCommand,
  SlashCommandContext,
  SlashCommandResult,
  DevDocsPlan,
} from '../types.js';

export class CreateDevDocsHandler extends SlashCommandHandler {
  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const taskName = this.requireArgument(parsedCommand, 0, 'task name');
    const plan = this.getFlag(parsedCommand, 'plan', '' as string);
    const force = this.hasFlag(parsedCommand, 'force');
    const format = this.getOption(parsedCommand, 'f', 'markdown') as any;

    // Create or use existing plan
    let devDocsPlan: DevDocsPlan;
    if (plan) {
      // Use provided plan (could be file path, JSON string, or context reference)
      devDocsPlan = await this.loadPlan(plan, context);
    } else {
      // Try to get plan from context (previous /dev-docs command)
      const contextPlan = context.state.lastGeneratedPlan;
      if (!contextPlan) {
        throw this.createError(
          'validation',
          'No plan found in context. Use /dev-docs first to generate a plan, or provide --plan parameter'
        );
      }
      devDocsPlan = contextPlan;
    }

    // Create directory structure
    const devPath = join(process.cwd(), 'dev', 'active', this.sanitizeTaskName(taskName));

    if (!force && existsSync(devPath)) {
      throw this.createError(
        'validation',
        `Dev docs directory already exists: ${devPath}. Use --force to overwrite`
      );
    }

    await mkdir(devPath, { recursive: true });

    // Create files
    const files = await this.createDevDocsFiles(devPath, taskName, devDocsPlan, context, {
      format,
      includeContext: this.hasFlag(parsedCommand, 'include-context'),
      snapshotWorkspace: this.hasFlag(parsedCommand, 'snapshot'),
    });

    // Create MemTech L1 snapshot
    let memtechKey: string | undefined;
    if (this.hasFlag(parsedCommand, 'snapshot') || this.command.integration?.memTechL1) {
      memtechKey = await this.createMemTechSnapshot(taskName, devDocsPlan, context);
    }

    // Update context
    await this.contextManager.updateContext(context.sessionId, {
      state: {
        createdDevDocs: {
          taskName,
          path: devPath,
          files,
          planId: devDocsPlan.id,
          memtechKey,
          createdAt: new Date().toISOString(),
        },
        lastGeneratedPlan: devDocsPlan, // Keep plan in context
      }
    });

    const output = this.formatOutput(`
✅ Dev docs created successfully!

**Task:** ${taskName}
**Location:** ${devPath}
**Plan ID:** ${devDocsPlan.id}
**Files Created:** ${files.length}

${memtechKey ? `**MemTech Snapshot:** ${memtechKey}` : ''}

## Next Steps:
1. Review the generated files in ${devPath}
2. Update tasks.md with specific implementation details
3. Update context.md with project-specific information
4. Use /dev-docs-update to mark progress and add findings

## Files Created:
${files.map(f => `- **${f.name}** (${f.path})`).join('\n')}
`, format);

    return this.createSuccessResult(
      output,
      {
        taskName,
        path: devPath,
        files,
        planId: devDocsPlan.id,
        memtechKey,
      },
      [
        `Review generated files: ${devPath}`,
        'Use /dev-docs-update to track progress',
        'Use /build-and-fix to validate implementation',
        'Use /code-review for quality checks',
      ]
    );
  }

  protected async validateCommand(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<{ valid: boolean; message?: string }> {
    const taskName = this.getArgument(parsedCommand, 0);

    if (!taskName) {
      return { valid: false, message: 'Task name is required' };
    }

    if (taskName.length < 3) {
      return { valid: false, message: 'Task name must be at least 3 characters' };
    }

    if (taskName.length > 50) {
      return { valid: false, message: 'Task name must be less than 50 characters' };
    }

    // Validate task name format
    if (!/^[a-zA-Z0-9-_]+$/.test(taskName)) {
      return {
        valid: false,
        message: 'Task name must contain only letters, numbers, hyphens, and underscores'
      };
    }

    // Check if plan is available
    const planFlag = this.getFlag(parsedCommand, 'plan', '' as string);
    const contextPlan = context.state.lastGeneratedPlan;

    if (!planFlag && !contextPlan) {
      return {
        valid: false,
        message: 'No plan available. Run /dev-docs first or provide --plan parameter'
      };
    }

    return { valid: true };
  }

  private sanitizeTaskName(taskName: string): string {
    return taskName
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async loadPlan(planSource: string, context: SlashCommandContext): Promise<DevDocsPlan> {
    // Try to load as file path
    if (existsSync(planSource)) {
      try {
        const content = await readFile(planSource, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        throw this.createError('validation', `Failed to load plan from file: ${planSource}`);
      }
    }

    // Try to parse as JSON string
    try {
      return JSON.parse(planSource);
    } catch {
      // Try to get from context by ID
      if (context.state.lastGeneratedPlan?.id === planSource) {
        return context.state.lastGeneratedPlan;
      }

      throw this.createError(
        'validation',
        `Invalid plan source: ${planSource}. Must be a file path, JSON string, or valid plan ID`
      );
    }
  }

  private async createDevDocsFiles(
    devPath: string,
    taskName: string,
    plan: DevDocsPlan,
    context: SlashCommandContext,
    options: {
      format: string;
      includeContext: boolean;
      snapshotWorkspace: boolean;
    }
  ): Promise<Array<{ name: string; path: string; content: string }>> {
    const files: Array<{ name: string; path: string; content: string }> = [];

    // Create plan.md
    const planContent = this.generatePlanMarkdown(plan);
    const planPath = join(devPath, 'plan.md');
    await writeFile(planPath, planContent);
    files.push({ name: 'plan.md', path: planPath, content: planContent });

    // Create context.md
    const contextContent = this.generateContextMarkdown(taskName, plan, context, options);
    const contextPath = join(devPath, 'context.md');
    await writeFile(contextPath, contextContent);
    files.push({ name: 'context.md', path: contextPath, content: contextContent });

    // Create tasks.md
    const tasksContent = this.generateTasksMarkdown(plan);
    const tasksPath = join(devPath, 'tasks.md');
    await writeFile(tasksPath, tasksContent);
    files.push({ name: 'tasks.md', path: tasksPath, content: tasksContent });

    // Create README.md
    const readmeContent = this.generateReadmeMarkdown(taskName, plan, context);
    const readmePath = join(devPath, 'README.md');
    await writeFile(readmePath, readmeContent);
    files.push({ name: 'README.md', path: readmePath, content: readmeContent });

    // Create workspace snapshot if requested
    if (options.snapshotWorkspace) {
      const snapshotContent = this.generateWorkspaceSnapshot(context.workspace);
      const snapshotPath = join(devPath, 'workspace-snapshot.json');
      await writeFile(snapshotPath, JSON.stringify(snapshotContent, null, 2));
      files.push({ name: 'workspace-snapshot.json', path: snapshotPath, content: snapshotContent });
    }

    return files;
  }

  private generatePlanMarkdown(plan: DevDocsPlan): string {
    let content = `# ${plan.title}\n\n`;
    content += `**Plan ID:** ${plan.id}\n`;
    content += `**Created:** ${plan.createdAt.toLocaleDateString()}\n`;
    content += `**Last Updated:** ${plan.updatedAt.toLocaleDateString()}\n\n`;

    content += `## Description\n\n${plan.description}\n\n`;

    // Objectives
    content += `## 📋 Objectives\n\n`;
    plan.objectives.forEach((objective, index) => {
      content += `${index + 1}. [ ] ${objective}\n`;
    });
    content += '\n';

    // Phases
    content += `## 🔄 Phases\n\n`;
    plan.phases.forEach((phase, phaseIndex) => {
      const statusEmoji = this.getStatusEmoji(phase.status);
      content += `### ${phaseIndex + 1}. ${statusEmoji} ${phase.name}\n\n`;
      content += `${phase.description}\n\n`;

      content += `**Status:** ${phase.status}\n`;
      if (phase.dependencies && phase.dependencies.length > 0) {
        content += `**Dependencies:** ${phase.dependencies.join(', ')}\n`;
      }
      content += '\n';

      content += `**Tasks:**\n`;
      phase.tasks.forEach((task, taskIndex) => {
        const taskStatusEmoji = this.getStatusEmoji(task.status);
        content += `- ${taskIndex + 1}. ${taskStatusEmoji} **${task.title}**\n`;
        content += `  - ${task.description}\n`;
        if (task.estimatedHours) {
          content += `  - **Estimated:** ${task.estimatedHours}h\n`;
        }
        if (task.actualHours) {
          content += `  - **Actual:** ${task.actualHours}h\n`;
        }
        if (task.assignee) {
          content += `  - **Assignee:** ${task.assignee}\n`;
        }
        content += '\n';
      });
    });

    // Risks
    if (plan.risks.length > 0) {
      content += `## ⚠️ Risks\n\n`;
      plan.risks.forEach((risk) => {
        const riskEmoji = this.getRiskEmoji(risk.probability, risk.impact);
        content += `### ${riskEmoji} ${risk.title}\n\n`;
        content += `**Description:** ${risk.description}\n`;
        content += `**Probability:** ${risk.probability} | **Impact:** ${risk.impact}\n`;
        content += `**Status:** ${risk.status}\n`;
        if (risk.mitigation) {
          content += `**Mitigation:** ${risk.mitigation}\n`;
        }
        content += '\n';
      });
    }

    // KPIs
    content += `## 📊 Success Metrics (KPIs)\n\n`;
    plan.kpis.forEach((kpi) => {
      content += `- **${kpi.name}:** Target ${kpi.target} ${kpi.unit}`;
      if (kpi.current) {
        content += ` (Current: ${kpi.current} ${kpi.unit})`;
      }
      content += '\n';
    });

    return content;
  }

  private generateContextMarkdown(
    taskName: string,
    plan: DevDocsPlan,
    context: SlashCommandContext,
    options: { includeContext: boolean; snapshotWorkspace: boolean }
  ): string {
    let content = `# Context: ${taskName}\n\n`;
    content += `**Generated:** ${new Date().toLocaleDateString()}\n`;
    content += `**Plan ID:** ${plan.id}\n`;
    content += `**Session ID:** ${context.sessionId}\n\n`;

    // Task Overview
    content += `## 📋 Task Overview\n\n`;
    content += `**Description:** ${plan.description}\n\n`;
    content += `**Type:** ${this.identifyTaskType(plan.description)}\n`;
    content += `**Complexity:** ${this.assessComplexity(plan.description)}\n`;
    content += `**Scope:** ${this.identifyScope(plan.description)}\n\n`;

    // Workspace Context
    if (options.includeContext) {
      content += `## 🏗️ Workspace Context\n\n`;
      content += `**Root:** ${context.workspace.root}\n`;

      if (context.workspace.packageJson) {
        content += `**Project:** ${context.workspace.packageJson.name || 'Unknown'}\n`;
        content += `**Version:** ${context.workspace.packageJson.version || 'Unknown'}\n`;
      }

      if (context.workspace.gitStatus) {
        content += `**Git Branch:** ${context.workspace.gitStatus.branch}\n`;
        content += `**Git Status:** ${context.workspace.gitStatus.clean ? 'Clean' : 'Dirty'}\n`;
        if (!context.workspace.gitStatus.clean) {
          content += `**Modified Files:** ${context.workspace.gitStatus.modified.length}\n`;
          content += `**Staged Files:** ${context.workspace.gitStatus.staged.length}\n`;
        }
      }

      if (context.workspace.openFiles && context.workspace.openFiles.length > 0) {
        content += `**Open Files:** ${context.workspace.openFiles.join(', ')}\n`;
      }

      content += '\n';
    }

    // Environment Context
    if (context.workspace.env) {
      content += `## 🔧 Environment Context\n\n`;
      Object.entries(context.workspace.env).forEach(([key, value]) => {
        if (value) {
          content += `**${key}:** ${value}\n`;
        }
      });
      content += '\n';
    }

    // Execution Context
    content += `## ⚡ Execution Context\n\n`;
    content += `**Command:** ${context.command.raw}\n`;
    content += `**Created:** ${context.createdAt.toLocaleString()}\n`;
    content += `**Last Updated:** ${context.updatedAt.toLocaleString()}\n\n`;

    // Notes Section
    content += `## 📝 Notes\n\n`;
    content += `*Use this section to track important findings, decisions, and context-specific information*\n\n`;
    content += `### Key Findings\n\n`;
    content += `- \n\n`;
    content += `### Decisions Made\n\n`;
    content += `1. \n\n`;
    content += `### Open Questions\n\n`;
    content += `- \n\n`;

    return content;
  }

  private generateTasksMarkdown(plan: DevDocsPlan): string {
    let content = `# Task Breakdown\n\n`;
    content += `**Plan:** ${plan.title}\n`;
    content += `**Plan ID:** ${plan.id}\n`;
    content += `**Total Tasks:** ${plan.phases.reduce((sum, phase) => sum + phase.tasks.length, 0)}\n\n`;

    // Task Summary
    content += `## 📊 Task Summary\n\n`;
    const totalTasks = plan.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
    const completedTasks = plan.phases.reduce((sum, phase) =>
      sum + phase.tasks.filter(t => t.status === 'completed').length, 0);
    const inProgressTasks = plan.phases.reduce((sum, phase) =>
      sum + phase.tasks.filter(t => t.status === 'in-progress').length, 0);

    content += `- **Total Tasks:** ${totalTasks}\n`;
    content += `- **Completed:** ${completedTasks} (${Math.round(completedTasks / totalTasks * 100)}%)\n`;
    content += `- **In Progress:** ${inProgressTasks}\n`;
    content += `- **Remaining:** ${totalTasks - completedTasks - inProgressTasks}\n\n`;

    // Current Focus
    const currentPhase = plan.phases.find(p => p.status === 'in-progress') || plan.phases.find(p => p.status === 'pending');
    if (currentPhase) {
      content += `## 🎯 Current Focus: ${currentPhase.name}\n\n`;
      const currentTasks = currentPhase.tasks.filter(t => t.status !== 'completed');
      if (currentTasks.length > 0) {
        content += `**Next Tasks:**\n`;
        currentTasks.forEach((task, index) => {
          const statusEmoji = this.getStatusEmoji(task.status);
          content += `${index + 1}. ${statusEmoji} ${task.title}\n`;
        });
        content += '\n';
      }
    }

    // Detailed Task List
    content += `## 📋 Detailed Task List\n\n`;
    plan.phases.forEach((phase, phaseIndex) => {
      const phaseStatusEmoji = this.getStatusEmoji(phase.status);
      content += `### Phase ${phaseIndex + 1}: ${phaseStatusEmoji} ${phase.name}\n\n`;
      content += `${phase.description}\n\n`;

      phase.tasks.forEach((task, taskIndex) => {
        const taskStatusEmoji = this.getStatusEmoji(task.status);
        const taskNumber = `${phaseIndex + 1}.${taskIndex + 1}`;

        content += `#### ${taskNumber} ${taskStatusEmoji} ${task.title}\n\n`;
        content += `**Description:** ${task.description}\n`;
        content += `**Status:** ${task.status}\n`;

        if (task.estimatedHours) {
          content += `**Estimated:** ${task.estimatedHours}h\n`;
        }
        if (task.actualHours) {
          content += `**Actual:** ${task.actualHours}h\n`;
        }
        if (task.assignee) {
          content += `**Assignee:** ${task.assignee}\n`;
        }
        if (task.dependencies && task.dependencies.length > 0) {
          content += `**Dependencies:** ${task.dependencies.join(', ')}\n`;
        }

        content += '\n';
      });
    });

    // Task Notes Template
    content += `## 📝 Task Notes\n\n`;
    content += `*Add task-specific notes, progress updates, and blockers here*\n\n`;

    return content;
  }

  private generateReadmeMarkdown(taskName: string, plan: DevDocsPlan, context: SlashCommandContext): string {
    let content = `# ${taskName}\n\n`;
    content += `> **Plan ID:** ${plan.id}\n`;
    content += `> **Created:** ${new Date().toLocaleDateString()}\n`;
    content += `> **Status:** ${plan.phases[0]?.status || 'pending'}\n\n`;

    // Quick Summary
    content += `## 📋 Quick Summary\n\n`;
    content += `**Description:** ${plan.description}\n\n`;
    content += `**Objectives:**\n`;
    plan.objectives.slice(0, 3).forEach((objective, index) => {
      content += `${index + 1}. ${objective}\n`;
    });
    if (plan.objectives.length > 3) {
      content += `... and ${plan.objectives.length - 3} more\n`;
    }
    content += '\n';

    // Current Status
    content += `## 🎯 Current Status\n\n`;
    const currentPhase = plan.phases.find(p => p.status === 'in-progress');
    const nextPhase = plan.phases.find(p => p.status === 'pending');

    if (currentPhase) {
      content += `**Currently Working On:** ${currentPhase.name}\n`;
      const currentTasks = currentPhase.tasks.filter(t => t.status === 'in-progress');
      if (currentTasks.length > 0) {
        content += `**Active Tasks:** ${currentTasks.map(t => t.title).join(', ')}\n`;
      }
    } else if (nextPhase) {
      content += `**Next Up:** ${nextPhase.name}\n`;
    } else {
      content += `**Status:** Planning phase\n`;
    }
    content += '\n';

    // Progress Overview
    content += `## 📊 Progress Overview\n\n`;
    const totalTasks = plan.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
    const completedTasks = plan.phases.reduce((sum, phase) =>
      sum + phase.tasks.filter(t => t.status === 'completed').length, 0);
    const progress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;

    content += `**Overall Progress:** ${progress}% (${completedTasks}/${totalTasks} tasks)\n\n`;

    // Phase Progress
    content += `**Phase Progress:**\n`;
    plan.phases.forEach((phase) => {
      const phaseTotal = phase.tasks.length;
      const phaseCompleted = phase.tasks.filter(t => t.status === 'completed').length;
      const phaseProgress = phaseTotal > 0 ? Math.round(phaseCompleted / phaseTotal * 100) : 0;
      const phaseEmoji = this.getStatusEmoji(phase.status);
      content += `- ${phaseEmoji} ${phase.name}: ${phaseProgress}%\n`;
    });
    content += '\n';

    // Key Files
    content += `## 📁 Key Files\n\n`;
    content += `- **[plan.md](./plan.md)** - Detailed project plan and objectives\n`;
    content += `- **[context.md](./context.md)** - Project context and environment information\n`;
    content += `- **[tasks.md](./tasks.md)** - Task breakdown and progress tracking\n\n`;

    // Quick Actions
    content += `## ⚡ Quick Actions\n\n`;
    content += `### Update Progress\n`;
    content += `\`\`\`bash\n`;
    content += `skills-cli slash dev-docs-update ${taskName} --progress\n`;
    content += `\`\`\`\n\n`;

    content += `### Build and Validate\n`;
    content += `\`\`\`bash\n`;
    content += `skills-cli slash build-and-fix\n`;
    content += `\`\`\`\n\n`;

    content += `### Code Review\n`;
    content += `\`\`\`bash\n`;
    content += `skills-cli slash code-review\n`;
    content += `\`\`\`\n\n`;

    // Risks and Blockers
    const activeRisks = plan.risks.filter(r => r.status === 'open');
    if (activeRisks.length > 0) {
      content += `## ⚠️ Active Risks\n\n`;
      activeRisks.slice(0, 3).forEach((risk) => {
        const riskEmoji = this.getRiskEmoji(risk.probability, risk.impact);
        content += `- ${riskEmoji} **${risk.title}:** ${risk.description}\n`;
      });
      if (activeRisks.length > 3) {
        content += `- ... and ${activeRisks.length - 3} more (see [plan.md](./plan.md))\n`;
      }
      content += '\n';
    }

    // Last Updated
    content += `---\n`;
    content += `*Last Updated: ${new Date().toLocaleString()}*\n`;

    return content;
  }

  private generateWorkspaceSnapshot(workspace: any): any {
    return {
      timestamp: new Date().toISOString(),
      workspace: {
        root: workspace.root,
        packageJson: workspace.packageJson,
        gitStatus: workspace.gitStatus,
        env: workspace.env,
        openFiles: workspace.openFiles,
      },
    };
  }

  private async createMemTechSnapshot(
    taskName: string,
    plan: DevDocsPlan,
    context: SlashCommandContext
  ): Promise<string> {
    const snapshotKey = `dev-docs:${taskName}:${plan.id}`;

    const snapshot = {
      taskName,
      planId: plan.id,
      plan,
      context: {
        sessionId: context.sessionId,
        command: context.command,
        workspace: context.workspace,
      },
      createdAt: new Date().toISOString(),
    };

    // Store in MemTech L1
    await this.contextManager.updateContext(context.sessionId, {
      state: {
        [snapshotKey]: snapshot
      }
    });

    return snapshotKey;
  }

  private getStatusEmoji(status: string): string {
    const statusEmojis = {
      'pending': '⏳',
      'in-progress': '🔄',
      'completed': '✅',
      'blocked': '🚫',
    };
    return statusEmojis[status as keyof typeof statusEmojis] || '⏳';
  }

  private getRiskEmoji(probability: string, impact: string): string {
    const highHigh = (probability === 'high' && impact === 'high');
    if (highHigh) return '🔴';
    if (probability === 'high' || impact === 'high') return '🟡';
    return '🟢';
  }

  private identifyTaskType(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('api') || lowerDesc.includes('service')) return 'API Development';
    if (lowerDesc.includes('ui') || lowerDesc.includes('component')) return 'UI Development';
    if (lowerDesc.includes('test')) return 'Testing';
    if (lowerDesc.includes('fix') || lowerDesc.includes('bug')) return 'Bug Fix';
    if (lowerDesc.includes('documentation')) return 'Documentation';
    if (lowerDesc.includes('deploy') || lowerDesc.includes('infrastructure')) return 'Infrastructure';
    return 'Development';
  }

  private assessComplexity(description: string): 'Low' | 'Medium' | 'High' {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('system') || lowerDesc.includes('architecture') || lowerDesc.includes('migration')) {
      return 'High';
    }
    if (lowerDesc.includes('feature') || lowerDesc.includes('api') || lowerDesc.includes('integration')) {
      return 'Medium';
    }
    return 'Low';
  }

  private identifyScope(description: string): string {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('system') || lowerDesc.includes('platform')) return 'System-wide';
    if (lowerDesc.includes('service') || lowerDesc.includes('api')) return 'Multi-component';
    return 'Single Component';
  }

  public formatOutput(content: string, format: 'json' | 'markdown' | 'text' = 'text'): string {
    switch (format) {
      case 'json':
        return JSON.stringify({ message: content }, null, 2);
      case 'markdown':
        return content;
      default:
        return content;
    }
  }
}