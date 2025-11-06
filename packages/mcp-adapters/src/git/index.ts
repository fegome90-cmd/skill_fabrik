/**
 * Git Adapter - MCP Local Adapter
 * 
 * Proporciona operaciones de Git para el agente,
 * ejecutándose localmente mediante comandos git.
 */

import { execSync } from 'child_process';
import { resolve } from 'path';

export interface GitAdapter {
  status(repoPath?: string): Promise<GitStatus>;
  diff(repoPath?: string, staged?: boolean): Promise<string>;
  commit(message: string, repoPath?: string, files?: string[]): Promise<CommitResult>;
  branchList(repoPath?: string): Promise<string[]>;
  currentBranch(repoPath?: string): Promise<string>;
  log(repoPath?: string, limit?: number): Promise<GitLogEntry[]>;
}

export interface GitStatus {
  clean: boolean;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
  branch: string;
  ahead: number;
  behind: number;
}

export interface CommitResult {
  success: boolean;
  hash?: string;
  message?: string;
  error?: string;
}

export interface GitLogEntry {
  hash: string;
  author: string;
  date: Date;
  message: string;
}

export class LocalGitAdapter implements GitAdapter {
  constructor(private basePath: string = process.cwd()) {}

  private execGit(command: string, repoPath?: string): string {
    const cwd = repoPath ? resolve(this.basePath, repoPath) : this.basePath;
    try {
      return execSync(`git ${command}`, { 
        cwd, 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
    } catch (error) {
      throw new Error(`Git command failed: ${command} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async status(repoPath?: string): Promise<GitStatus> {
    try {
      const branch = this.execGit('rev-parse --abbrev-ref HEAD', repoPath);
      const statusOutput = this.execGit('status --porcelain', repoPath);
      const ahead = parseInt(this.execGit('rev-list --count @{u}..HEAD', repoPath) || '0', 10);
      const behind = parseInt(this.execGit('rev-list --count HEAD..@{u}', repoPath) || '0', 10);

      const modified: string[] = [];
      const added: string[] = [];
      const deleted: string[] = [];
      const untracked: string[] = [];

      if (statusOutput) {
        for (const line of statusOutput.split('\n')) {
          const status = line.substring(0, 2);
          const file = line.substring(3);
          
          if (status.startsWith('??')) {
            untracked.push(file);
          } else if (status.includes('M')) {
            if (status[0] === 'M' || status[0] === 'A') {
              if (status[1] === 'M') {
                modified.push(file);
              } else if (status[0] === 'A') {
                added.push(file);
              }
            } else {
              modified.push(file);
            }
          } else if (status.includes('D')) {
            deleted.push(file);
          } else if (status[0] === 'A') {
            added.push(file);
          }
        }
      }

      return {
        clean: statusOutput.length === 0 && ahead === 0 && behind === 0,
        modified,
        added,
        deleted,
        untracked,
        branch,
        ahead,
        behind,
      };
    } catch (error) {
      throw new Error(`Error getting git status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async diff(repoPath?: string, staged: boolean = false): Promise<string> {
    try {
      const command = staged ? 'diff --cached' : 'diff';
      return this.execGit(command, repoPath);
    } catch (error) {
      throw new Error(`Error getting git diff: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async commit(message: string, repoPath?: string, files?: string[]): Promise<CommitResult> {
    try {
      // Add files if specified
      if (files && files.length > 0) {
        const cwd = repoPath ? resolve(this.basePath, repoPath) : this.basePath;
        execSync(`git add ${files.join(' ')}`, { cwd, encoding: 'utf-8' });
      }

      // Commit
      const hash = this.execGit(`commit -m "${message.replace(/"/g, '\\"')}"`, repoPath);
      
      return {
        success: true,
        hash,
        message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async branchList(repoPath?: string): Promise<string[]> {
    try {
      const branches = this.execGit('branch', repoPath);
      return branches.split('\n').map(b => b.replace(/^\*\s*/, '').trim()).filter(Boolean);
    } catch (error) {
      throw new Error(`Error listing branches: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async currentBranch(repoPath?: string): Promise<string> {
    try {
      return this.execGit('rev-parse --abbrev-ref HEAD', repoPath);
    } catch (error) {
      throw new Error(`Error getting current branch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async log(repoPath?: string, limit: number = 10): Promise<GitLogEntry[]> {
    try {
      const logOutput = this.execGit(
        `log --pretty=format:"%H|%an|%ad|%s" --date=iso -n ${limit}`,
        repoPath
      );

      return logOutput.split('\n').map(line => {
        const [hash, author, dateStr, ...messageParts] = line.split('|');
        return {
          hash,
          author,
          date: new Date(dateStr),
          message: messageParts.join('|'),
        };
      });
    } catch (error) {
      throw new Error(`Error getting git log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export singleton instance
export const gitAdapter = new LocalGitAdapter();


