/**
 * Metrics Adapter - MCP Local Adapter
 * 
 * Proporciona operaciones de métricas y KPIs,
 * leyendo/escribiendo desde obs/kpi/events.jsonl.
 */

import { readFile, writeFile, appendFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

export interface MetricsAdapter {
  emitEvent(event: KPIEvent): Promise<void>;
  getEvents(limit?: number): Promise<KPIEvent[]>;
  getMetrics(timeRange?: { start: Date; end: Date }): Promise<MetricsSummary>;
}

export interface KPIEvent {
  ts: number;
  repo?: string;
  skills?: string[];
  errors_ts?: number;
  auto_resolver_used?: boolean;
  latency_ms?: number;
  zero_errors_left_behind?: boolean;
  activated_by?: {
    [skillId: string]: number;
  };
  adherence?: {
    skill_id: string;
    score: number;
  }[];
  progressive_disclosure?: {
    skill_id: string;
    resources_loaded: string[];
  }[];
  violations?: {
    skillId: string;
    pattern: string;
    enforcement: 'suggest' | 'warn' | 'block';
  }[];
}

export interface MetricsSummary {
  totalEvents: number;
  averageLatency: number;
  skillActivations: Record<string, number>;
  errorRate: number;
  zeroErrorsRate: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class LocalMetricsAdapter implements MetricsAdapter {
  constructor(
    private eventsFile: string = 'obs/kpi/events.jsonl',
    private basePath: string = process.cwd()
  ) {}

  private async ensureEventsFile(): Promise<void> {
    const fullPath = resolve(this.basePath, this.eventsFile);
    const dir = resolve(fullPath, '..');
    
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    
    if (!existsSync(fullPath)) {
      // Create empty file
      await writeFile(fullPath, '', 'utf-8');
    }
  }

  async emitEvent(event: KPIEvent): Promise<void> {
    await this.ensureEventsFile();
    const fullPath = resolve(this.basePath, this.eventsFile);
    const line = JSON.stringify(event) + '\n';
    await appendFile(fullPath, line, 'utf-8');
  }

  async getEvents(limit?: number): Promise<KPIEvent[]> {
    await this.ensureEventsFile();
    const fullPath = resolve(this.basePath, this.eventsFile);
    
    try {
      const content = await readFile(fullPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      const events: KPIEvent[] = lines.map(line => JSON.parse(line));
      
      // Sort by timestamp descending
      events.sort((a, b) => b.ts - a.ts);
      
      return limit ? events.slice(0, limit) : events;
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        return [];
      }
      throw new Error(`Error reading events: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getMetrics(timeRange?: { start: Date; end: Date }): Promise<MetricsSummary> {
    const events = await this.getEvents();
    
    // Filter by time range if provided
    let filteredEvents = events;
    if (timeRange) {
      filteredEvents = events.filter(e => {
        const eventDate = new Date(e.ts);
        return eventDate >= timeRange.start && eventDate <= timeRange.end;
      });
    }

    if (filteredEvents.length === 0) {
      return {
        totalEvents: 0,
        averageLatency: 0,
        skillActivations: {},
        errorRate: 0,
        zeroErrorsRate: 0,
        timeRange: {
          start: timeRange?.start || new Date(),
          end: timeRange?.end || new Date(),
        },
      };
    }

    // Calculate metrics
    const latencies = filteredEvents
      .map(e => e.latency_ms || 0)
      .filter(l => l > 0);
    const averageLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    // Count skill activations
    const skillActivations: Record<string, number> = {};
    filteredEvents.forEach(event => {
      if (event.activated_by) {
        Object.entries(event.activated_by).forEach(([skillId, count]) => {
          skillActivations[skillId] = (skillActivations[skillId] || 0) + (typeof count === 'number' ? count : 1);
        });
      }
      if (event.skills) {
        event.skills.forEach(skillId => {
          skillActivations[skillId] = (skillActivations[skillId] || 0) + 1;
        });
      }
    });

    // Calculate error rates
    const eventsWithErrors = filteredEvents.filter(e => (e.errors_ts || 0) > 0).length;
    const errorRate = filteredEvents.length > 0 ? eventsWithErrors / filteredEvents.length : 0;

    const zeroErrorsCount = filteredEvents.filter(e => e.zero_errors_left_behind === true).length;
    const zeroErrorsRate = filteredEvents.length > 0 ? zeroErrorsCount / filteredEvents.length : 0;

    return {
      totalEvents: filteredEvents.length,
      averageLatency: Math.round(averageLatency),
      skillActivations,
      errorRate,
      zeroErrorsRate,
      timeRange: {
        start: timeRange?.start || new Date(Math.min(...filteredEvents.map(e => e.ts))),
        end: timeRange?.end || new Date(Math.max(...filteredEvents.map(e => e.ts))),
      },
    };
  }
}

// Export singleton instance
export const metricsAdapter = new LocalMetricsAdapter();


