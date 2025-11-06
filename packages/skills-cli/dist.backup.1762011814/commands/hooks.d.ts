import { Command } from 'commander';
export interface HookInstallationResult {
    success: boolean;
    hooksInstalled: string[];
    errors: string[];
}
export declare function hooksCommand(program: Command): void;
//# sourceMappingURL=hooks.d.ts.map