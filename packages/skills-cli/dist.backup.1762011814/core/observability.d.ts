export interface TelemetryEvent {
    type: string;
    step?: string;
    durationMs?: number;
    ragTopK?: number;
    memorySize?: number;
    model?: string;
    tokens?: number;
    hits?: number;
    failCount?: number;
    mode?: string;
}
export declare class TelemetryCollector {
    private events;
    recordEvent(event: TelemetryEvent): void;
    private sanitizeEvent;
    getEvents(): TelemetryEvent[];
    clearEvents(): void;
}
export declare class ObservabilityManager {
    private stateManager;
    private telemetry;
    constructor();
    recordStep(step: string, durationMs: number, success: boolean, error?: string): Promise<void>;
    recordRAG(query: string, topK: number, hits: number, durationMs: number): Promise<void>;
    recordMemory(backend: string, size: number, status: string): Promise<void>;
}
//# sourceMappingURL=observability.d.ts.map