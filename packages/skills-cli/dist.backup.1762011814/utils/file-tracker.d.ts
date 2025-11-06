export interface EditLog {
    file: string;
    repo: string;
    timestamp: string;
}
export declare function trackEdits(): Promise<EditLog[]>;
export declare function detectRepos(edits: EditLog[]): string[];
//# sourceMappingURL=file-tracker.d.ts.map