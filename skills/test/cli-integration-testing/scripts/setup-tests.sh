#!/bin/bash
# CLI Integration Tests Setup Script

set -e

echo "🚀 Setting up CLI Integration Tests..."

# Create test structure
mkdir -p packages/skills-cli/test/integration/{commands,workflows,visual,utils}

# Create test helper utilities
cat > packages/skills-cli/test/integration/utils/test-helpers.ts << 'EOF'
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
EOF

# Create mock responses utility
cat > packages/skills-cli/test/integration/utils/mock-responses.ts << 'EOF'
export const MOCK_SKILLS_RESPONSE = {
  skills: [
    {
      name: 'test-skill',
      description: 'Test skill for integration testing',
      severity: 'medium',
      triggers: { keywords: ['test', 'mock'] }
    }
  ]
};

export const MOCK_PLAN_RESPONSE = {
  id: 'test-plan-1',
  title: 'Test Plan',
  status: 'draft',
  phases: [
    { id: 'clarify', title: 'Clarify Objectives', completed: false },
    { id: 'layout', title: 'Layout MVP', completed: false }
  ]
};

export const MOCK_KPI_RESPONSE = {
  period: '7-days',
  metrics: {
    totalActivations: 150,
    successRate: 0.95,
    averageLatency: 250
  }
};
EOF

echo "✅ Test structure created successfully!"
echo "📁 Directories created under packages/skills-cli/test/integration/"
echo "🔧 Test utilities and mocks added"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm skills:lint' to validate the new skill"
echo "2. Run 'pnpm skills:index' to update the registry"
echo "3. Start implementing the specific test files"