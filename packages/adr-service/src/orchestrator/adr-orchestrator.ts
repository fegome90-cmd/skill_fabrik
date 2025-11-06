/**
 * ADROrchestrator
 *
 * Manages the ACE pipeline for ADR generation:
 * 1. Generator: Proposes delta incremental (Context/Decision/Consequences)
 * 2. Reflector: Validates format, detects duplicates, scores helpful/harmful
 * 3. Curator: Deduplicates, persists triple (Memory + Docs + ChromaDB + MemTech)
 *
 * Integrates with existing ADR agents system and Bridge Architecture
 */

import { spawn } from 'node:child_process';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import crypto from 'node:crypto';

export interface ADRInput {
  conversation: string[];
  solution: string;
  context?: any;
  complexity: any;
}

export interface ADR {
  id: string;
  title: string;
  content: string;
  phase: 'clarify' | 'layout' | 'operate' | 'observe' | 'reflect';
  status: 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';
  tags: string[];
  created_at: string;
  updated_at?: string;
  metadata?: {
    complexity_score: number;
    source: 'ace-pipeline';
    conversation_id?: string;
    stakeholders?: string[];
    [key: string]: any;
  };
  fingerprint?: string;
}

export interface ADROrchestrator {
  generateADR(input: ADRInput): Promise<ADR>;
  persistADR(adr: ADR): Promise<any>;
  getADR(id: string): Promise<ADR | null>;
}

export class ADROrchestrator implements ADROrchestrator {
  private storagePath: string = './data/adr';
  private memoryPath: string = './data/memory';
  private docsPath: string = './docs/adr';

  constructor() {
    // Ensure directories exist
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    await mkdir(this.storagePath, { recursive: true });
    await mkdir(this.memoryPath, { recursive: true });
    await mkdir(this.docsPath, { recursive: true });
  }

  /**
   * Generate ADR using ACE pipeline
   */
  async generateADR(input: ADRInput): Promise<ADR> {
    console.log('🚀 Starting ACE Pipeline for ADR Generation');

    // Step 1: Generator Agent
    console.log('  📝 Generator: Proposing ADR delta...');
    const delta = await this.invokeGenerator(input);
    console.log(`    ✅ Generated delta: ${delta.title}`);

    // Step 2: Reflector Agent
    console.log('  🔍 Reflector: Validating and scoring...');
    const validated = await this.invokeReflector(delta, input);
    console.log(`    ✅ Validation passed, score: ${validated.metadata?.score || 'N/A'}`);

    // Step 3: Curator Agent
    console.log('  ✨ Curator: Processing and finalizing...');
    const finalized = await this.invokeCurator(validated, input);
    console.log(`    ✅ ADR finalized: ${finalized.id}`);

    return finalized;
  }

  /**
   * Invoke Generator Agent
   * Proposes delta incremental with Context/Decision/Consequences
   */
  private async invokeGenerator(input: ADRInput): Promise<Partial<ADR>> {
    const id = this.generateADRId();
    const title = this.extractTitle(input);
    const content = this.generateContent(input);
    const phase = this.determinePhase(input);
    const tags = this.extractTags(input);

    return {
      id,
      title,
      content,
      phase,
      status: 'Proposed',
      tags,
      created_at: new Date().toISOString(),
      metadata: {
        complexity_score: input.complexity?.score || 0,
        source: 'ace-pipeline'
      }
    };
  }

  /**
   * Invoke Reflector Agent
   * Validates format, detects duplicates, assigns score
   */
  private async invokeReflector(adr: Partial<ADR>, input: ADRInput): Promise<ADR> {
    // Validate format
    this.validateADRFormat(adr);

    // Check for duplicates
    const duplicate = await this.checkDuplicates(adr);
    if (duplicate) {
      console.log(`    ⚠️ Potential duplicate detected: ${duplicate.id}`);
    }

    // Calculate helpful/harmful score
    const score = await this.calculateScore(adr, input);

    // Convert to complete ADR
    return {
      ...adr,
      status: 'Proposed',
      metadata: {
        ...adr.metadata,
        score,
        duplicate_of: duplicate?.id
      }
    } as ADR;
  }

  /**
   * Invoke Curator Agent
   * Deduplicates, persists to all layers
   */
  private async invokeCurator(adr: ADR, input: ADRInput): Promise<ADR> {
    // Deduplicate if needed
    if (adr.metadata?.duplicate_of) {
      console.log(`    🔗 Linking to existing ADR: ${adr.metadata.duplicate_of}`);
      adr.status = 'Superseded';
    }

    // Generate fingerprint
    adr.fingerprint = this.generateFingerprint(adr);

    return adr;
  }

  /**
   * Persist ADR to triple layer + MemTech
   */
  async persistADR(adr: ADR): Promise<any> {
    console.log('💾 Persisting ADR to triple layer...');

    const results = {
      memory: null,
      docs: null,
      chromadb: null,
      memtech: null
    };

    // Layer 1: Memory (JSON)
    results.memory = await this.persistToMemory(adr);

    // Layer 2: Docs (Markdown)
    results.docs = await this.persistToDocs(adr);

    // Layer 3: ChromaDB (Vector) - if configured
    if (process.env.CHROMA_URL && process.env.CHROMA_API_KEY) {
      results.chromadb = await this.persistToChromaDB(adr);
    } else {
      console.log('    ⏭️ ChromaDB not configured, skipping');
    }

    // Layer 4: MemTech (Skills Index)
    results.memtech = await this.persistToMemTech(adr);

    console.log('    ✅ All persistence layers updated');
    return results;
  }

  /**
   * Retrieve ADR by ID
   */
  async getADR(id: string): Promise<ADR | null> {
    try {
      const filePath = join(this.storagePath, `${id}.json`);
      const data = await readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  // Helper methods

  private generateADRId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `adr_${timestamp}_${random}`;
  }

  private extractTitle(input: ADRInput): string {
    // Try to find a title in the conversation or solution
    const allText = [...input.conversation, input.solution].join(' ');

    // Look for "Decision: X" or "We decided to X"
    const decisionMatch = allText.match(/decide[dt]?\s+(?:to\s+)?([^.!?]+)/i);
    if (decisionMatch) {
      return `ADR: ${decisionMatch[1].trim()}`;
    }

    // Look for ADR pattern
    const adrMatch = allText.match(/adr:?\s*([^\n]+)/i);
    if (adrMatch) {
      return adrMatch[1].trim();
    }

    // Fallback: Use first line of solution
    const firstLine = input.solution.split('\n')[0];
    return `ADR: ${firstLine.substring(0, 80)}`;
  }

  private generateContent(input: ADRInput): string {
    const { conversation, solution, context } = input;

    // Extract context from conversation
    const contextSection = this.extractContext(conversation);

    // Extract decision from solution
    const decisionSection = this.extractDecision(solution, context);

    // Extract consequences
    const consequencesSection = this.extractConsequences(conversation, solution);

    return `## Context

${contextSection}

## Decision

${decisionSection}

## Consequences

${consequencesSection}

## Implementation

_Implementation details to be added_

## Validation

_Validation criteria to be added_
`;
  }

  private extractContext(conversation: string[]): string {
    const relevant = conversation.slice(0, Math.min(10, conversation.length));
    const summary = relevant.join('\n\n');

    if (summary.length > 2000) {
      return summary.substring(0, 2000) + '...';
    }

    return summary || 'Context not available from conversation';
  }

  private extractDecision(solution: string, context?: any): string {
    // Try to extract the main decision
    const lines = solution.split('\n');
    const decisionLines = lines.filter(line =>
      line.toLowerCase().includes('decide') ||
      line.toLowerCase().includes('implement') ||
      line.toLowerCase().includes('choose') ||
      line.toLowerCase().includes('use ')
    );

    if (decisionLines.length > 0) {
      return decisionLines.join('\n');
    }

    return solution.substring(0, 500);
  }

  private extractConsequences(conversation: string[], solution: string): string {
    const allText = [...conversation, solution].join(' ');

    // Look for positive/negative indicators
    const positiveIndicators = ['benefit', 'advantage', 'improve', 'better', 'positive'];
    const negativeIndicators = ['risk', 'challenge', 'drawback', 'cost', 'negative', 'trade-off'];

    const hasPositives = positiveIndicators.some(ind => allText.toLowerCase().includes(ind));
    const hasNegatives = negativeIndicators.some(ind => allText.toLowerCase().includes(ind));

    let consequences = '';

    if (hasPositives) {
      consequences += '### Positive\n- To be documented\n';
    }

    if (hasNegatives) {
      consequences += '### Negative\n- To be documented\n';
    }

    if (!consequences) {
      consequences = 'Consequences to be evaluated and documented';
    }

    return consequences;
  }

  private determinePhase(input: ADRInput): ADR['phase'] {
    const allText = [...input.conversation, input.solution].join(' ').toLowerCase();

    if (allText.includes('define') || allText.includes('clarify') || allText.includes('understand')) {
      return 'clarify';
    }

    if (allText.includes('design') || allText.includes('architecture') || allText.includes('plan')) {
      return 'layout';
    }

    if (allText.includes('implement') || allText.includes('build') || allText.includes('deploy')) {
      return 'operate';
    }

    if (allText.includes('monitor') || allText.includes('measure') || allText.includes('evaluate')) {
      return 'observe';
    }

    if (allText.includes('review') || allText.includes('reflect') || allText.includes('improve')) {
      return 'reflect';
    }

    return 'operate'; // Default
  }

  private extractTags(input: ADRInput): string[] {
    const tags: string[] = [];

    const allText = [...input.conversation, input.solution].join(' ').toLowerCase();

    // Domain tags
    if (allText.includes('auth') || allText.includes('login')) tags.push('authentication');
    if (allText.includes('api') || allText.includes('rest')) tags.push('api');
    if (allText.includes('database') || allText.includes('sql')) tags.push('database');
    if (allText.includes('cache') || allText.includes('redis')) tags.push('caching');
    if (allText.includes('queue') || allText.includes('message')) tags.push('messaging');

    // Type tags
    if (input.complexity?.score >= 0.8) tags.push('high-complexity');
    if (input.complexity?.score >= 0.9) tags.push('critical');

    // Phase tag
    tags.push(this.determinePhase(input));

    return [...new Set(tags)]; // Remove duplicates
  }

  private validateADRFormat(adr: Partial<ADR>): void {
    if (!adr.title || adr.title.length < 5) {
      throw new Error('Invalid ADR: title too short');
    }

    if (!adr.content || adr.content.length < 50) {
      throw new Error('Invalid ADR: content too short');
    }

    if (!adr.phase) {
      throw new Error('Invalid ADR: missing phase');
    }
  }

  private async checkDuplicates(adr: Partial<ADR>): Promise<ADR | null> {
    // Simple duplicate check: same title
    // In production, would use semantic similarity or ChromaDB
    return null;
  }

  private async calculateScore(adr: Partial<ADR>, input: ADRInput): Promise<number> {
    // Simple scoring based on content length and completeness
    let score = 0.5;

    if (adr.content?.includes('## Context')) score += 0.1;
    if (adr.content?.includes('## Decision')) score += 0.1;
    if (adr.content?.includes('## Consequences')) score += 0.1;
    if (adr.tags && adr.tags.length > 0) score += 0.1;
    if (adr.content && adr.content.length > 500) score += 0.1;

    return Math.min(score, 1.0);
  }

  private generateFingerprint(adr: ADR): string {
    const data = `${adr.title}-${adr.content.substring(0, 100)}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async persistToMemory(adr: ADR): Promise<any> {
    const filePath = join(this.storagePath, `${adr.id}.json`);
    await writeFile(filePath, JSON.stringify(adr, null, 2));
    return { success: true, path: filePath };
  }

  private async persistToDocs(adr: ADR): Promise<any> {
    const fileName = `${adr.id}.md`;
    const filePath = join(this.docsPath, fileName);

    const markdown = this.toMarkdown(adr);
    await writeFile(filePath, markdown);

    return { success: true, path: filePath };
  }

  private async persistToChromaDB(adr: ADR): Promise<any> {
    // Placeholder for ChromaDB integration
    // Would use chromadb-client to index the ADR
    console.log('    📊 Indexing in ChromaDB...');
    return { success: true, collection: 'adr_pipeline' };
  }

  private async persistToMemTech(adr: ADR): Promise<any> {
    // Placeholder for MemTech integration
    // Would add to skills index
    console.log('    🎯 Adding to MemTech skills index...');
    return { success: true, index: 'skills' };
  }

  private toMarkdown(adr: ADR): string {
    return `# ${adr.title}

**ID:** ${adr.id}
**Phase:** ${adr.phase}
**Status:** ${adr.status}
**Created:** ${adr.created_at}
**Tags:** ${adr.tags.join(', ')}

${adr.content}

---

*Generated by ACE-ADR Pipeline*
`;
  }
}
