import { execSync } from 'child_process';
import { join } from 'path';

export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class CLIHelper {
  private static readonly CLI_PATH = join(__dirname, '../../../dist/index.js');

  static async runCommand(command: string, args: string[] = []): Promise<CLIResult> {
    try {
      const output = execSync(`node ${this.CLI_PATH} ${command} ${args.join(' ')}`, {
        encoding: 'utf8',
        cwd: process.cwd()
      });

      return {
        stdout: output,
        stderr: '',
        exitCode: 0
      };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.status || 1
      };
    }
  }

  static async skillsCommand(subcommand: string, args: string[] = []): Promise<CLIResult> {
    return this.runCommand('skills', [subcommand, ...args]);
  }

  static async planCommand(subcommand: string, args: string[] = []): Promise<CLIResult> {
    return this.runCommand('plan', [subcommand, ...args]);
  }

  static async kpiCommand(args: string[] = []): Promise<CLIResult> {
    return this.runCommand('kpi', args);
  }

  static createTempSkillDirectory(): string {
    const tempDir = `/tmp/skills-test-${Date.now()}`;
    execSync(`mkdir -p ${tempDir}`);
    return tempDir;
  }

  static cleanupTempDirectory(dir: string): void {
    execSync(`rm -rf ${dir}`);
  }
}
