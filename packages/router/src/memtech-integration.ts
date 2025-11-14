/**
 * MemTech Integration Module for Skills Fabric
 * Integrates MemTech Universal API client with Skills Fabric components
 */

import { execa } from 'execa';
import { resolve } from 'path';

interface MemTechMemory {
  content: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface MemTechSearchResult {
  memories: Array<{
    memory_id: string;
    content: string;
    tags: string[];
    created_at: string;
  }>;
  total: number;
}

/**
 * MemTech Client wrapper for Skills Fabric
 * Uses Python client script for API calls
 */
export class MemTechIntegration {
  private baseUrl: string;
  private apiKey: string | null = null;
  private clientScript: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.clientScript = resolve(process.cwd(), 'scripts', 'memtech-client.py');
  }

  /**
   * Check if MemTech server is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execa('curl', ['-s', `${this.baseUrl}/health`], {
        timeout: 2000,
        reject: false,
      });
      return !stdout.includes('Internal Server Error') && !stdout.includes('Connection refused');
    } catch {
      return false;
    }
  }

  /**
   * Authenticate and get API key
   */
  async authenticate(): Promise<string | null> {
    if (this.apiKey) {
      return this.apiKey;
    }

    try {
      // Try to get API key from environment
      const envKey = process.env.MEMTECH_API_KEY;
      if (envKey) {
        this.apiKey = envKey;
        return envKey;
      }

      // Use Python client to authenticate
      const { stdout } = await execa('python3', [this.clientScript], {
        timeout: 5000,
        reject: false,
      });

      // Extract API key from output if available
      const keyMatch = stdout.match(/API Key: ([^\s]+)/);
      if (keyMatch) {
        this.apiKey = keyMatch[1];
        return this.apiKey;
      }

      return null;
    } catch (error) {
      console.warn('MemTech authentication failed:', error);
      return null;
    }
  }

  /**
   * Store memory in MemTech
   */
  async storeMemory(memory: MemTechMemory): Promise<{ success: boolean; memory_id?: string; error?: string }> {
    if (!(await this.isAvailable())) {
      return { success: false, error: 'MemTech server not available' };
    }

    await this.authenticate();

    try {
      const payload = JSON.stringify({
        content: memory.content,
        tags: memory.tags || [],
        metadata: memory.metadata || {},
      });

      const { stdout } = await execa(
        'curl',
        [
          '-s',
          '-X',
          'POST',
          `${this.baseUrl}/api/v1/memory`,
          '-H',
          `Authorization: Bearer ${this.apiKey}`,
          '-H',
          'Content-Type: application/json',
          '-d',
          payload,
        ],
        {
          timeout: 5000,
          reject: false,
        }
      );

      const result = JSON.parse(stdout);
      if (result.memory_id) {
        return { success: true, memory_id: result.memory_id };
      } else {
        return { success: false, error: result.detail || 'Unknown error' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Search memories in MemTech
   */
  async searchMemories(query?: string, tags?: string[], limit: number = 10): Promise<MemTechSearchResult> {
    if (!(await this.isAvailable())) {
      return { memories: [], total: 0 };
    }

    await this.authenticate();

    try {
      const params: string[] = [`limit=${limit}`];
      if (query) params.push(`query=${encodeURIComponent(query)}`);
      if (tags && tags.length > 0) params.push(`tags=${tags.join(',')}`);

      const { stdout } = await execa(
        'curl',
        [
          '-s',
          '-G',
          `${this.baseUrl}/api/v1/memory/search`,
          ...params.map(p => `--data-urlencode ${p}`),
          '-H',
          `Authorization: Bearer ${this.apiKey}`,
        ],
        {
          timeout: 5000,
          reject: false,
        }
      );

      const result = JSON.parse(stdout);
      return result as MemTechSearchResult;
    } catch {
      return { memories: [], total: 0 };
    }
  }

  /**
   * Store skill activation context
   */
  async storeSkillActivation(
    skillId: string,
    prompt: string,
    score: number,
    context: Record<string, any> = {}
  ): Promise<void> {
    await this.storeMemory({
      content: `Skill "${skillId}" activated for prompt: ${prompt.substring(0, 200)}`,
      tags: ['skill-activation', skillId, 'skills-fabrik'],
      metadata: {
        skill_id: skillId,
        prompt: prompt.substring(0, 500),
        score,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }

  /**
   * Store hook execution context
   */
  async storeHookContext(
    hookType: 'pre-invoke' | 'stop',
    input: any,
    output: any,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.storeMemory({
      content: `${hookType} hook executed: ${JSON.stringify(output).substring(0, 200)}`,
      tags: ['hook-execution', hookType, 'skills-fabrik'],
      metadata: {
        hook_type: hookType,
        input_summary: this.summarizeInput(input),
        output_summary: this.summarizeOutput(output),
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
  }

  /**
   * Retrieve relevant context for a prompt
   */
  async getRelevantContext(prompt: string, limit: number = 5): Promise<string[]> {
    const results = await this.searchMemories(prompt, ['skills-fabrik'], limit);
    return results.memories.map(m => m.content);
  }

  /**
   * Summarize input for storage
   */
  private summarizeInput(input: any): Record<string, any> {
    if (typeof input === 'string') {
      return { type: 'string', length: input.length };
    }
    if (Array.isArray(input)) {
      return { type: 'array', length: input.length };
    }
    if (typeof input === 'object' && input !== null) {
      return {
        type: 'object',
        keys: Object.keys(input),
        has_prompt: 'prompt' in input,
        has_files: 'openFiles' in input || 'editLog' in input,
      };
    }
    return { type: typeof input };
  }

  /**
   * Summarize output for storage
   */
  private summarizeOutput(output: any): Record<string, any> {
    if (typeof output === 'object' && output !== null) {
      return {
        has_injected_note: 'injectedNote' in output,
        activated_skills: output.activated?.length || 0,
        blocked: output.blocked || false,
        formatted_files: output.formatted?.length || 0,
        errors: output.typecheck?.reduce((sum: number, r: any) => sum + (r.errors || 0), 0) || 0,
      };
    }
    return { type: typeof output };
  }
}

/**
 * Singleton instance
 */
let memtechInstance: MemTechIntegration | null = null;

/**
 * Get MemTech integration instance
 */
export function getMemTechIntegration(): MemTechIntegration {
  if (!memtechInstance) {
    memtechInstance = new MemTechIntegration();
  }
  return memtechInstance;
}

/**
 * Helper function to store skill activation (non-blocking)
 */
export async function storeSkillActivationContext(
  skillId: string,
  prompt: string,
  score: number,
  context?: Record<string, any>
): Promise<void> {
  try {
    const memtech = getMemTechIntegration();
    if (await memtech.isAvailable()) {
      await memtech.storeSkillActivation(skillId, prompt, score, context);
    }
  } catch (error) {
    // Silently fail - MemTech is optional
    console.debug('MemTech storage failed:', error);
  }
}

/**
 * Helper function to store hook context (non-blocking)
 */
export async function storeHookContext(
  hookType: 'pre-invoke' | 'stop',
  input: any,
  output: any,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const memtech = getMemTechIntegration();
    if (await memtech.isAvailable()) {
      await memtech.storeHookContext(hookType, input, output, metadata);
    }
  } catch (error) {
    // Silently fail - MemTech is optional
    console.debug('MemTech storage failed:', error);
  }
}

