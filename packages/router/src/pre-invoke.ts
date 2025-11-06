/**
 * Pre-invoke Hook: Detecta y activa skills antes de que el agente procese el prompt
 * Updated: 2025-11-05 - Added circuit breaker (SF-STABILITY-2025-T1.4)
 * Updated: 2025-11-05 - Added structured logging (SF-STABILITY-2025-T2.4)
 */

import { loadRules, matchRulesFor } from './detectors.js';
import { checkApprovedPlan, isPlanningModeEnabled } from './utils/plan-check.js';
import type { PreHookInput, PreHookOutput } from './types.js';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { CircuitBreaker, CircuitBreakerError } from './resilience/circuit-breaker.js';
import { LRUCache } from './cache/lru-cache.js';
import { logger } from './logger.js';
import { DaemonHealthChecker } from './health-checker.js';
import { withRetry } from './resilience/retry.js';

// Import slash command detection (if available)
let slashCommandDetector: any = null;
try {
  // Try to import slash commands - may not be available
  const slashCommandsModule = await import('../../slash-commands/dist/index.js');
  slashCommandDetector = slashCommandsModule.SlashCommandParser;
} catch {
  // Slash commands package not available, continue without it
}

/**
 * Hook pre-invoke: analiza prompt, archivos abiertos y contenido para activar skills
 * También verifica gate de planning mode si está habilitado
 */
export async function userPromptSubmitHook(input: PreHookInput): Promise<PreHookOutput> {
  let planCheck: { hasPlan: boolean; plan?: any; taskName?: string } | null = null;

  // Check for slash commands first (highest priority)
  if (slashCommandDetector && slashCommandDetector.isSlashCommand(input.prompt)) {
    const parsedCommand = slashCommandDetector.parse(input.prompt);
    if (parsedCommand) {
      return {
        injectedNote: `⚡ SLASH COMMAND DETECTED: /${parsedCommand.command}\n\nThis slash command will be processed by the slash commands system.\n\nAvailable slash commands: /dev-docs, /create-dev-docs, /dev-docs-update, /build-and-fix, /code-review, /route-research-for-testing, /test-route, /compact, /undo, /plugin\n\nUse "skills-cli / ${parsedCommand.command}" to execute, or add "--help" for usage: /${parsedCommand.command} --help`,
        activated: [],
        metadata: {
          scores: {},
          reasons: {},
          slashCommand: {
            detected: true,
            command: parsedCommand.command,
            args: parsedCommand.args,
            flags: parsedCommand.flags,
            options: parsedCommand.options
          }
        },
        blocked: false,
      };
    }
  }

  // Check planning mode gate second
  if (isPlanningModeEnabled()) {
    planCheck = await checkApprovedPlan(input.cwd);

    if (!planCheck.hasPlan) {
      return {
        injectedNote: undefined,
        activated: [],
        metadata: { scores: {}, reasons: {} },
        blocked: true,
        blockReason: `🚫 PLANNING MODE GATE: No approved plan found.\n\nTo proceed:\n  1. Create plan: skills plan create "<task description>"\n  2. Approve plan: skills plan approve <plan-id>\n  3. Save workflow: skills plan save <plan-id> --approve\n\nOr disable planning mode: SKILLS_PLANNING_MODE=false`,
      };
    }
  }

  // Continue with skill activation (paralelo con rules loading)
  const [rules] = await Promise.all([
    loadRules(input.cwd)
  ]);

  const threshold = parseFloat(process.env.SKILL_ACTIVATION_THRESHOLD || '0.45');
  const output = matchRulesFor(input, rules, threshold);

  // Enhanced daemon integration with caching and improved error handling
  await enhanceWithDaemonResults(input, output, threshold);

  // Add plan info if available (reutilizar planCheck)
  if (planCheck && planCheck.hasPlan && planCheck.plan) {
    output.injectedNote = `📋 ACTIVE PLAN: ${planCheck.plan.id} (${planCheck.taskName})\n\n${output.injectedNote || ''}`;
  }

  return output;
}

/**
 * LRU Cache for daemon responses
 * Task: SF-STABILITY-2025-T2.1
 */
const CACHE_TTL_MS = parseInt(process.env.DAEMON_CACHE_TTL || '60000'); // 1 minute default
const MAX_CACHE_SIZE = parseInt(process.env.DAEMON_CACHE_MAX_SIZE || '100');

const daemonCache = new LRUCache<any>({
  maxSize: MAX_CACHE_SIZE,
  ttl: CACHE_TTL_MS,
  cleanupInterval: 30000 // 30 seconds
});

/**
 * Clear daemon cache (for graceful shutdown)
 * Task: SF-STABILITY-2025-T1.2
 * Updated: SF-STABILITY-2025-T2.1 - Now uses LRU Cache
 */
export function clearDaemonCache(): void {
  daemonCache.destroy();
}

/**
 * Get cache statistics
 * Task: SF-STABILITY-2025-T2.1
 */
export function getCacheStats() {
  return daemonCache.getStats();
}

/**
 * Circuit breaker for daemon calls
 * Task: SF-STABILITY-2025-T1.4
 */
const daemonCircuitBreaker = new CircuitBreaker({
  name: 'daemon-activate',
  failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
  successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '2'),
  resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000'), // 30 seconds
  timeout: parseInt(process.env.DAEMON_TIMEOUT || '5000') // 5 seconds
});

/**
 * Health checker for daemon
 * Task: SF-STABILITY-2025-T3.2
 */
const daemonHealthChecker = new DaemonHealthChecker(
  process.env.SKILLS_DAEMON_URL || 'http://localhost:3001',
  parseInt(process.env.DAEMON_HEALTH_CHECK_INTERVAL || '30000') // 30 seconds
);

// Start health checker
daemonHealthChecker.start();

/**
 * Enhanced daemon integration with caching, retry logic, and improved signal processing
 */
async function enhanceWithDaemonResults(input: PreHookInput, output: PreHookOutput, threshold: number): Promise<void> {
  const enableDaemon = process.env.SKILLS_DAEMON_ENHANCED !== 'false';
  if (!enableDaemon) {
    return;
  }

  const startTime = Date.now();
  const maxRetries = parseInt(process.env.DAEMON_MAX_RETRIES || '2');
  const retryDelay = parseInt(process.env.DAEMON_RETRY_DELAY || '500');

  // Generate cache key based on prompt and context
  const cacheKey = generateCacheKey(input, threshold);

  // Check cache first
  const cached = getCachedResult(cacheKey);
  if (cached) {
    mergeDaemonResults(output, cached, 'cache');
    output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
    (output.metadata as any).cache = { hit: true, stats: getCacheStats() };
    return;
  }

  // Task: SF-STABILITY-2025-T3.2 - Check daemon health before calling
  if (!daemonHealthChecker.isHealthy()) {
    logger.warn({
      healthStatus: daemonHealthChecker.getStatus()
    }, 'Daemon is unhealthy, skipping activation');

    output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
    (output.metadata as any).daemon = {
      success: false,
      error: 'daemon_unhealthy',
      healthStatus: daemonHealthChecker.getStatus()
    };
    return;
  }

  // Get daemon URL with service discovery
  let daemonUrl = await getDaemonUrl(input.cwd);

  // Task: SF-STABILITY-2025-T3.4 - Use exponential backoff retry
  try {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-router-cache-key': cacheKey
    };

    if (process.env.SF_API_KEY) {
      headers['x-api-key'] = String(process.env.SF_API_KEY);
    }

    // Enhanced request body with more context
    const body = {
      intent: input.prompt,
      context: {
        files: input.openFiles || [],
        activeFile: input.activeFile,
        activeFileContent: input.activeFileContent,
        workingDirectory: input.cwd,
        editor: input.editor || 'router',
        // Add file extensions for better signal processing
        fileExtensions: (input.openFiles || []).map(f => f.split('.').pop()),
        // Add project context
        projectType: await detectProjectType(input.cwd),
        // Add timestamp for cache busting if needed
        requestTime: Date.now()
      },
      options: {
        threshold,
        maxResults: 10, // Increased from 5 for better coverage
        includeSignals: true, // Request signal processing
        includeMetadata: true // Request detailed metadata
      }
    };

    // Execute with retry + circuit breaker
    const json = await withRetry(async () => {
      return await daemonCircuitBreaker.execute(async () => {
        const res = await fetch(`${daemonUrl}/activate`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res.json() as Promise<any>;
      });
    }, {
      maxRetries,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      jitter: true
    });

    // Cache successful response
    cacheResult(cacheKey, json);

    // Enhanced result processing
    if (json.results && Array.isArray(json.results)) {
      mergeDaemonResults(output, json, 'daemon', input);
      output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
      (output.metadata as any).daemon = {
        success: true,
        results: json.results.length,
        signals: json.signals,
        latency: Date.now() - startTime,
        url: daemonUrl,
        circuitState: daemonCircuitBreaker.getState(),
        circuitStats: daemonCircuitBreaker.getStats()
      };
    }

    return; // Success

  } catch (error) {
    // Handle circuit breaker errors specially
    if (error instanceof CircuitBreakerError) {
      logger.warn({
        circuitState: error.state,
        circuitStats: daemonCircuitBreaker.getStats()
      }, 'Circuit breaker open, skipping daemon call');

      output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
      (output.metadata as any).daemon = {
        success: false,
        error: 'circuit_breaker_open',
        circuitState: daemonCircuitBreaker.getState(),
        circuitStats: daemonCircuitBreaker.getStats(),
        latency: Date.now() - startTime
      };
      return; // Don't retry when circuit is open
    }

    // Handle other errors
    logger.warn({
      err: error,
      daemonUrl
    }, 'Daemon activation failed after retries');

    output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
    (output.metadata as any).daemon = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      latency: Date.now() - startTime
    };
  }
}

/**
 * Generate cache key based on input and threshold
 */
function generateCacheKey(input: PreHookInput, threshold: number): string {
  const key = {
    prompt: input.prompt.trim().toLowerCase(),
    fileCount: input.openFiles?.length || 0,
    hasActiveContent: !!input.activeFileContent,
    threshold,
    // Include only file types for better cache hits
    fileTypes: Array.from(new Set((input.openFiles || []).map(f => f.split('.').pop()?.toLowerCase() || '').filter(Boolean))).sort()
  };

  return Buffer.from(JSON.stringify(key)).toString('base64');
}

/**
 * Get cached result if valid
 * Updated: SF-STABILITY-2025-T2.1 - Now uses LRU Cache
 */
function getCachedResult(key: string): any | null {
  return daemonCache.get(key) || null;
}

/**
 * Cache result with TTL
 * Updated: SF-STABILITY-2025-T2.1 - Now uses LRU Cache (auto-eviction)
 */
function cacheResult(key: string, data: any): void {
  daemonCache.set(key, data);
}

/**
 * Get daemon URL with service discovery support
 */
async function getDaemonUrl(cwd?: string): Promise<string> {
  // Start with default URL
  let daemonUrl = process.env.DAEMON_URL || 'http://127.0.0.1:7727';

  // Use service discovery if enabled
  if (process.env.ROUTER_DISCOVERY === '1') {
    try {
      const discovery = process.env.DISCOVERY_URL || 'http://127.0.0.1:8877';

      // Sticky selection for consistent routing
      if (process.env.ROUTER_STICKY === '1' && cwd) {
        const list = await fetch(`${discovery}/services/sf-daemon?endpoints=true`).then(r => r.ok ? r.json() : null) as any;
        const eps: any[] = Array.isArray(list?.endpoints) ? list.endpoints : [];

        if (eps.length > 0) {
          // Consistent hash of cwd
          let hash = 0;
          for (let i = 0; i < cwd.length; i++) {
            hash = (hash * 31 + cwd.charCodeAt(i)) >>> 0;
          }
          const selected = eps[Math.abs(hash) % eps.length];
          if (selected?.url) daemonUrl = selected.url;
        }
      } else {
        // Round-robin or first available
        const ep = await fetch(`${discovery}/services/sf-daemon/endpoint`).then(r => r.ok ? r.json() : null) as any;
        if (ep?.success && ep.endpoint?.url) daemonUrl = ep.endpoint.url;
      }
    } catch (error) {
      // Service discovery failed, use default URL
      logger.debug({
        err: error,
        discoveryUrl: process.env.DISCOVERY_URL
      }, 'Service discovery failed, using default daemon URL');
    }
  }

  return daemonUrl;
}

/**
 * Detect project type based on directory structure
 */
async function detectProjectType(cwd?: string): Promise<string> {
  if (!cwd) return 'unknown';

  // Simple heuristics for project type detection
  const indicators = {
    'react': ['package.json', 'src', 'public'],
    'node': ['package.json', 'node_modules'],
    'python': ['requirements.txt', 'setup.py', 'pyproject.toml'],
    'typescript': ['tsconfig.json', 'package.json'],
    'nextjs': ['next.config.js', 'package.json'],
    'express': ['package.json', 'app.js', 'server.js']
  };

  try {
    for (const [type, files] of Object.entries(indicators)) {
      const hasAllFiles = files.every(file => existsSync(`${cwd}/${file}`));
      if (hasAllFiles) return type;
    }
  } catch {
    // Ignore filesystem errors
  }

  return 'unknown';
}

/**
 * Merge daemon results with existing output with enhanced confidence scoring
 */
function mergeDaemonResults(output: PreHookOutput, daemonData: any, source: 'cache' | 'daemon', input?: PreHookInput): void {
  if (!daemonData.results || !Array.isArray(daemonData.results)) return;

  const existingSkills = new Set(output.activated || []);
  const daemonSkills = daemonData.results
    .filter((r: any) => r?.skillId && !existingSkills.has(r.skillId))
    .map((r: any) => ({
      skillId: r.skillId,
      confidence: enhanceConfidence(r, input, source),
      reason: `${source}-match`,
      metadata: {
        source,
        originalConfidence: r.confidence || 0,
        signals: r.signals || {},
        ...(r.metadata || {})
      }
    }));

  // Merge skills, removing duplicates and sorting by confidence
  const allSkills = [
    ...(output.activated || []).map(skillId => ({
      skillId,
      confidence: 0.5, // Default confidence for router results
      reason: 'router-match'
    })),
    ...daemonSkills
  ];

  // Remove duplicates and sort by confidence
  const uniqueSkills = allSkills.reduce((acc: any[], skill: any) => {
    const existing = acc.find((s: any) => s.skillId === skill.skillId);
    if (!existing) {
      acc.push(skill);
    } else if (skill.confidence > existing.confidence) {
      // Keep the higher confidence result
      Object.assign(existing, skill);
    }
    return acc;
  }, [] as any[])
  .sort((a: any, b: any) => b.confidence - a.confidence);

  output.activated = uniqueSkills.map(s => s.skillId);

  // Update metadata with enhanced scoring
  output.metadata = output.metadata || { scores: {}, reasons: {} } as any;
  uniqueSkills.forEach((skill: any) => {
    (output.metadata as any).scores[skill.skillId] = skill.confidence;
    (output.metadata as any).reasons[skill.skillId] = skill.reason;
  });
}

/**
 * Enhance confidence based on various signals
 */
function enhanceConfidence(result: any, input?: PreHookInput, source?: string): number {
  let confidence = result.confidence || 0;

  // Boost confidence for certain signals
  if (result.signals) {
    // Boost for keyword matches in prompt
    if (result.signals.keywordMatches > 0) {
      confidence += 0.1 * Math.min(result.signals.keywordMatches, 3);
    }

    // Boost for file path matches
    if (result.signals.fileMatches > 0) {
      confidence += 0.05 * Math.min(result.signals.fileMatches, 2);
    }

    // Boost for content matches
    if (result.signals.contentMatches > 0) {
      confidence += 0.15 * Math.min(result.signals.contentMatches, 2);
    }
  }

  // Source-based adjustments
  if (source === 'cache') {
    confidence *= 0.95; // Slightly reduce cached result confidence
  } else if (source === 'daemon') {
    confidence *= 1.05; // Slightly boost daemon result confidence
  }

  // Context-based adjustments
  if (input && input.openFiles && input.openFiles.length > 0) {
    // If we have file context, boost confidence slightly
    confidence += 0.02;
  }

  // Cap confidence at 1.0
  return Math.min(confidence, 1.0);
}
