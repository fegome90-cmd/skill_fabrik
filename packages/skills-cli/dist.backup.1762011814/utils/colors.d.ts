/**
 * Professional CLI Color System
 * Consistent color palette with semantic meaning and accessibility
 */
import * as originalChalk from 'chalk';
export declare const colors: {
    readonly primary: originalChalk.ChalkInstance;
    readonly primaryLight: originalChalk.ChalkInstance;
    readonly primaryDark: originalChalk.ChalkInstance;
    readonly success: originalChalk.ChalkInstance;
    readonly successLight: originalChalk.ChalkInstance;
    readonly successBg: originalChalk.ChalkInstance;
    readonly warning: originalChalk.ChalkInstance;
    readonly warningLight: originalChalk.ChalkInstance;
    readonly warningBg: originalChalk.ChalkInstance;
    readonly error: originalChalk.ChalkInstance;
    readonly errorLight: originalChalk.ChalkInstance;
    readonly errorBg: originalChalk.ChalkInstance;
    readonly info: originalChalk.ChalkInstance;
    readonly infoLight: originalChalk.ChalkInstance;
    readonly infoBg: originalChalk.ChalkInstance;
    readonly text: originalChalk.ChalkInstance;
    readonly textMuted: originalChalk.ChalkInstance;
    readonly textDim: originalChalk.ChalkInstance;
    readonly border: originalChalk.ChalkInstance;
    readonly background: originalChalk.ChalkInstance;
};
export declare const status: {
    readonly healthy: originalChalk.ChalkInstance;
    readonly degraded: originalChalk.ChalkInstance;
    readonly error: originalChalk.ChalkInstance;
    readonly unknown: originalChalk.ChalkInstance;
    readonly loading: originalChalk.ChalkInstance;
};
export declare const priority: {
    readonly critical: originalChalk.ChalkInstance;
    readonly high: originalChalk.ChalkInstance;
    readonly medium: originalChalk.ChalkInstance;
    readonly low: originalChalk.ChalkInstance;
};
export declare const interactive: {
    readonly selected: originalChalk.ChalkInstance;
    readonly active: originalChalk.ChalkInstance;
    readonly disabled: originalChalk.ChalkInstance;
    readonly hover: originalChalk.ChalkInstance;
};
export declare const progress: {
    readonly complete: originalChalk.ChalkInstance;
    readonly incomplete: originalChalk.ChalkInstance;
    readonly inProgress: originalChalk.ChalkInstance;
    readonly failed: originalChalk.ChalkInstance;
};
export declare const format: {
    readonly header: (text: string) => string;
    readonly section: (text: string) => string;
    readonly success: (text: string) => string;
    readonly warning: (text: string) => string;
    readonly error: (text: string) => string;
    readonly info: (text: string) => string;
    readonly status: (status: string, color?: originalChalk.ChalkInstance) => string;
    readonly bullet: (text: string, color?: any) => any;
    readonly arrow: (text: string) => string;
    readonly command: (text: string) => string;
    readonly option: (text: string) => string;
    readonly flag: (text: string) => string;
    readonly number: (num: number) => string;
    readonly percentage: (num: number) => string;
    readonly time: (ms: number) => string;
    readonly breadcrumb: (path: string) => string;
    readonly activeBreadcrumb: (path: string) => string;
    readonly headerCell: (text: string) => string;
    readonly cell: (text: string) => string;
    readonly highlightCell: (text: string) => string;
};
export declare const spinners: readonly ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export declare const progressBar: {
    readonly complete: "█";
    readonly incomplete: "░";
    readonly left: "[";
    readonly right: "]";
};
export declare const box: {
    readonly topLeft: "┌";
    readonly topRight: "┐";
    readonly bottomLeft: "└";
    readonly bottomRight: "┘";
    readonly horizontal: "─";
    readonly vertical: "│";
    readonly leftTee: "├";
    readonly rightTee: "┤";
    readonly topTee: "┬";
    readonly bottomTee: "┴";
    readonly cross: "┼";
};
export declare function createBox(content: string, title?: string, borderColor?: any): string;
export declare function formatCommandHelp(command: string, description: string, examples?: string[]): string;
export declare function detectTheme(): 'dark' | 'light' | 'auto';
export declare const themes: {
    readonly dark: {
        readonly primary: originalChalk.ChalkInstance;
        readonly primaryLight: originalChalk.ChalkInstance;
        readonly primaryDark: originalChalk.ChalkInstance;
        readonly success: originalChalk.ChalkInstance;
        readonly successLight: originalChalk.ChalkInstance;
        readonly successBg: originalChalk.ChalkInstance;
        readonly warning: originalChalk.ChalkInstance;
        readonly warningLight: originalChalk.ChalkInstance;
        readonly warningBg: originalChalk.ChalkInstance;
        readonly error: originalChalk.ChalkInstance;
        readonly errorLight: originalChalk.ChalkInstance;
        readonly errorBg: originalChalk.ChalkInstance;
        readonly info: originalChalk.ChalkInstance;
        readonly infoLight: originalChalk.ChalkInstance;
        readonly infoBg: originalChalk.ChalkInstance;
        readonly text: originalChalk.ChalkInstance;
        readonly textMuted: originalChalk.ChalkInstance;
        readonly textDim: originalChalk.ChalkInstance;
        readonly border: originalChalk.ChalkInstance;
        readonly background: originalChalk.ChalkInstance;
    };
    readonly light: {
        readonly primary: originalChalk.ChalkInstance;
        readonly success: originalChalk.ChalkInstance;
        readonly warning: originalChalk.ChalkInstance;
        readonly error: originalChalk.ChalkInstance;
        readonly info: originalChalk.ChalkInstance;
        readonly text: originalChalk.ChalkInstance;
        readonly textMuted: originalChalk.ChalkInstance;
        readonly textDim: originalChalk.ChalkInstance;
        readonly border: originalChalk.ChalkInstance;
        readonly background: originalChalk.ChalkInstance;
    };
    readonly auto: {
        readonly primary: originalChalk.ChalkInstance;
        readonly primaryLight: originalChalk.ChalkInstance;
        readonly primaryDark: originalChalk.ChalkInstance;
        readonly success: originalChalk.ChalkInstance;
        readonly successLight: originalChalk.ChalkInstance;
        readonly successBg: originalChalk.ChalkInstance;
        readonly warning: originalChalk.ChalkInstance;
        readonly warningLight: originalChalk.ChalkInstance;
        readonly warningBg: originalChalk.ChalkInstance;
        readonly error: originalChalk.ChalkInstance;
        readonly errorLight: originalChalk.ChalkInstance;
        readonly errorBg: originalChalk.ChalkInstance;
        readonly info: originalChalk.ChalkInstance;
        readonly infoLight: originalChalk.ChalkInstance;
        readonly infoBg: originalChalk.ChalkInstance;
        readonly text: originalChalk.ChalkInstance;
        readonly textMuted: originalChalk.ChalkInstance;
        readonly textDim: originalChalk.ChalkInstance;
        readonly border: originalChalk.ChalkInstance;
        readonly background: originalChalk.ChalkInstance;
    };
};
export declare function getCurrentTheme(): {
    readonly primary: originalChalk.ChalkInstance;
    readonly primaryLight: originalChalk.ChalkInstance;
    readonly primaryDark: originalChalk.ChalkInstance;
    readonly success: originalChalk.ChalkInstance;
    readonly successLight: originalChalk.ChalkInstance;
    readonly successBg: originalChalk.ChalkInstance;
    readonly warning: originalChalk.ChalkInstance;
    readonly warningLight: originalChalk.ChalkInstance;
    readonly warningBg: originalChalk.ChalkInstance;
    readonly error: originalChalk.ChalkInstance;
    readonly errorLight: originalChalk.ChalkInstance;
    readonly errorBg: originalChalk.ChalkInstance;
    readonly info: originalChalk.ChalkInstance;
    readonly infoLight: originalChalk.ChalkInstance;
    readonly infoBg: originalChalk.ChalkInstance;
    readonly text: originalChalk.ChalkInstance;
    readonly textMuted: originalChalk.ChalkInstance;
    readonly textDim: originalChalk.ChalkInstance;
    readonly border: originalChalk.ChalkInstance;
    readonly background: originalChalk.ChalkInstance;
} | {
    readonly primary: originalChalk.ChalkInstance;
    readonly success: originalChalk.ChalkInstance;
    readonly warning: originalChalk.ChalkInstance;
    readonly error: originalChalk.ChalkInstance;
    readonly info: originalChalk.ChalkInstance;
    readonly text: originalChalk.ChalkInstance;
    readonly textMuted: originalChalk.ChalkInstance;
    readonly textDim: originalChalk.ChalkInstance;
    readonly border: originalChalk.ChalkInstance;
    readonly background: originalChalk.ChalkInstance;
};
export declare const chalkCompat: typeof originalChalk & {
    header: typeof format.header;
    command: typeof format.command;
    number: typeof format.number;
};
export default colors;
export declare const simpleFormat: {
    header: (text: string) => string;
    command: (text: string) => string;
    number: (num: number) => string;
    success: (text: string) => string;
    warning: (text: string) => string;
    error: (text: string) => string;
    info: (text: string) => string;
};
export declare function createSimpleBox(content: string, title?: string, borderColorName?: string | any): string;
//# sourceMappingURL=colors.d.ts.map