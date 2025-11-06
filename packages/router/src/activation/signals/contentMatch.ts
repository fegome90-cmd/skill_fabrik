import { type ScoreInput, type Signal } from '../types.js';

export interface ContentPattern {
  pattern: RegExp;
  weight: number;
  description: string;
  category: 'import' | 'function' | 'class' | 'config' | 'test' | 'api' | 'database' | 'style' | 'other';
  examples: string[];
}

export interface ContentAnalysisOptions {
  maxFileSize?: number; // bytes
  includeBinary?: boolean;
  cacheSize?: number;
  scanDepth?: number; // max lines to scan
}

export class ContentMatchSignal implements Signal {
  name = 'contentMatch';
  private readonly patterns: ContentPattern[];
  private readonly options: Required<ContentAnalysisOptions>;
  private readonly cache: Map<string, number> = new Map();

  constructor(patterns: ContentPattern[], options?: ContentAnalysisOptions) {
    this.patterns = patterns.sort((a, b) => b.weight - a.weight);
    this.options = {
      maxFileSize: options?.maxFileSize || 1024 * 1024, // 1MB
      includeBinary: options?.includeBinary || false,
      cacheSize: options?.cacheSize || 200,
      scanDepth: options?.scanDepth || 1000
    };
  }

  async score({ context, skillName }: ScoreInput): Promise<number> {
    const currentFile = context?.currentFile;
    const openFiles = context?.openFiles || [];
    const fileContent = context?.fileContent;

    // Use provided content first, otherwise try to read current file
    const contentToAnalyze = fileContent || (currentFile ? await this.tryReadFile(currentFile) : null);

    if (!contentToAnalyze) {
      return 0;
    }

    const cacheKey = `${skillName}:${currentFile || 'content'}:${this.hashContent(contentToAnalyze)}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const analysis = this.analyzeContent(contentToAnalyze, currentFile);
    const finalScore = this.calculateScore(analysis, skillName);

    // Update cache with LRU eviction
    if (this.cache.size >= this.options.cacheSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(cacheKey, finalScore);

    return finalScore;
  }

  private analyzeContent(content: string, filePath?: string): Record<string, number> {
    const analysis: Record<string, number> = {};
    const lines = content.split('\n').slice(0, this.options.scanDepth);
    const contentText = lines.join('\n');

    // Analyze each pattern
    for (const pattern of this.patterns) {
      const matches = contentText.match(pattern.pattern);
      if (matches) {
        const category = pattern.category;
        analysis[category] = (analysis[category] || 0) + (matches.length * pattern.weight);
      }
    }

    // Additional analysis based on file type
    if (filePath) {
      const fileTypeAnalysis = this.analyzeFileType(content, filePath);
      Object.assign(analysis, fileTypeAnalysis);
    }

    return analysis;
  }

  private calculateScore(analysis: Record<string, number>, skillName: string): number {
    if (Object.keys(analysis).length === 0) {
      return 0;
    }

    // Skill-specific scoring logic
    switch (skillName.toLowerCase()) {
      case 'backend-dev-guidelines':
        return this.calculateBackendScore(analysis);
      case 'frontend-dev-guidelines':
        return this.calculateFrontendScore(analysis);
      case 'database-verification':
        return this.calculateDatabaseScore(analysis);
      default:
        return this.calculateGenericScore(analysis);
    }
  }

  private calculateBackendScore(analysis: Record<string, number>): number {
    const weights = {
      api: 0.3,
      database: 0.25,
      function: 0.2,
      class: 0.15,
      config: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(weights)) {
      if (analysis[category]) {
        totalScore += analysis[category] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.min(totalScore / totalWeight, 1) : 0;
  }

  private calculateFrontendScore(analysis: Record<string, number>): number {
    const weights = {
      style: 0.25,
      function: 0.25,
      class: 0.2,
      import: 0.15,
      config: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(weights)) {
      if (analysis[category]) {
        totalScore += analysis[category] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.min(totalScore / totalWeight, 1) : 0;
  }

  private calculateDatabaseScore(analysis: Record<string, number>): number {
    const weights = {
      database: 0.5,
      config: 0.3,
      function: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(weights)) {
      if (analysis[category]) {
        totalScore += analysis[category] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.min(totalScore / totalWeight, 1) : 0;
  }

  private calculateGenericScore(analysis: Record<string, number>): number {
    // Simple average of all categories
    const values = Object.values(analysis);
    return values.length > 0 ? Math.min(values.reduce((a, b) => a + b, 0) / values.length, 1) : 0;
  }

  private analyzeFileType(content: string, filePath: string): Record<string, number> {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const analysis: Record<string, number> = {};

    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        analysis.import = (content.match(/import\s+.*\s+from\s+['"][^'"]+['"]/g) || []).length * 0.1;
        analysis.function = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length * 0.1;
        analysis.class = (content.match(/class\s+\w+/g) || []).length * 0.15;
        break;

      case 'py':
        analysis.import = (content.match(/import\s+\w+|from\s+\w+\s+import/g) || []).length * 0.1;
        analysis.function = (content.match(/def\s+\w+/g) || []).length * 0.1;
        analysis.class = (content.match(/class\s+\w+/g) || []).length * 0.15;
        break;

      case 'java':
        analysis.import = (content.match(/import\s+[\w.]+;/g) || []).length * 0.1;
        analysis.class = (content.match(/public\s+class\s+\w+/g) || []).length * 0.2;
        analysis.function = (content.match(/public\s+\w+\s+\w+\s*\([^)]*\)/g) || []).length * 0.1;
        break;

      case 'sql':
        analysis.database = (content.match(/\b(CREATE|ALTER|DROP|SELECT|INSERT|UPDATE|DELETE)\b/gi) || []).length * 0.2;
        break;

      case 'css':
      case 'scss':
      case 'sass':
        analysis.style = (content.match(/\.[\w-]+\s*\{|#[\w-]+\s*\{|@[\w-]+\s*\{/g) || []).length * 0.1;
        break;

      case 'json':
        analysis.config = content.includes('"dependencies"') || content.includes('"scripts"') ? 0.5 : 0.3;
        break;

      case 'yaml':
      case 'yml':
        analysis.config = content.includes('dependencies:') || content.includes('scripts:') ? 0.5 : 0.3;
        break;
    }

    return analysis;
  }

  private async tryReadFile(filePath: string): Promise<string | null> {
    try {
      // This would need to be implemented with actual file system access
      // For now, return null to indicate file couldn't be read
      return null;
    } catch {
      return null;
    }
  }

  private hashContent(content: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Factory method for common content patterns
  static createCommonPatterns(): ContentPattern[] {
    return [
      // Import patterns
      {
        pattern: /import\s+.*\s+from\s+['"][^'"]+['"]/g,
        weight: 0.1,
        description: 'ES6 imports',
        category: 'import',
        examples: ['import React from "react"', 'import { useState } from "react"']
      },
      {
        pattern: /require\s*\(['"][^'"]+['"]\)/g,
        weight: 0.1,
        description: 'CommonJS requires',
        category: 'import',
        examples: ['require("fs")', 'const express = require("express")']
      },

      // Function patterns
      {
        pattern: /function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|def\s+\w+/g,
        weight: 0.1,
        description: 'Function definitions',
        category: 'function',
        examples: ['function test()', 'const test = () => {}', 'def test():']
      },

      // Class patterns
      {
        pattern: /class\s+\w+|interface\s+\w+|type\s+\w+/g,
        weight: 0.15,
        description: 'Class/interface/type definitions',
        category: 'class',
        examples: ['class Test', 'interface Test', 'type Test']
      },

      // Configuration patterns
      {
        pattern: /\b(config|configuration|settings|options)\b/gi,
        weight: 0.2,
        description: 'Configuration keywords',
        category: 'config',
        examples: ['config', 'configuration', 'settings']
      },

      // Test patterns
      {
        pattern: /\b(test|spec|describe|it|expect|assert)\b/gi,
        weight: 0.2,
        description: 'Test-related keywords',
        category: 'test',
        examples: ['test', 'describe', 'it()', 'expect()']
      },

      // API patterns
      {
        pattern: /\b(api|endpoint|route|controller|service)\b/gi,
        weight: 0.2,
        description: 'API-related keywords',
        category: 'api',
        examples: ['api', 'endpoint', 'route', 'controller']
      },

      // Database patterns
      {
        pattern: /\b(database|db|sql|query|migration|schema|model)\b/gi,
        weight: 0.2,
        description: 'Database-related keywords',
        category: 'database',
        examples: ['database', 'sql', 'query', 'migration']
      },

      // Style patterns
      {
        pattern: /\b(style|css|scss|theme|design|ui)\b/gi,
        weight: 0.15,
        description: 'Style/UI-related keywords',
        category: 'style',
        examples: ['style', 'css', 'theme', 'design']
      }
    ];
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.options.cacheSize
    };
  }

  // Add new pattern dynamically
  addPattern(pattern: ContentPattern): void {
    this.patterns.push(pattern);
    // Re-sort by weight
    this.patterns.sort((a, b) => b.weight - a.weight);
    // Clear cache since patterns changed
    this.clearCache();
  }

  // Remove pattern by description
  removePattern(description: string): boolean {
    const index = this.patterns.findIndex(p => p.description === description);
    if (index !== -1) {
      this.patterns.splice(index, 1);
      this.clearCache();
      return true;
    }
    return false;
  }
}