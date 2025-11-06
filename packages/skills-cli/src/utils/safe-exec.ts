import { spawn, SpawnOptions } from 'child_process';

export interface SafeExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface SafeExecOptions extends SpawnOptions {
  timeout?: number;
  input?: string;
}

/**
 * Safe command execution using spawn with argument array separation
 * Prevents command injection by separating command from arguments
 */
export async function safeExec(
  command: string,
  args: string[] = [],
  options: SafeExecOptions = {}
): Promise<SafeExecResult> {
  return new Promise((resolve, reject) => {
    const {
      timeout = 30000,
      input,
      ...spawnOptions
    } = options;

    // Sanitize arguments - remove dangerous characters
    const sanitizedArgs = args.map(arg =>
      arg.replace(/[;&|`$(){}[\]\\]/g, '')
    );

    const child = spawn(command, sanitizedArgs, {
      stdio: input ? ['pipe', 'pipe', 'pipe'] : ['inherit', 'pipe', 'pipe'],
      ...spawnOptions
    });

    let stdout = '';
    let stderr = '';
    let timeoutId: NodeJS.Timeout | null = null;

    // Setup timeout
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);
    }

    // Capture output
    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    // Send input if provided
    if (input && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }

    // Handle completion
    child.on('close', (code) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const result: SafeExecResult = {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0,
        success: code === 0
      };

      resolve(result);
    });

    child.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject(error);
    });
  });
}

/**
 * Validate that a command is safe to execute
 */
export function validateCommand(command: string): boolean {
  const dangerousChars = /[;&|`$(){}[\]\\]/;
  return !dangerousChars.test(command);
}

/**
 * Validate that arguments are safe
 */
export function validateArgs(args: string[]): boolean {
  return args.every(arg => validateCommand(arg));
}
