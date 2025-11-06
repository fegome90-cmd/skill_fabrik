/**
 * ComplexityDetector
 *
 * Analyzes conversation/solution complexity using multi-signal matching:
 * - Conversation depth (30%)
 * - Decisions evaluated (25%)
 * - Change impact (25%)
 * - Architectural keywords (20%)
 *
 * Threshold: 0.7 (configurable)
 */

import { z } from 'zod';

export interface ComplexityInput {
  conversation: string[];
  solution: string;
  context?: {
    domain?: string;
    complexity?: number;
    stakeholders?: string[];
  };
}

export interface ComplexityScore {
  score: number;
  breakdown: {
    conversation_depth: number;
    decisions_evaluated: number;
    change_impact: number;
    architectural_keywords: number;
  };
  reasoning: string[];
  threshold: number;
  passed: boolean;
  processing_time: number;
}

const ARCHITECTURAL_KEYWORDS = [
  'architecture', 'pattern', 'design', 'microservice', 'api', 'database',
  'integration', 'layer', 'tier', 'component', 'module', 'service',
  'scalability', 'performance', 'security', 'deployment', 'infrastructure',
  'decision', 'adr', 'architecture decision record', 'trade-off', 'constraint',
  'requirement', 'stakeholder', 'impact', 'consequence', 'risk', 'mitigation',
  'authentication', 'authorization', 'validation', 'persistence', 'cache',
  'queue', 'message', 'event', 'stream', 'replication', 'sharding', 'partition',
  'load balancer', 'gateway', 'proxy', 'orchestration', 'choreography',
  'monolith', 'modular', 'coupling', 'cohesion', 'abstraction', 'encapsulation'
];

const HIGH_IMPACT_INDICATORS = [
  'breaking change', 'migration', 'refactor', 'restructure', 'reorganize',
  'replace', 'deprecate', 'upgrade', 'major version', 'backward incompatible',
  'affects all', 'global', 'cross-cutting', 'affects multiple',
  'database schema', 'api contract', 'data model', 'business logic',
  'user authentication', 'payment processing', 'security model'
];

export class ComplexityDetector {
  private threshold: number = 0.7;
  private maxConversationLength: number = 50;

  /**
   * Detect if a conversation/solution is complex enough for ADR generation
   */
  async detectComplexity(
    conversation: string[],
    solution: string,
    context?: ComplexityInput['context']
  ): Promise<ComplexityScore> {
    const startTime = Date.now();

    // Signal 1: Conversation depth (30%)
    const conversationDepth = this.analyzeConversationDepth(conversation);

    // Signal 2: Decisions evaluated (25%)
    const decisionsEvaluated = this.analyzeDecisionsEvaluated(conversation, solution);

    // Signal 3: Change impact (25%)
    const changeImpact = this.analyzeChangeImpact(solution, context);

    // Signal 4: Architectural keywords (20%)
    const architecturalKeywords = this.analyzeArchitecturalKeywords(conversation, solution);

    // Calculate weighted score
    const score = (
      conversationDepth * 0.30 +
      decisionsEvaluated * 0.25 +
      changeImpact * 0.25 +
      architecturalKeywords * 0.20
    );

    const processingTime = Date.now() - startTime;

    const breakdown = {
      conversation_depth: conversationDepth,
      decisions_evaluated: decisionsEvaluated,
      change_impact: changeImpact,
      architectural_keywords: architecturalKeywords
    };

    const reasoning = this.generateReasoning(breakdown, score);

    return {
      score: Math.round(score * 1000) / 1000,
      breakdown,
      reasoning,
      threshold: this.threshold,
      passed: score >= this.threshold,
      processing_time: processingTime
    };
  }

  /**
   * Analyze conversation depth
   * Looks at: length, back-and-forth exchanges, depth of discussion
   */
  private analyzeConversationDepth(conversation: string[]): number {
    if (conversation.length === 0) return 0;

    // Factor 1: Length (normalized)
    const lengthFactor = Math.min(conversation.length / this.maxConversationLength, 1);

    // Factor 2: Unique contributors (simple heuristic)
    const uniqueTerms = new Set(conversation.map(msg =>
      msg.toLowerCase().split(' ').slice(0, 5).join(' ')
    ));
    const varietyFactor = Math.min(uniqueTerms.size / 10, 1);

    // Factor 3: Long messages (indicating detailed discussion)
    const avgMessageLength = conversation.reduce((sum, msg) => sum + msg.length, 0) / conversation.length;
    const longMessageFactor = Math.min(avgMessageLength / 200, 1);

    // Combine factors
    const depth = (lengthFactor * 0.4 + varietyFactor * 0.3 + longMessageFactor * 0.3);

    return Math.round(depth * 100) / 100;
  }

  /**
   * Analyze decisions that were evaluated
   * Looks for: alternatives considered, trade-offs, pros/cons
   */
  private analyzeDecisionsEvaluated(conversation: string[], solution: string): number {
    const allText = [...conversation, solution].join(' ').toLowerCase();

    // Decision indicators
    const decisionIndicators = [
      'decide', 'decision', 'choose', 'option', 'alternative', 'trade-off',
      'pro', 'con', 'advantage', 'disadvantage', 'benefit', 'drawback',
      'vs', 'versus', 'compare', 'evaluation', 'consider', 'assess',
      'pros and cons', 'pros/cons', 'better to', 'instead of'
    ];

    const decisionCount = decisionIndicators.reduce((count, indicator) => {
      return count + (allText.match(new RegExp(indicator, 'g')) || []).length;
    }, 0);

    // Normalize to 0-1 scale
    const normalizedScore = Math.min(decisionCount / 10, 1);

    return Math.round(normalizedScore * 100) / 100;
  }

  /**
   * Analyze change impact
   * Looks for: scope indicators, breaking changes, affected components
   */
  private analyzeChangeImpact(solution: string, context?: ComplexityInput['context']): number {
    const text = solution.toLowerCase();

    // Factor 1: High impact indicators
    let impactScore = 0;
    for (const indicator of HIGH_IMPACT_INDICATORS) {
      if (text.includes(indicator)) {
        impactScore += 0.1;
      }
    }

    // Factor 2: Multiple components mentioned
    const components = [
      'api', 'service', 'database', 'cache', 'queue', 'auth', 'user',
      'payment', 'order', 'product', 'inventory', 'notification'
    ];

    const componentsMentioned = components.filter(comp => text.includes(comp)).length;
    impactScore += (componentsMentioned / components.length) * 0.3;

    // Factor 3: Context from user
    if (context?.complexity) {
      impactScore += (context.complexity / 10) * 0.2;
    }

    // Normalize
    return Math.round(Math.min(impactScore, 1) * 100) / 100;
  }

  /**
   * Analyze presence of architectural keywords
   */
  private analyzeArchitecturalKeywords(conversation: string[], solution: string): number {
    const allText = [...conversation, solution].join(' ').toLowerCase();

    let keywordMatches = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of ARCHITECTURAL_KEYWORDS) {
      if (allText.includes(keyword)) {
        keywordMatches++;
        matchedKeywords.push(keyword);
      }
    }

    // Normalize: More keywords = higher complexity, but with diminishing returns
    const normalizedScore = Math.min(keywordMatches / 15, 1);

    return Math.round(normalizedScore * 100) / 100;
  }

  /**
   * Generate reasoning for the score
   */
  private generateReasoning(breakdown: ComplexityScore['breakdown'], score: number): string[] {
    const reasoning: string[] = [];

    if (breakdown.conversation_depth > 0.6) {
      reasoning.push(`High conversation depth (${breakdown.conversation_depth})`);
    } else if (breakdown.conversation_depth < 0.3) {
      reasoning.push(`Low conversation depth (${breakdown.conversation_depth})`);
    }

    if (breakdown.decisions_evaluated > 0.6) {
      reasoning.push(`Multiple decisions evaluated (${breakdown.decisions_evaluated})`);
    }

    if (breakdown.change_impact > 0.6) {
      reasoning.push(`High change impact detected (${breakdown.change_impact})`);
    }

    if (breakdown.architectural_keywords > 0.6) {
      reasoning.push(`Rich architectural vocabulary (${breakdown.architectural_keywords})`);
    }

    if (score >= this.threshold) {
      reasoning.push(`✅ Passes complexity threshold (${score} >= ${this.threshold})`);
    } else {
      reasoning.push(`❌ Below complexity threshold (${score} < ${this.threshold})`);
    }

    return reasoning;
  }

  /**
   * Set complexity threshold
   */
  setThreshold(threshold: number): void {
    this.threshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Get current threshold
   */
  getThreshold(): number {
    return this.threshold;
  }
}
