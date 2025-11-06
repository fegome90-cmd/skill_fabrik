import { type ScoreInput, type Signal } from '../types.js';

export interface IntentPattern {
  pattern: RegExp;
  intent: string;
  weight: number;
  examples: string[];
}

export class IntentMatchSignal implements Signal {
  name = 'intentMatch';
  private readonly patterns: IntentPattern[];
  private readonly cache: Map<string, number> = new Map();
  private readonly maxCacheSize: number;

  constructor(patterns: IntentPattern[], options?: { maxCacheSize?: number }) {
    this.patterns = patterns.sort((a, b) => b.weight - a.weight);
    this.maxCacheSize = options?.maxCacheSize || 1000;
  }

  async score({ prompt, skillName }: ScoreInput): Promise<number> {
    const cacheKey = `${skillName}:${prompt}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let totalScore = 0;
    let matchCount = 0;

    // Test each pattern
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(prompt)) {
        totalScore += pattern.weight;
        matchCount++;

        // Early termination for high-weight matches
        if (pattern.weight >= 0.8) {
          break;
        }
      }
    }

    // Normalize score based on patterns tested
    const finalScore = matchCount > 0 ? Math.min(totalScore / matchCount, 1) : 0;

    // Update cache with LRU eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(cacheKey, finalScore);

    return finalScore;
  }

  // Factory method for common intent patterns
  static createCommonPatterns(): IntentPattern[] {
    return [
      {
        pattern: /(?:create|implement|build|add|develop)\s+(?:new\s+)?(?:feature|function|component|module|service)/i,
        intent: 'create_feature',
        weight: 0.9,
        examples: ['create new feature', 'implement component', 'build service']
      },
      {
        pattern: /(?:fix|resolve|debug|repair)\s+(?:bug|issue|error|problem)/i,
        intent: 'fix_bug',
        weight: 0.85,
        examples: ['fix bug', 'resolve issue', 'debug error']
      },
      {
        pattern: /(?:refactor|improve|optimize|enhance)\s+(?:code|performance|structure)/i,
        intent: 'refactor_code',
        weight: 0.8,
        examples: ['refactor code', 'improve performance', 'optimize structure']
      },
      {
        pattern: /(?:test|validate|verify|check)\s+(?:functionality|feature|code)/i,
        intent: 'test_code',
        weight: 0.75,
        examples: ['test functionality', 'validate feature', 'verify code']
      },
      {
        pattern: /(?:document|add\s+docs|write\s+documentation)/i,
        intent: 'document_code',
        weight: 0.7,
        examples: ['document code', 'add docs', 'write documentation']
      },
      {
        pattern: /(?:deploy|release|publish|ship)\s+(?:application|feature|code)/i,
        intent: 'deploy_code',
        weight: 0.8,
        examples: ['deploy application', 'release feature', 'publish code']
      },
      {
        pattern: /(?:analyze|review|audit|inspect)\s+(?:code|performance|security)/i,
        intent: 'analyze_code',
        weight: 0.75,
        examples: ['analyze code', 'review performance', 'audit security']
      },
      {
        pattern: /(?:configure|setup|install|integrate)\s+(?:system|tool|service)/i,
        intent: 'configure_system',
        weight: 0.7,
        examples: ['configure system', 'setup tool', 'install service']
      }
    ];
  }

  // Create skill-specific patterns based on common use cases
  static createSkillPatterns(skillName: string): IntentPattern[] {
    const basePatterns = this.createCommonPatterns();

    // Add skill-specific patterns
    switch (skillName.toLowerCase()) {
      case 'backend-dev-guidelines':
        return [
          ...basePatterns,
          {
            pattern: /(?:api|endpoint|service|microservice)\s+(?:design|create|implement)/i,
            intent: 'api_design',
            weight: 0.95,
            examples: ['design API', 'create endpoint', 'implement service']
          },
          {
            pattern: /(?:database|db)\s+(?:schema|model|query|migration)/i,
            intent: 'database_design',
            weight: 0.9,
            examples: ['design database', 'create schema', 'write migration']
          }
        ];

      case 'frontend-dev-guidelines':
        return [
          ...basePatterns,
          {
            pattern: /(?:component|ui|interface)\s+(?:design|create|build)/i,
            intent: 'ui_component',
            weight: 0.95,
            examples: ['design component', 'create UI', 'build interface']
          },
          {
            pattern: /(?:responsive|mobile|accessibility)\s+(?:design|implementation)/i,
            intent: 'responsive_design',
            weight: 0.85,
            examples: ['responsive design', 'mobile implementation', 'accessibility features']
          }
        ];

      default:
        return basePatterns;
    }
  }

  // Clear cache (useful for testing or memory management)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }
}