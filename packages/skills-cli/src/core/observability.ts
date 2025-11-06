import { StateManager } from './state-manager';

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

export class TelemetryCollector {
  private events: TelemetryEvent[] = [];

  recordEvent(event: TelemetryEvent): void {
    const sanitized = this.sanitizeEvent(event);
    this.events.push(sanitized);
  }

  private sanitizeEvent(event: TelemetryEvent): TelemetryEvent {
    const { ...sanitized } = event;
    return sanitized;
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

export class ObservabilityManager {
  private stateManager: StateManager;
  private telemetry: TelemetryCollector;

  constructor() {
    this.stateManager = new StateManager();
    this.telemetry = new TelemetryCollector();
  }

  async recordStep(step: string, durationMs: number, success: boolean, error?: string): Promise<void> {
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

  async recordRAG(query: string, topK: number, hits: number, durationMs: number): Promise<void> {
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

  async recordMemory(backend: string, size: number, status: string): Promise<void> {
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


