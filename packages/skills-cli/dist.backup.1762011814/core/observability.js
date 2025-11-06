import { StateManager } from './state-manager';
export class TelemetryCollector {
    events = [];
    recordEvent(event) {
        const sanitized = this.sanitizeEvent(event);
        this.events.push(sanitized);
    }
    sanitizeEvent(event) {
        const { ...sanitized } = event;
        return sanitized;
    }
    getEvents() {
        return [...this.events];
    }
    clearEvents() {
        this.events = [];
    }
}
export class ObservabilityManager {
    stateManager;
    telemetry;
    constructor() {
        this.stateManager = new StateManager();
        this.telemetry = new TelemetryCollector();
    }
    async recordStep(step, durationMs, success, error) {
        const metric = {
            type: 'step',
            step,
            durationMs,
            success,
            error,
            timestamp: Date.now()
        };
        this.telemetry.recordEvent(metric);
        await this.stateManager.appendMetrics(metric);
    }
    async recordRAG(query, topK, hits, durationMs) {
        const metric = {
            type: 'rag',
            query,
            topK,
            hits,
            durationMs,
            timestamp: Date.now()
        };
        this.telemetry.recordEvent(metric);
        await this.stateManager.appendMetrics(metric);
    }
    async recordMemory(backend, size, status) {
        const metric = {
            type: 'memory',
            backend,
            size,
            status,
            timestamp: Date.now()
        };
        this.telemetry.recordEvent(metric);
        await this.stateManager.appendMetrics(metric);
    }
}
//# sourceMappingURL=observability.js.map