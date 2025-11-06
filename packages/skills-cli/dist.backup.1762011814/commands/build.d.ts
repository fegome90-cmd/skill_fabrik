import { Command } from 'commander';
export interface BuildError {
    file: string;
    line: number;
    column: number;
    message: string;
    code: string;
}
export interface BuildResult {
    repo: string;
    success: boolean;
    errors: BuildError[];
    output: string;
}
export declare function buildCommand(program: Command): void;
//# sourceMappingURL=build.d.ts.map