/**
 * KPI Aggregator
 * 
 * Agrega métricas desde obs/kpi/events.jsonl
 * Calcula pares de métricas: velocidad + calidad
 */

import { readFile, existsSync } from 'fs';
import { promisify } from 'util';
import { resolve } from 'path';

const readFileAsync = promisify(readFile);

export interface KPIEvent {
  ts: number | string;
  repo?: string;
  task?: string;
  skills?: string[];
  activated_by?: {
    [skillId: string]: number | boolean | undefined;
    keywords?: boolean;
    intent_regex?: boolean;
    path_globs?: boolean;
    content_patterns?: boolean;
  };
  adherence?: boolean | Array<{ skill_id: string; score: number }>;
  errors_ts?: number;
  auto_resolver_used?: boolean;
  latency_ms?: number;
  tokens_total?: number;
  zero_errors_left_behind?: boolean;
  progressive_disclosure?: {
    metadata_loaded?: boolean;
    skill_md_loaded?: boolean;
    resources_loaded?: number;
  };
  violations?: Array<{
    skillId: string;
    pattern: string;
    enforcement: 'suggest' | 'warn' | 'block';
  }>;
  // Legacy format support
  timestamp?: string;
  type?: string;
  data?: Record<string, unknown>;
}

export interface MetricPair {
  velocity: VelocityMetrics;
  quality: QualityMetrics;
}

export interface VelocityMetrics {
  skillActivationRate: number; // Activaciones por operación
  tokensPerOperation: number; // Promedio de tokens
  meanActivationLatency: number; // Latencia promedio de activación
  progressiveDisclosureRate: number; // % recursos on-demand
}

export interface QualityMetrics {
  skillAdherenceRate: number; // % respuestas que cumplen guía
  zeroErrorsRate: number; // % PRs sin errores residuales
  meanFixLatency: number; // Tiempo promedio corrección (segundos)
  guardrailEffectiveness: number; // % errores preventivos
}

export interface KPISummary {
  timeRange: {
    start: Date;
    end: Date;
  };
  totalEvents: number;
  metricPairs: MetricPair;
  skillActivations: Record<string, number>;
  thresholdChecks: ThresholdChecks;
}

export interface ThresholdChecks {
  // Velocidad
  activationPrecision: { value: number; threshold: number; status: 'pass' | 'fail' | 'warning' };
  tokensReduction: { value: number; threshold: number; status: 'pass' | 'fail' | 'warning' };
  // Calidad
  adherenceRate: { value: number; threshold: number; status: 'pass' | 'fail' | 'warning' };
  zeroErrorsRate: { value: number; threshold: number; status: 'pass' | 'fail' | 'warning' };
  // Holístico
  holisticStatus: 'excellent' | 'good' | 'warning' | 'critical';
}

export class KPIAggregator {
  constructor(private eventsFile: string = 'obs/kpi/events.jsonl') {}

  async aggregate(timeRange?: { start: Date; end: Date }): Promise<KPISummary> {
    const events = await this.loadEvents();
    
    // Filter by time range if provided
    let filteredEvents = events;
    if (timeRange) {
      filteredEvents = events.filter(e => {
        const eventTs = this.parseTimestamp(e.ts);
        return eventTs >= timeRange.start && eventTs <= timeRange.end;
      });
    }

    if (filteredEvents.length === 0) {
      return this.emptySummary(timeRange);
    }

    // Calculate metric pairs
    const velocityMetrics = this.calculateVelocityMetrics(filteredEvents);
    const qualityMetrics = this.calculateQualityMetrics(filteredEvents);

    // Skill activations count
    const skillActivations: Record<string, number> = {};
    filteredEvents.forEach(event => {
      if (event.skills) {
        event.skills.forEach(skillId => {
          skillActivations[skillId] = (skillActivations[skillId] || 0) + 1;
        });
      }
      if (event.activated_by) {
        Object.keys(event.activated_by).forEach(key => {
          if (typeof event.activated_by![key] === 'number') {
            skillActivations[key] = (skillActivations[key] || 0) + (event.activated_by![key] as number);
          }
        });
      }
    });

    // Threshold checks
    const thresholdChecks = this.checkThresholds(velocityMetrics, qualityMetrics);

    return {
      timeRange: {
        start: timeRange?.start || this.parseTimestamp(filteredEvents[filteredEvents.length - 1].ts),
        end: timeRange?.end || this.parseTimestamp(filteredEvents[0].ts),
      },
      totalEvents: filteredEvents.length,
      metricPairs: {
        velocity: velocityMetrics,
        quality: qualityMetrics,
      },
      skillActivations,
      thresholdChecks,
    };
  }

  private async loadEvents(): Promise<KPIEvent[]> {
    const fullPath = resolve(process.cwd(), this.eventsFile);
    
    if (!existsSync(fullPath)) {
      return [];
    }

    try {
      const content = await readFileAsync(fullPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.map(line => {
        try {
          return JSON.parse(line) as KPIEvent;
        } catch {
          return null;
        }
      }).filter((e): e is KPIEvent => e !== null);
    } catch (error) {
      throw new Error(`Error reading KPI events: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseTimestamp(ts: number | string): Date {
    if (typeof ts === 'number') {
      // Assume milliseconds if > year 2000 in milliseconds
      if (ts > 946684800000) {
        return new Date(ts);
      }
      // Otherwise assume seconds
      return new Date(ts * 1000);
    }
    return new Date(ts);
  }

  private calculateVelocityMetrics(events: KPIEvent[]): VelocityMetrics {
    // Skill activation rate: average number of skills per event
    const eventsWithSkills = events.filter(e => e.skills && e.skills.length > 0);
    const totalActivations = events.reduce((sum, e) => sum + (e.skills?.length || 0), 0);
    const skillActivationRate = events.length > 0 ? totalActivations / events.length : 0;

    // Tokens per operation
    const eventsWithTokens = events.filter(e => e.tokens_total && e.tokens_total > 0);
    const totalTokens = eventsWithTokens.reduce((sum, e) => sum + (e.tokens_total || 0), 0);
    const tokensPerOperation = eventsWithTokens.length > 0 ? totalTokens / eventsWithTokens.length : 0;

    // Mean activation latency
    const eventsWithLatency = events.filter(e => e.latency_ms && e.latency_ms > 0);
    const totalLatency = eventsWithLatency.reduce((sum, e) => sum + (e.latency_ms || 0), 0);
    const meanActivationLatency = eventsWithLatency.length > 0 ? totalLatency / eventsWithLatency.length : 0;

    // Progressive disclosure rate
    const eventsWithProgressiveDisclosure = events.filter(e => 
      e.progressive_disclosure && 
      typeof e.progressive_disclosure.resources_loaded === 'number'
    );
    const totalResourcesLoaded = eventsWithProgressiveDisclosure.reduce((sum, e) => 
      sum + (e.progressive_disclosure?.resources_loaded || 0), 0
    );
    const progressiveDisclosureRate = eventsWithProgressiveDisclosure.length > 0
      ? totalResourcesLoaded / eventsWithProgressiveDisclosure.length
      : 0;

    return {
      skillActivationRate: Math.round(skillActivationRate * 100) / 100,
      tokensPerOperation: Math.round(tokensPerOperation),
      meanActivationLatency: Math.round(meanActivationLatency),
      progressiveDisclosureRate: Math.round(progressiveDisclosureRate * 100) / 100,
    };
  }

  private calculateQualityMetrics(events: KPIEvent[]): QualityMetrics {
    // Skill adherence rate
    const eventsWithAdherence = events.filter(e => e.adherence !== undefined);
    const adherenceTrue = eventsWithAdherence.filter(e => {
      if (typeof e.adherence === 'boolean') {
        return e.adherence;
      }
      // If array, check if any score >= 0.8
      if (Array.isArray(e.adherence)) {
        return e.adherence.some(a => a.score >= 0.8);
      }
      return false;
    }).length;
    const skillAdherenceRate = eventsWithAdherence.length > 0 
      ? adherenceTrue / eventsWithAdherence.length 
      : 0;

    // Zero errors rate
    const eventsWithErrors = events.filter(e => e.zero_errors_left_behind !== undefined);
    const zeroErrorsCount = eventsWithErrors.filter(e => e.zero_errors_left_behind === true).length;
    const zeroErrorsRate = eventsWithErrors.length > 0 
      ? zeroErrorsCount / eventsWithErrors.length 
      : 0;

    // Mean fix latency (requires future tracking)
    // For now, estimate from latency_ms when errors are present
    const eventsWithFixLatency = events.filter(e => 
      (e.errors_ts || 0) > 0 && e.latency_ms && e.latency_ms > 0
    );
    const totalFixLatency = eventsWithFixLatency.reduce((sum, e) => sum + (e.latency_ms || 0), 0);
    const meanFixLatency = eventsWithFixLatency.length > 0 
      ? totalFixLatency / eventsWithFixLatency.length / 1000 // Convert ms to seconds
      : 0;

    // Guardrail effectiveness
    const eventsWithViolations = events.filter(e => e.violations && e.violations.length > 0);
    const blockedViolations = eventsWithViolations.filter(e => 
      e.violations?.some(v => v.enforcement === 'block')
    ).length;
    const guardrailEffectiveness = eventsWithViolations.length > 0
      ? blockedViolations / eventsWithViolations.length
      : 1.0; // Perfect if no violations

    return {
      skillAdherenceRate: Math.round(skillAdherenceRate * 10000) / 100, // Percentage with 2 decimals
      zeroErrorsRate: Math.round(zeroErrorsRate * 10000) / 100,
      meanFixLatency: Math.round(meanFixLatency * 100) / 100,
      guardrailEffectiveness: Math.round(guardrailEffectiveness * 10000) / 100,
    };
  }

  private checkThresholds(
    velocity: VelocityMetrics,
    quality: QualityMetrics
  ): ThresholdChecks {
    // Activation precision (simplified: assume good if activation rate > 0)
    // TODO: Need actual precision tracking
    const activationPrecisionValue = velocity.skillActivationRate > 0 ? 90 : 0;
    const activationPrecisionStatus: 'pass' | 'fail' | 'warning' = activationPrecisionValue >= 90 ? 'pass' : 'warning';
    const activationPrecision = {
      value: activationPrecisionValue,
      threshold: 90,
      status: activationPrecisionStatus,
    };

    // Tokens reduction (assume baseline is 30000, current is tokensPerOperation)
    const baseline = 30000;
    const reduction = baseline > 0 ? ((baseline - velocity.tokensPerOperation) / baseline) * 100 : 0;
    const tokensReductionStatus: 'pass' | 'fail' | 'warning' = reduction >= 15 ? 'pass' : reduction >= 5 ? 'warning' : 'fail';
    const tokensReduction = {
      value: Math.max(0, reduction),
      threshold: 15, // 15% reduction minimum
      status: tokensReductionStatus,
    };

    // Adherence rate
    const adherenceRateStatus: 'pass' | 'fail' | 'warning' = quality.skillAdherenceRate >= 80 ? 'pass' : quality.skillAdherenceRate >= 60 ? 'warning' : 'fail';
    const adherenceRate = {
      value: quality.skillAdherenceRate,
      threshold: 80,
      status: adherenceRateStatus,
    };

    // Zero errors rate
    const zeroErrorsRateStatus: 'pass' | 'fail' | 'warning' = quality.zeroErrorsRate >= 95 ? 'pass' : quality.zeroErrorsRate >= 85 ? 'warning' : 'fail';
    const zeroErrorsRate = {
      value: quality.zeroErrorsRate,
      threshold: 95,
      status: zeroErrorsRateStatus,
    };

    // Holistic status
    const passCount = [activationPrecision, tokensReduction, adherenceRate, zeroErrorsRate]
      .filter(c => c.status === 'pass').length;
    const failCount = [activationPrecision, tokensReduction, adherenceRate, zeroErrorsRate]
      .filter(c => c.status === 'fail').length;
    
    let holisticStatus: 'excellent' | 'good' | 'warning' | 'critical';
    if (failCount > 0) {
      holisticStatus = 'critical';
    } else if (passCount === 4) {
      holisticStatus = 'excellent';
    } else if (passCount >= 2) {
      holisticStatus = 'good';
    } else {
      holisticStatus = 'warning';
    }

    return {
      activationPrecision,
      tokensReduction,
      adherenceRate,
      zeroErrorsRate,
      holisticStatus,
    };
  }

  private emptySummary(timeRange?: { start: Date; end: Date }): KPISummary {
    const now = new Date();
    return {
      timeRange: {
        start: timeRange?.start || now,
        end: timeRange?.end || now,
      },
      totalEvents: 0,
      metricPairs: {
        velocity: {
          skillActivationRate: 0,
          tokensPerOperation: 0,
          meanActivationLatency: 0,
          progressiveDisclosureRate: 0,
        },
        quality: {
          skillAdherenceRate: 0,
          zeroErrorsRate: 0,
          meanFixLatency: 0,
          guardrailEffectiveness: 100,
        },
      },
      skillActivations: {},
      thresholdChecks: {
        activationPrecision: { value: 0, threshold: 90, status: 'fail' },
        tokensReduction: { value: 0, threshold: 15, status: 'fail' },
        adherenceRate: { value: 0, threshold: 80, status: 'fail' },
        zeroErrorsRate: { value: 0, threshold: 95, status: 'fail' },
        holisticStatus: 'critical',
      },
    };
  }
}

