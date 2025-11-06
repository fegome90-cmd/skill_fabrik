/**
 * Progress Indicators and Interactive Elements
 * Provides spinners, progress bars, and interactive prompts
 */
import { colors } from './colors.js';
export declare class Spinner {
    private text;
    private color;
    private interval;
    private index;
    private isRunning;
    constructor(text: string, color?: import("chalk").ChalkInstance);
    start(): void;
    stop(finalText?: string): void;
    updateText(text: string): void;
    updateColor(color: typeof colors.primary): void;
}
export declare class ProgressBar {
    private total;
    private current;
    private width;
    private prefix;
    constructor(total: number, width?: number, prefix?: string);
    update(current: number, text?: string): void;
    complete(finalText?: string): void;
}
export declare function promptInput(question: string, defaultValue?: string): Promise<string>;
export declare function promptConfirm(question: string, defaultValue?: boolean): Promise<boolean>;
export declare function promptSelect(question: string, options: string[], selectedIndex?: number): Promise<string>;
export declare function promptMultiSelect(question: string, options: string[], preSelected?: number[]): Promise<string[]>;
export declare function showStatus(status: string, message: string): void;
export declare class StepIndicator {
    private steps;
    private current;
    constructor(steps: string[]);
    update(step: number, message?: string): void;
    complete(): void;
}
export declare function withSpinner<T>(text: string, operation: () => Promise<T>, color?: import("chalk").ChalkInstance): Promise<T>;
export declare function withProgress<T>(text: string, total: number, operation: (update: (current: number) => void) => Promise<T>): Promise<T>;
declare const _default: {
    Spinner: typeof Spinner;
    ProgressBar: typeof ProgressBar;
    promptInput: typeof promptInput;
    promptConfirm: typeof promptConfirm;
    promptSelect: typeof promptSelect;
    promptMultiSelect: typeof promptMultiSelect;
    showStatus: typeof showStatus;
    StepIndicator: typeof StepIndicator;
    withSpinner: typeof withSpinner;
    withProgress: typeof withProgress;
};
export default _default;
//# sourceMappingURL=progress.d.ts.map