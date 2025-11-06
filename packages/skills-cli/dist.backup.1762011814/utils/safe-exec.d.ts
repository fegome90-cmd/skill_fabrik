import { SpawnOptions } from 'child_process';
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
export declare function safeExec(command: string, args?: string[], options?: SafeExecOptions): Promise<SafeExecResult>;
/**
 * Validate that a command is safe to execute
 */
export declare function validateCommand(command: string): boolean;
/**
 * Validate that arguments are safe
 */
export declare function validateArgs(args: string[]): boolean;
//# sourceMappingURL=safe-exec.d.ts.map