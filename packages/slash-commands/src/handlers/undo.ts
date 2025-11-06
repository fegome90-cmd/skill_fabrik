/**
 * Undo Handler
 *
 * Handles undo operations for Git, file changes, and command states
 * Integrates with MemTech L1 for state restoration
 * Provides safe rollback capabilities
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import {
  SlashCommandContext,
  ParsedSlashCommand,
  SlashCommandResult
} from '../types.js';
import { SlashCommandHandler } from './base.js';

interface UndoResult {
  operation: {
    type: 'git' | 'file' | 'command' | 'workspace';
    target: string;
    status: 'success' | 'failed' | 'skipped';
    details: string;
    duration: number;
  };
  safety: {
    backupCreated: boolean;
    backupPath?: string;
    validationPassed: boolean;
    risksAssessed: string[];
  };
  restoration: {
    filesRestored: number;
    commitsReverted: number;
    commandsReverted: number;
    duration: number;
  };
  recommendations: string[];
}

interface GitCommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

interface StateSnapshot {
  timestamp: string;
  sessionId: string;
  workspaceRoot: string;
  gitStatus: any;
  modifiedFiles: string[];
  commandHistory: string[];
  memtechKey?: string;
}

export class UndoHandler extends SlashCommandHandler {
  constructor(command: any, contextManager?: any) {
    super(command, contextManager);
  }

  /**
   * Validate undo command arguments
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
        message: 'Not a Git repository. Undo operations require Git.'
      };
    }

    // Get the target to undo
    const target = this.getArgument(parsedCommand, 0);
    if (!target) {
      return {
        valid: false,
        message: 'Missing target. Usage: /undo <target> [options]'
      };
    }

    // Validate flags
    const force = this.getFlag(parsedCommand, 'force', false);
    const dryRun = this.getFlag(parsedCommand, 'dry-run', false);
    const backup = this.getFlag(parsedCommand, 'backup', true);

    if (typeof force !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --force must be a boolean value'
      };
    }

    if (typeof dryRun !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --dry-run must be a boolean value'
      };
    }

    if (typeof backup !== 'boolean') {
      return {
        valid: false,
        message: 'Flag --backup must be a boolean value'
      };
    }

    return { valid: true };
  }

  /**
   * Handle the undo command execution
   */
  protected async handle(
    parsedCommand: ParsedSlashCommand,
    context: SlashCommandContext
  ): Promise<Omit<SlashCommandResult, 'context' | 'metadata'>> {
    const startTime = Date.now();
    const workspaceRoot = context.workspace.root;

    // Get command parameters
    const target = this.requireArgument(parsedCommand, 0, 'target');
    const force = this.getFlag(parsedCommand, 'force', false);
    const dryRun = this.getFlag(parsedCommand, 'dry-run', false);
    const backup = this.getFlag(parsedCommand, 'backup', true);
    const verbose = this.getFlag(parsedCommand, 'verbose', false);

    try {
      if (verbose) {
        console.log('↩️  Starting undo operation...');
        console.log(`   Target: ${target}`);
        console.log(`   Force mode: ${force ? 'ON' : 'OFF'}`);
        console.log(`   Dry run: ${dryRun ? 'ON' : 'OFF'}`);
        console.log(`   Backup: ${backup ? 'ON' : 'OFF'}`);
      }

      const results: UndoResult = {
        operation: {
          type: 'workspace',
          target,
          status: 'success',
          details: '',
          duration: 0
        },
        safety: {
          backupCreated: false,
          validationPassed: false,
          risksAssessed: []
        },
        restoration: {
          filesRestored: 0,
          commitsReverted: 0,
          commandsReverted: 0,
          duration: 0
        },
        recommendations: []
      };

      // Step 1: Analyze target and determine operation type
      const operationType = await this.determineOperationType(target, workspaceRoot, context);
      results.operation.type = operationType;

      if (verbose) console.log(`   Operation type: ${operationType}`);

      // Step 2: Safety assessment
      if (verbose) console.log('\n🔒 Assessing safety...');
      results.safety = await this.assessSafety(target, operationType, workspaceRoot, force, verbose);

      if (!results.safety.validationPassed && !force) {
        return {
          success: false,
          output: this.formatSafetyError(results.safety),
          data: results,
          nextActions: ['/undo --force', '/status', '/backup-create']
        };
      }

      // Step 3: Create backup if requested
      if (backup && !dryRun) {
        if (verbose) console.log('\n💾 Creating backup...');
        results.safety.backupCreated = await this.createBackup(workspaceRoot, context.sessionId, verbose);
        if (results.safety.backupCreated) {
          results.safety.backupPath = join(workspaceRoot, '.undo-backup', context.sessionId);
        }
      }

      // Step 4: Perform the undo operation
      const restorationStartTime = Date.now();

      switch (operationType) {
        case 'git':
          await this.undoGitOperation(target, workspaceRoot, dryRun, verbose, results);
          break;
        case 'file':
          await this.undoFileOperation(target, workspaceRoot, dryRun, verbose, results);
          break;
        case 'command':
          await this.undoCommandOperation(target, workspaceRoot, context, dryRun, verbose, results);
          break;
        case 'workspace':
          await this.undoWorkspaceOperation(target, workspaceRoot, context, dryRun, verbose, results);
          break;
        default:
          throw new Error(`Unknown operation type: ${operationType}`);
      }

      results.restoration.duration = Date.now() - restorationStartTime;
      results.operation.duration = Date.now() - startTime;

      // Step 5: Generate recommendations
      results.recommendations = this.generateRecommendations(results, operationType);

      // Persist results to MemTech L1
      await this.persistResults(context.sessionId, results);

      const output = this.formatUndoOutput(results, verbose);
      const nextActions = this.generateNextActions(results);

      return {
        success: results.operation.status === 'success',
        output,
        data: results,
        nextActions
      };

    } catch (error) {
      console.error('❌ Undo operation failed:', error);
      return this.createErrorResult(
        this.createError('execution', `Undo operation failed: ${(error instanceof Error ? error.message : String(error))}`)
      );
    }
  }

  /**
   * Determine the type of operation to undo
   */
  private async determineOperationType(
    target: string,
    workspaceRoot: string,
    context: SlashCommandContext
  ): Promise<'git' | 'file' | 'command' | 'workspace'> {
    // Check if target is a Git commit hash
    if (target.match(/^[a-f0-9]{7,40}$/i)) {
      return 'git';
    }

    // Check if target is a file path
    if (target.includes('/') || target.includes('\\') || target.includes('.')) {
      const filePath = resolve(workspaceRoot, target);
      if (existsSync(filePath)) {
        return 'file';
      }
    }

    // Check if target is a command
    if (target.startsWith('/') || target.includes('command')) {
      return 'command';
    }

    // Check if target is a session ID
    if (target.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return 'workspace';
    }

    // Default to workspace undo
    return 'workspace';
  }

  /**
   * Assess safety of the undo operation
   */
  private async assessSafety(
    target: string,
    operationType: string,
    workspaceRoot: string,
    force: boolean,
    verbose: boolean
  ): Promise<{ backupCreated: boolean; validationPassed: boolean; risksAssessed: string[] }> {
    const risks: string[] = [];
    let validationPassed = true;

    try {
      // Check for uncommitted changes
      try {
        const gitStatus = execSync('git status --porcelain', {
          cwd: workspaceRoot,
          encoding: 'utf-8'
        });

        if (gitStatus.trim()) {
          risks.push('Uncommitted changes detected');
          if (!force) {
            validationPassed = false;
          }
        }
      } catch (error) {
        risks.push('Unable to check Git status');
      }

      // Check for branch protection
      try {
        const currentBranch = execSync('git branch --show-current', {
          cwd: workspaceRoot,
          encoding: 'utf-8'
        }).trim();

        if (['main', 'master', 'develop', 'production'].includes(currentBranch)) {
          risks.push(`Operating on protected branch: ${currentBranch}`);
          if (!force) {
            validationPassed = false;
          }
        }
      } catch (error) {
        risks.push('Unable to check current branch');
      }

      // Check for recent commits (prevent accidental reverts)
      if (operationType === 'git') {
        try {
          const recentCommits = execSync('git log --oneline -5', {
            cwd: workspaceRoot,
            encoding: 'utf-8'
          });

          if (recentCommits.split('\n').length > 0) {
            risks.push('Will revert recent commits');
          }
        } catch (error) {
          risks.push('Unable to check commit history');
        }
      }

      // Check if target exists and is accessible
      if (operationType === 'file') {
        const filePath = resolve(workspaceRoot, target);
        if (!existsSync(filePath)) {
          risks.push(`Target file does not exist: ${target}`);
          validationPassed = false;
        }
      }

      if (verbose) {
        console.log(`   Safety assessment: ${validationPassed ? 'PASSED' : 'FAILED'}`);
        if (risks.length > 0) {
          console.log('   Risks identified:');
          risks.forEach(risk => console.log(`     - ${risk}`));
        }
      }

    } catch (error) {
      risks.push(`Safety assessment failed: ${(error instanceof Error ? error.message : String(error))}`);
      validationPassed = false;
    }

    return {
      backupCreated: false,
      validationPassed,
      risksAssessed: risks
    };
  }

  /**
   * Create backup of current state
   */
  private async createBackup(
    workspaceRoot: string,
    sessionId: string,
    verbose: boolean
  ): Promise<boolean> {
    try {
      const backupDir = join(workspaceRoot, '.undo-backup', sessionId);

      if (verbose) console.log(`   Creating backup in: ${backupDir}`);

      // Create backup directory
      execSync(`mkdir -p "${backupDir}"`, { cwd: workspaceRoot, stdio: 'pipe' });

      // Backup Git state
      try {
        execSync('git log --oneline -10 > git-commits.log', { cwd: workspaceRoot, stdio: 'pipe' });
        execSync('git status > git-status.log', { cwd: workspaceRoot, stdio: 'pipe' });
        execSync('cp git-commits.log git-status.log "' + backupDir + '"', { cwd: workspaceRoot, stdio: 'pipe' });
      } catch (error) {
        if (verbose) console.log(`   Git backup failed: ${(error instanceof Error ? error.message : String(error))}`);
      }

      // Backup modified files
      try {
        const modifiedFiles = execSync('git diff --name-only', {
          cwd: workspaceRoot,
          encoding: 'utf-8'
        }).trim().split('\n').filter(f => f);

        for (const file of modifiedFiles) {
          const sourceFile = join(workspaceRoot, file);
          const backupFile = join(backupDir, file);
          const backupFileDir = join(backupDir, file.split('/').slice(0, -1).join('/'));

          execSync(`mkdir -p "${backupFileDir}"`, { cwd: workspaceRoot, stdio: 'pipe' });
          execSync(`cp "${sourceFile}" "${backupFile}"`, { cwd: workspaceRoot, stdio: 'pipe' });
        }

        if (verbose) console.log(`   Backed up ${modifiedFiles.length} modified files`);
      } catch (error) {
        if (verbose) console.log(`   File backup failed: ${(error instanceof Error ? error.message : String(error))}`);
      }

      return true;

    } catch (error) {
      if (verbose) console.log(`   Backup creation failed: ${(error instanceof Error ? error.message : String(error))}`);
      return false;
    }
  }

  /**
   * Undo Git operation
   */
  private async undoGitOperation(
    target: string,
    workspaceRoot: string,
    dryRun: boolean,
    verbose: boolean,
    results: UndoResult
  ): Promise<void> {
    try {
      if (verbose) console.log(`   Reverting Git commit: ${target}`);

      // Get commit info before reverting
      const commitInfo = this.getCommitInfo(target, workspaceRoot);
      results.operation.details = `Reverting commit: ${commitInfo.message}`;

      if (!dryRun) {
        try {
          // Create revert commit
          execSync(`git revert --no-edit ${target}`, { cwd: workspaceRoot, stdio: 'pipe' });
          results.operation.status = 'success';
          results.restoration.commitsReverted = 1;

          if (verbose) console.log('   ✅ Git commit reverted successfully');
        } catch (error) {
          // Try reset if revert fails
          try {
            execSync(`git reset --hard ${target}^`, { cwd: workspaceRoot, stdio: 'pipe' });
            results.operation.status = 'success';
            results.restoration.commitsReverted = 1;

            if (verbose) console.log('   ✅ Git reset completed successfully');
          } catch (resetError) {
            results.operation.status = 'failed';
            results.operation.details += ` (Failed: ${(error instanceof Error ? error.message : String(error))})`;
          }
        }
      } else {
        results.operation.status = 'skipped';
        results.operation.details += ' (Dry run)';
        if (verbose) console.log('   ⚠️  Dry run: Would revert Git commit');
      }

    } catch (error) {
      results.operation.status = 'failed';
      results.operation.details = `Git operation failed: ${(error instanceof Error ? error.message : String(error))}`;
    }
  }

  /**
   * Undo file operation
   */
  private async undoFileOperation(
    target: string,
    workspaceRoot: string,
    dryRun: boolean,
    verbose: boolean,
    results: UndoResult
  ): Promise<void> {
    try {
      const filePath = resolve(workspaceRoot, target);

      if (verbose) console.log(`   Restoring file: ${target}`);

      // Try to restore from Git first
      try {
        if (!dryRun) {
          execSync(`git checkout HEAD -- "${target}"`, { cwd: workspaceRoot, stdio: 'pipe' });
          results.operation.status = 'success';
          results.restoration.filesRestored = 1;
          results.operation.details = `Restored file from Git: ${target}`;

          if (verbose) console.log('   ✅ File restored from Git');
        } else {
          results.operation.status = 'skipped';
          results.operation.details = `Would restore file from Git: ${target} (Dry run)`;
          if (verbose) console.log('   ⚠️  Dry run: Would restore file from Git');
        }
      } catch (gitError) {
        // Git failed, try backup
        const backupPath = join(workspaceRoot, '.undo-backup', target);
        if (existsSync(backupPath)) {
          if (!dryRun) {
            execSync(`cp "${backupPath}" "${filePath}"`, { cwd: workspaceRoot, stdio: 'pipe' });
            results.operation.status = 'success';
            results.restoration.filesRestored = 1;
            results.operation.details = `Restored file from backup: ${target}`;

            if (verbose) console.log('   ✅ File restored from backup');
          } else {
            results.operation.status = 'skipped';
            results.operation.details = `Would restore file from backup: ${target} (Dry run)`;
            if (verbose) console.log('   ⚠️  Dry run: Would restore file from backup');
          }
        } else {
          results.operation.status = 'failed';
          results.operation.details = `No backup found for file: ${target}`;
        }
      }

    } catch (error) {
      results.operation.status = 'failed';
      results.operation.details = `File restore failed: ${(error instanceof Error ? error.message : String(error))}`;
    }
  }

  /**
   * Undo command operation
   */
  private async undoCommandOperation(
    target: string,
    workspaceRoot: string,
    context: SlashCommandContext,
    dryRun: boolean,
    verbose: boolean,
    results: UndoResult
  ): Promise<void> {
    try {
      if (verbose) console.log(`   Reverting command: ${target}`);

      // This is a simplified implementation
      // In practice, you would maintain a command history log
      results.operation.status = 'skipped';
      results.operation.details = `Command undo not implemented for: ${target}`;

      if (verbose) console.log('   ⚠️  Command undo not yet implemented');

    } catch (error) {
      results.operation.status = 'failed';
      results.operation.details = `Command undo failed: ${(error instanceof Error ? error.message : String(error))}`;
    }
  }

  /**
   * Undo workspace operation
   */
  private async undoWorkspaceOperation(
    target: string,
    workspaceRoot: string,
    context: SlashCommandContext,
    dryRun: boolean,
    verbose: boolean,
    results: UndoResult
  ): Promise<void> {
    try {
      if (verbose) console.log(`   Restoring workspace state: ${target}`);

      // Try to restore from MemTech L1 snapshot
      try {
        const snapshot = await this.restoreFromMemTech(target, context);
        if (snapshot) {
          if (!dryRun) {
            // Restore files from snapshot
            for (const file of snapshot.modifiedFiles) {
              try {
                execSync(`git checkout HEAD -- "${file}"`, { cwd: workspaceRoot, stdio: 'pipe' });
                results.restoration.filesRestored++;
              } catch (error) {
                if (verbose) console.log(`   Failed to restore ${file}: ${(error instanceof Error ? error.message : String(error))}`);
              }
            }

            results.operation.status = 'success';
            results.operation.details = `Restored workspace from snapshot: ${target}`;

            if (verbose) console.log('   ✅ Workspace restored from snapshot');
          } else {
            results.operation.status = 'skipped';
            results.operation.details = `Would restore workspace from snapshot: ${target} (Dry run)`;
            if (verbose) console.log('   ⚠️  Dry run: Would restore workspace from snapshot');
          }
        } else {
          results.operation.status = 'failed';
          results.operation.details = `No snapshot found for: ${target}`;
        }
      } catch (error) {
        results.operation.status = 'failed';
        results.operation.details = `Workspace restore failed: ${(error instanceof Error ? error.message : String(error))}`;
      }

    } catch (error) {
      results.operation.status = 'failed';
      results.operation.details = `Workspace operation failed: ${(error instanceof Error ? error.message : String(error))}`;
    }
  }

  /**
   * Get Git commit information
   */
  private getCommitInfo(commitHash: string, workspaceRoot: string): GitCommitInfo {
    try {
      const output = execSync(`git show --format="%H|%s|%an|%ad" --name-only ${commitHash}`, {
        cwd: workspaceRoot,
        encoding: 'utf-8'
      });

      const lines = output.split('\n');
      const [hash, message, author, date] = lines[0].split('|');
      const files = lines.slice(1).filter(line => line.trim());

      return {
        hash,
        message,
        author,
        date,
        files
      };
    } catch (error) {
      return {
        hash: commitHash,
        message: 'Unknown commit',
        author: 'Unknown',
        date: 'Unknown',
        files: []
      };
    }
  }

  /**
   * Restore from MemTech L1 snapshot
   */
  private async restoreFromMemTech(sessionId: string, context: SlashCommandContext): Promise<StateSnapshot | null> {
    try {
      // This would integrate with the MemTech L1 system
      // For now, return null as placeholder
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(results: UndoResult, operationType: string): string[] {
    const recommendations: string[] = [];

    if (results.operation.status === 'success') {
      recommendations.push('✅ Undo operation completed successfully');

      if (operationType === 'git') {
        recommendations.push('Review the changes and commit if needed');
        recommendations.push('/git-status');
        recommendations.push('/git-diff');
      }

      if (results.restoration.filesRestored > 0) {
        recommendations.push('/build-and-fix');
      }
    } else {
      recommendations.push('❌ Undo operation failed');
      recommendations.push('Check the error details and try again');
      recommendations.push('/status');
    }

    if (results.safety.backupCreated) {
      recommendations.push(`Backup created at: ${results.safety.backupPath}`);
      recommendations.push('Remove backup when confident with changes');
    }

    recommendations.push('/help undo for more undo options');

    return recommendations;
  }

  /**
   * Generate next actions
   */
  private generateNextActions(results: UndoResult): string[] {
    const actions: string[] = [];

    if (results.operation.status === 'success') {
      actions.push('/status');
      actions.push('/git-status');

      if (results.restoration.filesRestored > 0) {
        actions.push('/build-and-fix');
      }
    } else {
      actions.push('/undo --force');
      actions.push('/status');
      actions.push('/help');
    }

    return actions;
  }

  /**
   * Format safety error message
   */
  private formatSafetyError(safety: { risksAssessed: string[] }): string {
    let output = '## ⚠️  Safety Check Failed\n\n';
    output += 'The undo operation was blocked due to the following risks:\n\n';

    safety.risksAssessed.forEach(risk => {
      output += `- ${risk}\n`;
    });

    output += '\n### Options:\n';
    output += '- Use `--force` flag to override safety checks\n';
    output += '- Commit or stash changes first\n';
    output += '- Switch to a different branch\n';
    output += '- Create backup before proceeding\n\n';

    return output;
  }

  /**
   * Format output for display
   */
  private formatUndoOutput(results: UndoResult, verbose: boolean): string {
    let output = '## Undo Operation Results\n\n';

    // Operation summary
    output += `### Operation ${results.operation.status === 'success' ? '✅' : results.operation.status === 'failed' ? '❌' : '⚠️'}\n`;
    output += `- Type: ${results.operation.type}\n`;
    output += `- Target: ${results.operation.target}\n`;
    output += `- Duration: ${results.operation.duration}ms\n`;
    output += `- Details: ${results.operation.details}\n\n`;

    // Safety information
    output += `### Safety\n`;
    output += `- Backup Created: ${results.safety.backupCreated ? '✅' : '❌'}\n`;
    if (results.safety.backupPath) {
      output += `- Backup Path: ${results.safety.backupPath}\n`;
    }
    if (results.safety.risksAssessed.length > 0) {
      output += `- Risks Assessed: ${results.safety.risksAssessed.length}\n`;
      if (verbose) {
        output += `  ${results.safety.risksAssessed.map(r => `- ${r}`).join('\n  ')}\n`;
      }
    }
    output += '\n';

    // Restoration summary
    output += `### Restoration Summary\n`;
    output += `- Files Restored: ${results.restoration.filesRestored}\n`;
    output += `- Commits Reverted: ${results.restoration.commitsReverted}\n`;
    output += `- Commands Reverted: ${results.restoration.commandsReverted}\n`;
    output += `- Duration: ${results.restoration.duration}ms\n\n`;

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
   * Persist results to MemTech L1
   */
  private async persistResults(sessionId: string, results: UndoResult): Promise<void> {
    try {
      await this.contextManager.updateContext(sessionId, {
        state: {
          undoResults: results,
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