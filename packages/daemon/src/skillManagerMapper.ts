/**
 * Skill Manager API Mapper
 * 
 * Transforms skills-fabrik data (registry + KPI events) into Skill Manager Dashboard format
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Skill Manager Dashboard Types (matching types.ts)
export interface Skill {
  name: string;
  healthScore: number;
  activations: number;
  issues: number;
  warnings: number;
  lastActivated: string;
}

export interface SystemHealthSummary {
  totalSkills: number;
  healthySkills: number;
  overallHealth: number;
  skillsNeedingAttention: number;
  criticalIssues: number;
  avgActivationRate: number;
}

export interface SystemHealthMetrics {
  totalActivations: number;
  avgAccuracy: number;
  totalTokensUsed: number;
  avgTokensPerActivation: number;
}

export interface SystemHealth {
  summary: SystemHealthSummary;
  metrics: SystemHealthMetrics;
}

export interface ActivationHistoryPoint {
  time: string;
  activations: number;
}

export interface RealtimeMetrics {
  activationsToday: number;
  liveActivations: number;
  activationHistory: ActivationHistoryPoint[];
}

// Skills-Fabrik Types
interface RegistrySkill {
  name: string;
  description: string;
  severity: string;
  triggers: {
    keywords: string[];
  };
}

interface RegistryData {
  skills: RegistrySkill[];
  version: string;
  generatedAt: string;
}

interface KPIEvent {
  ts: string | number;
  repo?: string;
  skills?: string[];
  adherence?: boolean | Array<{ skill_id: string; score: number }>;
  latency_ms?: number;
  tokens_total?: number;
  zero_errors_left_behind?: boolean;
  violations?: Array<{
    skillId: string;
    pattern: string;
    enforcement: 'suggest' | 'warn' | 'block';
  }>;
  activated_by?: {
    [key: string]: boolean | number;
  };
}

export class SkillManagerMapper {
  private registryPath: string;
  private kpiEventsPath: string;

  constructor(
    registryPath: string = './registry/index.json',
    kpiEventsPath: string = './obs/kpi/events.jsonl'
  ) {
    this.registryPath = resolve(process.cwd(), registryPath);
    this.kpiEventsPath = resolve(process.cwd(), kpiEventsPath);
  }

  async loadRegistry(): Promise<RegistryData> {
    try {
      const content = await readFile(this.registryPath, 'utf-8');
      return JSON.parse(content) as RegistryData;
    } catch (error) {
      console.error('Failed to load registry:', error);
      return { skills: [], version: '1.0.0', generatedAt: new Date().toISOString() };
    }
  }

  async loadKPIEvents(): Promise<KPIEvent[]> {
    if (!existsSync(this.kpiEventsPath)) {
      return [];
    }

    try {
      const content = await readFile(this.kpiEventsPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.map(line => {
        try {
          return JSON.parse(line) as KPIEvent;
        } catch {
          return null;
        }
      }).filter((e): e is KPIEvent => e !== null);
    } catch (error) {
      console.error('Failed to load KPI events:', error);
      return [];
    }
  }

  calculateHealthScore(skillName: string, events: KPIEvent[]): number {
    const skillEvents = events.filter(e => 
      e.skills?.includes(skillName) || 
      e.activated_by?.[skillName]
    );

    if (skillEvents.length === 0) {
      return 50; // Neutral score for unused skills
    }

    let healthScore = 100;

    // Factor in adherence rate
    const eventsWithAdherence = skillEvents.filter(e => e.adherence !== undefined);
    if (eventsWithAdherence.length > 0) {
      const adherenceTrue = eventsWithAdherence.filter(e => {
        if (typeof e.adherence === 'boolean') {
          return e.adherence;
        }
        if (Array.isArray(e.adherence)) {
          return e.adherence.some(a => a.score >= 0.8);
        }
        return false;
      }).length;
      
      const adherenceRate = adherenceTrue / eventsWithAdherence.length;
      healthScore = Math.round(healthScore * adherenceRate);
    }

    // Factor in zero errors rate
    const eventsWithErrors = skillEvents.filter(e => e.zero_errors_left_behind !== undefined);
    if (eventsWithErrors.length > 0) {
      const zeroErrorsCount = eventsWithErrors.filter(e => e.zero_errors_left_behind === true).length;
      const zeroErrorsRate = zeroErrorsCount / eventsWithErrors.length;
      healthScore = Math.round(healthScore * (0.7 + 0.3 * zeroErrorsRate));
    }

    // Factor in violations
    const violationEvents = skillEvents.filter(e => e.violations && e.violations.length > 0);
    if (violationEvents.length > 0) {
      const totalViolations = violationEvents.reduce((sum, e) => sum + (e.violations?.length || 0), 0);
      const blockViolations = violationEvents.reduce((sum, e) => 
        sum + (e.violations?.filter(v => v.enforcement === 'block').length || 0), 0
      );
      
      const violationPenalty = (blockViolations / totalViolations) * 20;
      healthScore = Math.max(0, Math.round(healthScore - violationPenalty));
    }

    return Math.min(100, Math.max(0, healthScore));
  }

  getActivationCount(skillName: string, events: KPIEvent[]): number {
    return events.filter(e => 
      e.skills?.includes(skillName) || 
      e.activated_by?.[skillName] === true
    ).length;
  }

  getIssueCount(skillName: string, events: KPIEvent[]): number {
    let issues = 0;
    
    events.forEach(event => {
      if (event.skills?.includes(skillName) || event.activated_by?.[skillName]) {
        // Count violations as issues
        if (event.violations) {
          issues += event.violations.filter(v => v.enforcement === 'block').length;
        }
        
        // Count adherence failures as issues
        if (event.adherence === false) {
          issues += 1;
        }
        
        // Count errors left behind as issues
        if (event.zero_errors_left_behind === false) {
          issues += 1;
        }
      }
    });

    return issues;
  }

  getWarningCount(skillName: string, events: KPIEvent[]): number {
    let warnings = 0;
    
    events.forEach(event => {
      if (event.skills?.includes(skillName) || event.activated_by?.[skillName]) {
        // Count warn-level violations as warnings
        if (event.violations) {
          warnings += event.violations.filter(v => v.enforcement === 'warn').length;
        }
        
        // Count suggest-level violations as warnings
        if (event.violations) {
          warnings += event.violations.filter(v => v.enforcement === 'suggest').length;
        }
      }
    });

    return warnings;
  }

  getLastActivation(skillName: string, events: KPIEvent[]): string {
    const skillEvents = events.filter(e => 
      e.skills?.includes(skillName) || 
      e.activated_by?.[skillName]
    ).sort((a, b) => {
      const timeA = typeof a.ts === 'string' ? new Date(a.ts).getTime() : a.ts;
      const timeB = typeof b.ts === 'string' ? new Date(b.ts).getTime() : b.ts;
      return timeB - timeA;
    });

    if (skillEvents.length === 0) {
      return 'never';
    }

    const lastEvent = skillEvents[0];
    const lastTime = typeof lastEvent.ts === 'string' ? new Date(lastEvent.ts) : new Date(lastEvent.ts);
    const now = new Date();
    const diffMs = now.getTime() - lastTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  }

  async getSkills(): Promise<Skill[]> {
    const [registry, events] = await Promise.all([
      this.loadRegistry(),
      this.loadKPIEvents()
    ]);

    return registry.skills.map(skill => ({
      name: skill.name,
      healthScore: this.calculateHealthScore(skill.name, events),
      activations: this.getActivationCount(skill.name, events),
      issues: this.getIssueCount(skill.name, events),
      warnings: this.getWarningCount(skill.name, events),
      lastActivated: this.getLastActivation(skill.name, events)
    }));
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const [registry, events] = await Promise.all([
      this.loadRegistry(),
      this.loadKPIEvents()
    ]);

    const skills = await this.getSkills();
    const totalSkills = skills.length;
    const healthySkills = skills.filter(s => s.healthScore >= 80).length;
    const skillsNeedingAttention = skills.filter(s => s.healthScore < 60).length;
    const criticalIssues = skills.reduce((sum, s) => sum + s.issues, 0);
    
    const totalActivations = skills.reduce((sum, s) => sum + s.activations, 0);
    const avgActivationRate = totalSkills > 0 ? totalActivations / totalSkills : 0;
    const overallHealth = totalSkills > 0 ? skills.reduce((sum, s) => sum + s.healthScore, 0) / totalSkills : 0;

    // Calculate metrics from KPI events
    const eventsWithTokens = events.filter(e => e.tokens_total && e.tokens_total > 0);
    const totalTokensUsed = eventsWithTokens.reduce((sum, e) => sum + (e.tokens_total || 0), 0);
    const avgTokensPerActivation = eventsWithTokens.length > 0 ? totalTokensUsed / eventsWithTokens.length : 0;

    const eventsWithAdherence = events.filter(e => e.adherence !== undefined);
    const adherenceTrue = eventsWithAdherence.filter(e => {
      if (typeof e.adherence === 'boolean') {
        return e.adherence;
      }
      if (Array.isArray(e.adherence)) {
        return e.adherence.some(a => a.score >= 0.8);
      }
      return false;
    }).length;
    const avgAccuracy = eventsWithAdherence.length > 0 ? (adherenceTrue / eventsWithAdherence.length) * 100 : 0;

    return {
      summary: {
        totalSkills,
        healthySkills,
        overallHealth: Math.round(overallHealth),
        skillsNeedingAttention,
        criticalIssues,
        avgActivationRate: Math.round(avgActivationRate * 100) / 100
      },
      metrics: {
        totalActivations,
        avgAccuracy: Math.round(avgAccuracy),
        totalTokensUsed,
        avgTokensPerActivation: Math.round(avgTokensPerActivation)
      }
    };
  }

  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    const events = await this.loadKPIEvents();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Filter events from today
    const todayEvents = events.filter(e => {
      const eventTime = typeof e.ts === 'string' ? new Date(e.ts) : new Date(e.ts);
      return eventTime >= todayStart;
    });

    // Count activations per hour for today
    const activationsByHour: { [key: string]: number } = {};
    todayEvents.forEach(event => {
      const eventTime = typeof event.ts === 'string' ? new Date(event.ts) : new Date(event.ts);
      const hourKey = eventTime.toISOString().substring(0, 13); // YYYY-MM-DDTHH
      if (event.skills && event.skills.length > 0) {
        activationsByHour[hourKey] = (activationsByHour[hourKey] || 0) + event.skills.length;
      }
    });

    // Create activation history for the last 24 hours
    const activationHistory: ActivationHistoryPoint[] = [];
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = time.toISOString().substring(0, 13);
      activationHistory.push({
        time: time.toISOString(),
        activations: activationsByHour[hourKey] || 0
      });
    }

    // Calculate today's total activations
    const activationsToday = todayEvents.reduce((sum, e) => 
      sum + (e.skills?.length || 0), 0
    );

    // Calculate "live" activations (last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const liveActivations = events.filter(e => {
      const eventTime = typeof e.ts === 'string' ? new Date(e.ts) : new Date(e.ts);
      return eventTime >= fiveMinutesAgo && e.skills && e.skills.length > 0;
    }).length;

    return {
      activationsToday,
      liveActivations,
      activationHistory
    };
  }
}
