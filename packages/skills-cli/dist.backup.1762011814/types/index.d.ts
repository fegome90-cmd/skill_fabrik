export interface CLIOptions {
    verbose?: boolean;
    output?: string;
    dryRun?: boolean;
}
export interface CommandResult {
    success: boolean;
    exitCode: 0 | 2;
    message?: string;
    data?: unknown;
}
export * from './cloop.js';
export * from './skill.js';
export * from './hooks.js';
//# sourceMappingURL=index.d.ts.map