export declare class WriteBarrier {
    private static instance;
    private allowedPaths;
    static getInstance(): WriteBarrier;
    constructor();
    writeFile(filePath: string, content: string | Buffer): Promise<void>;
}
//# sourceMappingURL=write-barrier.d.ts.map