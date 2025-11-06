import { type ScoreInput, type Signal } from '../types.js';

export interface ActivityEvent {
  skillName: string;
  timestamp: number;
  success: boolean;
  duration?: number; // ms
  context?: string; // brief context description
}

export interface ActivityConfig {
  timeWindows: number[]; // in milliseconds, e.g., [5*60*1000, 30*60*1000, 2*60*60*1000]
  decayFunction: 'linear' | 'exponential' | 'logarithmic';
  maxEvents: number; // max events to keep in memory
  weights: {
    recentSuccess: number;
    recentFailure: number;
    frequency: number;
    consistency: number;
  };
}

export class RecentActivitySignal implements Signal {
  name = 'recentActivity';
  private readonly config: ActivityConfig;
  private events: ActivityEvent[] = [];
  private readonly maxEvents: number;

  constructor(config?: Partial<ActivityConfig>) {
    this.config = {
      timeWindows: [5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000], // 5min, 30min, 2hr
      decayFunction: 'exponential',
      maxEvents: 1000,
      weights: {
        recentSuccess: 0.3,
        recentFailure: -0.2,
        frequency: 0.25,
        consistency: 0.25
      },
      ...config
    };
    this.maxEvents = this.config.maxEvents;
  }

  async score({ skillName, context }: ScoreInput): Promise<number> {
    const now = Date.now();
    const recentEvents = this.getRecentEvents(skillName, now);

    if (recentEvents.length === 0) {
      return 0; // No recent activity
    }

    // Calculate different activity metrics
    const recentSuccess = this.calculateRecentSuccess(recentEvents, now);
    const recentFailure = this.calculateRecentFailure(recentEvents, now);
    const frequency = this.calculateFrequency(recentEvents, now);
    const consistency = this.calculateConsistency(recentEvents);

    // Combine metrics using configured weights
    let score = 0;
    score += recentSuccess * this.config.weights.recentSuccess;
    score += recentFailure * this.config.weights.recentFailure; // negative weight
    score += frequency * this.config.weights.frequency;
    score += consistency * this.config.weights.consistency;

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  private getRecentEvents(skillName: string, now: number): ActivityEvent[] {
    const maxAge = Math.max(...this.config.timeWindows);
    return this.events
      .filter(event =>
        event.skillName === skillName &&
        (now - event.timestamp) <= maxAge
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  private calculateRecentSuccess(events: ActivityEvent[], now: number): number {
    const successfulEvents = events.filter(e => e.success);
    if (successfulEvents.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    for (const event of successfulEvents) {
      const age = now - event.timestamp;
      const weight = this.calculateDecayWeight(age);
      totalScore += weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateRecentFailure(events: ActivityEvent[], now: number): number {
    const failedEvents = events.filter(e => !e.success);
    if (failedEvents.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    for (const event of failedEvents) {
      const age = now - event.timestamp;
      const weight = this.calculateDecayWeight(age);
      totalScore += weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateFrequency(events: ActivityEvent[], now: number): number {
    if (events.length === 0) return 0;

    // Count events in each time window
    const counts = this.config.timeWindows.map(window => {
      const cutoff = now - window;
      return events.filter(e => e.timestamp >= cutoff).length;
    });

    // Normalize by expected frequency (more events = higher score)
    const maxExpectedCount = 10; // expected max events per time window
    const normalizedCounts = counts.map(count => Math.min(count / maxExpectedCount, 1));

    // Weight recent windows more heavily
    const windowWeights = [0.5, 0.3, 0.2]; // recent, medium, long-term
    let weightedScore = 0;
    for (let i = 0; i < normalizedCounts.length; i++) {
      weightedScore += normalizedCounts[i] * windowWeights[i];
    }

    return weightedScore;
  }

  private calculateConsistency(events: ActivityEvent[]): number {
    if (events.length < 2) return 0;

    // Calculate success rate consistency over time
    const windowSize = Math.min(10, Math.floor(events.length / 2));
    const windows: number[] = [];

    for (let i = 0; i <= events.length - windowSize; i += windowSize) {
      const window = events.slice(i, i + windowSize);
      const successRate = window.filter(e => e.success).length / window.length;
      windows.push(successRate);
    }

    if (windows.length < 2) return 0;

    // Calculate consistency (lower variance = higher consistency)
    const mean = windows.reduce((a, b) => a + b, 0) / windows.length;
    const variance = windows.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windows.length;
    const consistency = Math.max(0, 1 - Math.sqrt(variance));

    // Factor in overall success rate
    const overallSuccessRate = events.filter(e => e.success).length / events.length;
    return consistency * overallSuccessRate;
  }

  private calculateDecayWeight(age: number): number {
    const maxAge = Math.max(...this.config.timeWindows);
    const normalizedAge = age / maxAge;

    switch (this.config.decayFunction) {
      case 'linear':
        return Math.max(0, 1 - normalizedAge);

      case 'exponential':
        return Math.exp(-2 * normalizedAge);

      case 'logarithmic':
        return Math.max(0, 1 - Math.log(1 + normalizedAge) / Math.log(2));

      default:
        return Math.max(0, 1 - normalizedAge);
    }
  }

  // Public API for activity tracking

  recordActivation(skillName: string, success: boolean, duration?: number, context?: string): void {
    const event: ActivityEvent = {
      skillName,
      timestamp: Date.now(),
      success,
      duration,
      context
    };

    this.events.push(event);

    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getSkillStats(skillName: string): {
    totalActivations: number;
    successRate: number;
    avgDuration: number;
    lastActivation: number | null;
    recentActivations: number;
  } {
    const skillEvents = this.events.filter(e => e.skillName === skillName);
    const now = Date.now();
    const recentEvents = skillEvents.filter(e => (now - e.timestamp) <= 60 * 60 * 1000); // last hour

    const successfulEvents = skillEvents.filter(e => e.success);
    const eventsWithDuration = skillEvents.filter(e => e.duration !== undefined);

    return {
      totalActivations: skillEvents.length,
      successRate: skillEvents.length > 0 ? successfulEvents.length / skillEvents.length : 0,
      avgDuration: eventsWithDuration.length > 0
        ? eventsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / eventsWithDuration.length
        : 0,
      lastActivation: skillEvents.length > 0 ? skillEvents[skillEvents.length - 1].timestamp : null,
      recentActivations: recentEvents.length
    };
  }

  getAllStats(): Record<string, any> {
    const skills = [...new Set(this.events.map(e => e.skillName))];
    return skills.reduce((acc, skill) => {
      acc[skill] = this.getSkillStats(skill);
      return acc;
    }, {} as Record<string, any>);
  }

  clearEvents(skillName?: string): void {
    if (skillName) {
      this.events = this.events.filter(e => e.skillName !== skillName);
    } else {
      this.events = [];
    }
  }

  // Factory method for default configurations
  static createDefaultConfig(): ActivityConfig {
    return {
      timeWindows: [5 * 60 * 1000, 30 * 60 * 1000, 2 * 60 * 60 * 1000],
      decayFunction: 'exponential',
      maxEvents: 1000,
      weights: {
        recentSuccess: 0.3,
        recentFailure: -0.2,
        frequency: 0.25,
        consistency: 0.25
      }
    };
  }

  static createAggressiveConfig(): ActivityConfig {
    return {
      timeWindows: [2 * 60 * 1000, 10 * 60 * 1000, 60 * 60 * 1000],
      decayFunction: 'exponential',
      maxEvents: 500,
      weights: {
        recentSuccess: 0.4,
        recentFailure: -0.3,
        frequency: 0.35,
        consistency: 0.15
      }
    };
  }

  static createConservativeConfig(): ActivityConfig {
    return {
      timeWindows: [15 * 60 * 1000, 60 * 60 * 1000, 4 * 60 * 60 * 1000],
      decayFunction: 'linear',
      maxEvents: 2000,
      weights: {
        recentSuccess: 0.25,
        recentFailure: -0.15,
        frequency: 0.2,
        consistency: 0.35
      }
    };
  }

  // Export/import for persistence
  exportEvents(): ActivityEvent[] {
    return [...this.events];
  }

  importEvents(events: ActivityEvent[]): void {
    this.events = [...events].sort((a, b) => a.timestamp - b.timestamp);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  // Debug information
  getDebugInfo(skillName: string): {
    events: ActivityEvent[];
    config: ActivityConfig;
    stats: any;
  } {
    return {
      events: this.getRecentEvents(skillName, Date.now()),
      config: this.config,
      stats: this.getSkillStats(skillName)
    };
  }
}