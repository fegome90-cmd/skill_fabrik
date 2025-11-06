export declare class IsolatedComponent {
    private componentName;
    private isHealthy;
    private errorCount;
    private maxErrors;
    constructor(name: string);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private incrementErrorCount;
    private resetErrorCount;
    private withTimeout;
    get healthStatus(): boolean;
}
//# sourceMappingURL=isolated-component.d.ts.map