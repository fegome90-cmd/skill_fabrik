import chalk from 'chalk';
import { Command } from 'commander';
import type { SkillMetadata, SkillRegistry } from '../types/skill.js';
import path, { join, resolve } from 'path';
import { colors, format, createBox } from '../utils/colors.js';
import { Spinner, StepIndicator, promptSelect, promptConfirm, withSpinner } from '../utils/progress.js';
import {
  packSkill,
  loadManifest,
  verifyPackage,
  installPackage,
  type SkillManifest,
} from '../utils/skill-packager.js';
import { writeEvent } from '../lib/events.js';
import { buildOptimizedPromptV2 } from '../utils/prompt-builder-v2.js';
import { fileURLToPath } from 'url';

// --- Safety Layer Lite helpers (shim + sanitize + rate limit) ---
const safetyLayerOn = () => process.env.SF_SAFETY_LAYER !== 'off';

function normalizeActivateResponse(raw: any) {
  if (raw && typeof raw === 'object' && 'success' in raw && 'results' in raw) return raw;
  const candidates = raw?.candidates ?? [];
  return {
    success: true,
    timestamp: new Date().toISOString(),
    results: candidates.map((c: any) => ({
      skillId: c?.id ?? c?.skillId ?? 'unknown',
      confidence: c?.score ?? c?.confidence ?? 0,
      reason: c?.reason ?? 'legacy-adapter',
      metadata: c?.metadata ?? {},
      matchedSignals: raw?.signals ?? {},
    })),
    metrics: { latency_ms: raw?.latency_ms },
  };
}

function sanitizeContext(ctx: any, limits = { maxFiles: 5, maxChars: 4096 }) {
  const files = Array.isArray(ctx?.files) ? ctx.files.slice(0, limits.maxFiles) : undefined;
  const clip = (s?: string) => (s && s.length > limits.maxChars ? s.slice(0, limits.maxChars) : s);
  return {
    ...ctx,
    files,
    activeFileContent: clip(ctx?.activeFileContent),
  };
}

const bucket = { tokens: 3, last: Date.now() };
function allow(): boolean {
  const now = Date.now();
  const elapsed = now - bucket.last;
  if (elapsed >= 10000) {
    const refill = Math.floor(elapsed / 10000) * 3;
    bucket.tokens = Math.min(3, bucket.tokens + refill);
    bucket.last = now;
  }
  if (bucket.tokens > 0) { bucket.tokens--; return true; }
  return false;
}

export function extractKeywords(description: string, metadata?: any): string[] {
  const keywords = new Set<string>();

  // Enhanced keyword extraction using multiple metadata fields

  // 1. Extract from description (original logic)
  const descWords = description
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['when', 'should', 'this', 'skill', 'that', 'with', 'from', 'will'].includes(word));

  descWords.forEach(word => keywords.add(word));

  // 2. Extract from metadata fields if available
  if (metadata) {
    // Extract from tags
    if (metadata.tags && Array.isArray(metadata.tags)) {
      metadata.tags.forEach((tag: string) => {
        keywords.add(tag.toLowerCase());
      });
    }

    // Extract from type
    if (metadata.type) {
      keywords.add(metadata.type.toLowerCase());
    }

    // Extract from allowed-tools
    if (metadata.allowedTools && Array.isArray(metadata.allowedTools)) {
      metadata.allowedTools.forEach((tool: string) => {
        // Split tool names by dots and add parts
        const parts = tool.toLowerCase().split('.');
        parts.forEach(part => {
          if (part.length > 2) keywords.add(part);
        });
        keywords.add(tool.toLowerCase());
      });
    }

    // Extract from summary (if different from description)
    if (metadata.summary && metadata.summary !== description) {
      const summaryWords = metadata.summary
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2);
      summaryWords.forEach(word => keywords.add(word));
    }

    // Extract from when_to_use
    if (metadata.when_to_use) {
      const whenWords = metadata.when_to_use
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2);
      whenWords.forEach(word => keywords.add(word));
    }

    // Add domain-specific keywords based on type and tools
    if (metadata.type === 'guardrail') {
      keywords.add('security');
      keywords.add('validation');
      keywords.add('safety');
      keywords.add('check');

      if (metadata.allowedTools) {
        if (metadata.allowedTools.includes('fs.write')) {
          keywords.add('filesystem');
          keywords.add('write');
          keywords.add('permissions');
        }
        if (metadata.allowedTools.includes('fs.rm')) {
          keywords.add('destructive');
          keywords.add('delete');
          keywords.add('remove');
        }
        if (metadata.allowedTools.includes('net.request')) {
          keywords.add('network');
          keywords.add('request');
          keywords.add('internet');
        }
      }
    }

    if (metadata.type === 'guideline') {
      keywords.add('guidelines');
      keywords.add('best');
      keywords.add('practice');
      keywords.add('recommendation');
    }

    if (metadata.type === 'workflow') {
      keywords.add('workflow');
      keywords.add('process');
      keywords.add('automation');
      keywords.add('pipeline');
    }
  }

  // Convert to array, filter out common words, and limit
  const filteredKeywords = Array.from(keywords)
    .filter(word => word.length > 2)
    .filter(word => !['and', 'the', 'for', 'are', 'not', 'you', 'can', 'all', 'any', 'has', 'have', 'been'].includes(word))
    .slice(0, 12); // Increased limit for better coverage

  return filteredKeywords;
}

interface LintResult {
  skill: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida skill completo (descripción, summary, when_to_use, resources, type)
 */
async function validateSkill(
  metadata: any,
  skillPath: string
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fsModule = await import('fs-extra');
  const fs = fsModule.default || fsModule;
  const { pathExists } = fs;
  const { join } = await import('path');

  // Validación: description/summary longitud mínima
  const description = metadata.description || metadata.summary || '';
  if (description.length < 50) {
    errors.push(`Descripción muy corta (${description.length} chars, mínimo 50)`);
  }

  // Validación: summary ≥ 20 caracteres y no redundante con id
  if (metadata.summary) {
    if (metadata.summary.length < 20) {
      errors.push(`Summary muy corto (${metadata.summary.length} chars, mínimo 20)`);
    }
    if (metadata.id && metadata.summary.toLowerCase().includes(metadata.id.toLowerCase())) {
      warnings.push(`Summary es redundante con id '${metadata.id}'`);
    }
  }

  // Validación: when_to_use presente y no vacío
  if (!metadata.when_to_use || metadata.when_to_use.trim().length === 0) {
    errors.push('when_to_use es requerido y no puede estar vacío');
  }

  // Validación: resources existentes y menores a 20 por skill
  if (metadata.resources && Array.isArray(metadata.resources)) {
    if (metadata.resources.length > 20) {
      errors.push(`Demasiados recursos (${metadata.resources.length}, máximo 20)`);
    }

    // Verificar que los recursos existan
    for (const resource of metadata.resources) {
      const resourcePath = join(skillPath, '..', resource);
      if (!(await pathExists(resourcePath))) {
        warnings.push(`Recurso no encontrado: ${resource}`);
      }
    }
  }

  // Validación: type válido
  const validTypes = ['guideline', 'guardrail', 'workflow', 'analyst', 'generator'];
  if (metadata.type && !validTypes.includes(metadata.type)) {
    errors.push(`Tipo inválido '${metadata.type}', debe ser uno de: ${validTypes.join(', ')}`);
  }

  // Validación: verbos de acción (advertencia) - solo en modo strict
  // Patrón más flexible que incluye palabras comunes en español
  const actionVerbs =
    /(?:ejecuta|crea|valida|genera|analiza|aplica|implementa|diseña|desarrolla|construye|configura|establece|patrones|manejo|pruebas|guía|guía|define|organiza)/i;
  if (!actionVerbs.test(description)) {
    warnings.push('Descripción podría beneficiarse de verbos de acción más claros');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function skillsCommand(program: Command) {
  const skillsCmd = program
    .command('skills')
    .description('Skills management commands (index/lint/check/pack/verify/install/activate/execute)');

  skillsCmd
    .command('index')
    .description('Index skills and generate registry')
    .argument('[path]', 'Path to skills directory', './skills')
    .option('-o, --out <file>', 'Output file path', './registry/index.json')
    .option('-v, --verbose', 'Verbose output')
    .action(async (skillsPath: string, options: { out?: string; verbose?: boolean }) => {
      try {
        console.log(chalk.blue(`Indexing skills from: ${skillsPath}`));
        const outputPath = options.out || './registry/index.json';

        const { parseSkillMD } = await import('../utils/skill-parser.js');
        const fsModule = await import('fs-extra');
        const fs = fsModule.default || fsModule;
        const { pathExists, ensureDir, writeJson, readdir, readJson } = fs;
        const { join, resolve: resolvePath } = await import('path');

        const resolvedPath = resolvePath(skillsPath);

        if (!(await pathExists(resolvedPath))) {
          throw new Error(`Skills directory not found: ${resolvedPath}`);
        }

        // Load existing skill-rules.json to merge with registry data
        const skillRulesPath = join(resolvePath(process.cwd()), 'configs', 'skill-rules.json');
        let skillRules: Record<string, any> = {};
        if (await pathExists(skillRulesPath)) {
          try {
            skillRules = await readJson(skillRulesPath);
            if (options.verbose) {
              console.log(chalk.blue(`Loaded ${Object.keys(skillRules).length} skill rules from ${skillRulesPath}`));
            }
          } catch (error) {
            console.warn(chalk.yellow(`Warning: Could not load skill-rules.json: ${error}`));
          }
        }

        // Find all SKILL.md files
        const skills: SkillMetadata[] = [];
        const categories = await readdir(resolvedPath, { withFileTypes: true });

        for (const category of categories) {
          if (!category.isDirectory()) continue;

          const categoryPath = join(resolvedPath, category.name);

          // First, check if there's a SKILL.md directly in the category directory
          const categorySkillMD = join(categoryPath, 'SKILL.md');
          if (await pathExists(categorySkillMD)) {
            try {
              const metadata = await parseSkillMD(categorySkillMD);
              const rule = skillRules[metadata.name];

              skills.push({
                name: metadata.name,
                description: metadata.description,
                severity: metadata.severity || rule?.priority || 'medium',
                type: metadata.type || rule?.type || 'guideline',
                enforcement: metadata.enforcement || rule?.enforcement || 'suggest',
                priority: metadata.priority || rule?.priority || 'normal',
                triggers: {
                  keywords: extractKeywords(metadata.description, metadata),
                  intentPatterns: rule?.promptTriggers?.intentPatterns || [],
                  pathPatterns: rule?.fileTriggers?.pathPatterns || [],
                  contentPatterns: rule?.fileTriggers?.contentPatterns || [],
                },
              });

              if (options.verbose) {
                const ruleInfo = rule ? ' (from rules)' : ' (metadata only)';
                console.log(chalk.green(`✓ Indexed: ${category.name}${ruleInfo}`));
              }
            } catch (error) {
              console.error(
                chalk.red(`✗ Error parsing ${category.name}: ${error}`)
              );
            }
          }

          // Then, check for skills in subdirectories
          const skillDirs = await readdir(categoryPath, { withFileTypes: true });
          for (const skillDir of skillDirs) {
            if (!skillDir.isDirectory()) continue;
            if (['resources', 'scripts', 'exec-scripts', 'examples', 'tests', '__tests__'].includes(skillDir.name)) {
              continue;
            }

            const skillMD = join(categoryPath, skillDir.name, 'SKILL.md');

            if (!(await pathExists(skillMD))) {
              if (options.verbose) {
                console.log(
                  chalk.yellow(`⚠️  SKILL.md not found in ${category.name}/${skillDir.name}`)
                );
              }
              continue;
            }

            try {
              const metadata = await parseSkillMD(skillMD);
              const rule = skillRules[metadata.name];

              // Include ALL information from skill-rules.json if available
              skills.push({
                name: metadata.name,
                description: metadata.description,
                severity: metadata.severity || rule?.priority || 'medium',
                type: metadata.type || rule?.type || 'guideline',
                enforcement: metadata.enforcement || rule?.enforcement || 'suggest',
                priority: metadata.priority || rule?.priority || 'normal',
                triggers: {
                  keywords: extractKeywords(metadata.description, metadata),
                  intentPatterns: rule?.promptTriggers?.intentPatterns || [],
                  pathPatterns: rule?.fileTriggers?.pathPatterns || [],
                  contentPatterns: rule?.fileTriggers?.contentPatterns || [],
                },
              });

              if (options.verbose) {
                const ruleInfo = rule ? ' (from rules)' : ' (metadata only)';
                console.log(chalk.green(`✓ Indexed: ${category.name}/${skillDir.name}${ruleInfo}`));
              }
            } catch (error) {
              console.error(
                chalk.red(`✗ Error parsing ${category.name}/${skillDir.name}: ${error}`)
              );
            }
          }
        }

        // Generate registry
        const registry: SkillRegistry = {
          skills,
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
        };

        // Validate against schema
        if (options.verbose) {
          console.log(chalk.blue(`Validating registry against schema...`));
        }
        // TODO: Add JSON schema validation

        // Write registry
        const outputResolved = resolvePath(outputPath);
        const outputDir = join(outputResolved, '..');
        await ensureDir(outputDir);
        await writeJson(outputResolved, registry, { spaces: 2 });

        console.log(chalk.green(`✅ Indexed ${skills.length} skills`));
        console.log(chalk.blue(`Registry written to: ${outputPath}`));

        process.exit(0);
      } catch (error) {
        console.error(
          chalk.red(
            `Error indexing skills: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(2);
      }
    });

  skillsCmd
    .command('lint')
    .description('Validate skill descriptions and structure')
    .argument('[path]', 'Path to skills directory', './skills')
    .option('-v, --verbose', 'Verbose output')
    .option('--strict', 'Fail on warnings')
    .action(async (skillsPath: string, options: { verbose?: boolean; strict?: boolean }) => {
      console.log(chalk.blue(`Validating skills in: ${skillsPath}`));

      const results: LintResult[] = [];
      const resolvedPath = resolve(skillsPath);

      try {
        const { parseSkillMD } = await import('../utils/skill-parser.js');
        const fsModule = await import('fs-extra');
        const fs = fsModule.default || fsModule;
        const { readdir, pathExists } = fs;

        const categories = await readdir(resolvedPath, { withFileTypes: true });

        for (const category of categories) {
          if (!category.isDirectory()) continue;

          const categoryPath = join(resolvedPath, category.name);
          const skillDirs = await readdir(categoryPath, { withFileTypes: true });

          for (const skillDir of skillDirs) {
            if (!skillDir.isDirectory()) continue;

            if (['resources', 'scripts', 'exec-scripts', 'examples', 'tests', '__tests__'].includes(skillDir.name)) {
              continue;
            }

            const skillMD = join(categoryPath, skillDir.name, 'SKILL.md');

            if (!(await pathExists(skillMD))) {
              results.push({
                skill: `${category.name}/${skillDir.name}`,
                valid: false,
                errors: ['SKILL.md no encontrado o sin frontmatter válido'],
                warnings: [],
              });
              continue;
            }

            try {
              const metadata = await parseSkillMD(skillMD);
              const validation = await validateSkill(metadata, skillMD);
              results.push({
                skill: `${category.name}/${skillDir.name}`,
                valid: validation.valid && (!options.strict || validation.warnings.length === 0),
                errors: validation.errors,
                warnings: validation.warnings,
              });
            } catch (error) {
              results.push({
                skill: `${category.name}/${skillDir.name}`,
                valid: false,
                errors: [error instanceof Error ? error.message : String(error)],
                warnings: [],
              });
            }
          }
        }

        const validCount = results.filter(r => r.valid).length;
        const totalCount = results.length;

        console.log(
          chalk.blue(`\nValidación completada: ${validCount}/${totalCount} skills válidos\n`)
        );

        for (const result of results) {
          if (result.valid && result.warnings.length === 0) {
            console.log(chalk.green(`✓ ${result.skill}`));
          } else {
            console.log(chalk.red(`✗ ${result.skill}`));

            if (result.errors.length > 0) {
              result.errors.forEach(err => {
                console.log(chalk.red(`  ERROR: ${err}`));
              });
            }

            if (result.warnings.length > 0 && options.verbose) {
              result.warnings.forEach(warn => {
                console.log(chalk.yellow(`  WARN: ${warn}`));
              });
            }
          }
        }

        const hasErrors = results.some(r => !r.valid || (options.strict && r.warnings.length > 0));
        process.exit(hasErrors ? 1 : 0);
      } catch (error) {
        console.error(chalk.red(`Error validando skills: ${error}`));
        process.exit(1);
      }
    });


  skillsCmd
    .command('pack')
    .description('Package a skill directory into a reproducible .tgz and manifest')
    .argument('<skillDir>', 'Path to skill directory')
    .option('-o, --out <dir>', 'Output directory', '.registry')
    .option('--manifest-version <version>', 'Version to embed in manifest')
    .action(async (skillDir: string, options: { out: string; manifestVersion?: string }) => {
      try {
        const { manifest, packagePath, manifestPath } = await packSkill(skillDir, {
          outDir: options.out,
          version: options.manifestVersion,
        });
        console.log(chalk.green('✓ Skill packaged successfully'));
        console.log(`  package : ${packagePath}`);
        console.log(`  manifest: ${manifestPath}`);
        await writeEvent({
          type: 'skill-pack',
          id: manifest.id,
          version: manifest.version,
          package: packagePath,
          manifest: manifestPath,
        });
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('Failed to package skill:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  skillsCmd
    .command('verify')
    .description('Verify a packaged skill (.tgz) against its manifest and schema')
    .argument('<package>', 'Path to skill package (.tgz)')
    .option('--manifest <path>', 'Manifest JSON path (defaults to same directory with .manifest.json)')
    .action(async (pkgPath: string, options: { manifest?: string }) => {
      const resolvePkgPath = (input: string): string => {
        if (input.startsWith('file://')) {
          return fileURLToPath(input);
        }
        return path.resolve(input);
      };

      try {
        const resolvedPackage = resolvePkgPath(pkgPath);
        const manifestPath =
          options.manifest !== undefined
            ? path.resolve(options.manifest)
            : resolvedPackage.replace(/\.tgz$/, '.manifest.json');

        const fsModule = await import('fs-extra');
        const fs = fsModule.default || fsModule;

        if (!(await fs.pathExists(manifestPath))) {
          throw new Error(`Manifest not found at ${manifestPath}`);
        }

        const manifest = await loadManifest(manifestPath);
        await verifyPackage(resolvedPackage, manifest);
        console.log(chalk.green('✓ Package verified successfully'));
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('Failed to verify package:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  skillsCmd
    .command('install')
    .description('Install a packaged skill into the local workspace (read-only policy)')
    .argument('<package>', 'Path to skill package (.tgz or file://)')
    .option('--manifest <path>', 'Manifest JSON path (defaults to same directory with .manifest.json)')
    .option('--target <dir>', 'Target skills directory', 'skills')
    .option('--force', 'Overwrite existing installation', false)
    .action(
      async (
        pkgPath: string,
        options: { manifest?: string; target: string; force?: boolean }
      ) => {
        const resolvePkgPath = (input: string): string => {
          if (input.startsWith('file://')) {
            return fileURLToPath(input);
          }
          return path.resolve(input);
        };

        try {
          const resolvedPackage = resolvePkgPath(pkgPath);
          const manifestPath =
            options.manifest !== undefined
              ? path.resolve(options.manifest)
              : resolvedPackage.replace(/\.tgz$/, '.manifest.json');

          const fsModule = await import('fs-extra');
          const fs = fsModule.default || fsModule;

          if (!(await fs.pathExists(manifestPath))) {
            throw new Error(`Manifest not found at ${manifestPath}`);
          }

          const manifest: SkillManifest = await loadManifest(manifestPath);
          await verifyPackage(resolvedPackage, manifest);

          const installDir = await installPackage(resolvedPackage, manifest, {
            targetDir: options.target,
            force: options.force,
          });

          console.log(chalk.green(`✓ Skill ${manifest.id}@${manifest.version} installed at ${installDir}`));
          await writeEvent({
            type: 'skill-install',
            id: manifest.id,
            version: manifest.version,
            package: resolvedPackage,
            target: installDir,
          });
          process.exit(0);
        } catch (error) {
          console.error(chalk.red('Failed to install package:'), error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      }
    );

  // New: activate (calls daemon /activate)
  skillsCmd
    .command('activate')
    .description('Activate skills based on intent (via daemon /activate)')
    .requiredOption('--intent <text>', 'Intent text')
    .option('--cwd <path>', '.', 'Working directory')
    .option('--threshold <num>', 'Activation threshold (default 0.6)')
    .option('--daemon <url>', 'Daemon URL (overrides SF_ENDPOINT)')
    .option('--json', 'Print JSON output', false)
    .action(async (options: { intent: string; cwd?: string; json?: boolean; threshold?: string; daemon?: string }) => {
      try {
        if (options.daemon) process.env.SF_ENDPOINT = String(options.daemon);
        const { post } = await import('../lib/http.js');
        const { writeEvent } = await import('../lib/events.js');
        const t0 = Date.now();
        if (safetyLayerOn() && !allow()) {
          console.error('⚠️  rate-limited: reintenta en unos segundos');
          process.exit(0);
        }

        const baseContext = {
          workingDirectory: options.cwd || process.cwd(),
          environment: process.env,
          files: [],
          userId: 'cli-user',
          sessionId: `cli-${Date.now()}`,
        };
        const ctx = safetyLayerOn() ? sanitizeContext(baseContext) : baseContext;

        const body = {
          intent: options.intent,
          context: ctx,
          options: {
            threshold: isFinite(Number(options.threshold)) ? Number(options.threshold) : 0.6,
            maxCandidates: 3,
            maxResults: 5,
            includeMetadata: true,
          },
        };

        const { ok, status, json } = await post('/activate', body);
        const latency = Date.now() - t0;
        await writeEvent({ type: 'cli-activate', ok, status, latency_ms: latency });

        const payload = safetyLayerOn() ? normalizeActivateResponse(json) : json;

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
        } else {
          // When safety layer is off and legacy shape comes back, avoid hard failure
          if (!ok || (payload && 'success' in payload && payload.success === false)) {
            console.error('[activate] error', status, (payload as any)?.error?.message || payload);
            process.exit(1);
          }
          const results = (payload as any)?.results || (payload as any)?.candidates || [];
          console.log('Activated skills:', Array.isArray(results) ? results.length : 0);
          if (Array.isArray(results) && results.length > 0) {
            results.forEach((result: any, index: number) => {
              console.log(`${index + 1}. ${result.skillId}: ${(result.confidence * 100).toFixed(1)}%`);
              if (result.reason) {
                console.log(`   Reason: ${result.reason}`);
              }
            });
          }
          const m = (payload as any)?.metrics;
          if (m) {
            const proc = m.processingTime ?? m.latency_ms;
            if (proc !== undefined) console.log(`Processing time: ${proc}ms`);
            if (m.cacheHit !== undefined) {
              console.log(`Cache hit: ${json.metrics.cacheHit ? 'YES' : 'NO'}`);
            }
          }
        }
      } catch (error) {
        console.error('activate failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // New: execute (dry-run only until Policy)
  skillsCmd
    .command('execute')
    .description('Execute a skill (dry-run) via daemon /execute')
    .requiredOption('--skill-id <id>', "Skill id or 'auto'")
    .option('--dry-run', 'Simulation (no effects)', false)
    .option('--json', 'Print JSON output', false)
    .action(async (options: { skillId: string; dryRun?: boolean; json?: boolean }) => {
      try {
        const { post } = await import('../lib/http.js');
        const { writeEvent } = await import('../lib/events.js');
        const { ok, status, json } = await post('/execute', {
          skill_id: options.skillId,
          args: {},
          dry_run: !!options.dryRun,
        });
        await writeEvent({ type: 'cli-execute', ok, status });

        if (options.json) {
          console.log(JSON.stringify(json, null, 2));
        } else {
          if (!ok) {
            console.error('[execute] error', status, json);
            process.exit(1);
          }
          console.log(json.stdout);
          console.log('Latency:', json.run_latency_ms, 'ms');
          console.log('Evidence:', json.evidence_id);
        }
      } catch (error) {
        console.error('execute failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });




  skillsCmd
    .command('rules')
    .description('Generate skill-rules.json from indexed registry')
    .option('-i, --input <file>', 'Input registry file', './registry/index.json')
    .option('-o, --output <file>', 'Output rules file', './configs/skill-rules.json')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options: { input?: string; output?: string; verbose?: boolean }) => {
      try {
        console.log(chalk.blue('Generating skill-rules.json from registry...'));

        const inputPath = resolve(options.input || './registry/index.json');
        const outputPath = resolve(options.output || './configs/skill-rules.json');

        const fsModule = await import('fs-extra');
        const fs = fsModule.default || fsModule;
        const { pathExists, readJson, ensureDir, writeJson } = fs;

        if (!(await pathExists(inputPath))) {
          console.error(chalk.red(`Registry not found: ${inputPath}. Run "skills index" first.`));
          process.exit(2);
        }

        const registry = (await readJson(inputPath)) as SkillRegistry;

        // Convert registry to skill-rules format
        const rules: Record<
          string,
          {
            type: string;
            enforcement: string;
            priority: string;
            promptTriggers?: { keywords?: string[]; intentPatterns?: string[] };
            fileTriggers?: { pathPatterns?: string[]; contentPatterns?: string[] };
            resources?: string[];
          }
        > = {};

        for (const skill of registry.skills) {
          // Determine type and enforcement from skill metadata
          // Default mapping (can be enhanced with metadata fields)
          const type = skill.severity === 'critical' ? 'guardrail' : 'guideline';
          const enforcement =
            skill.severity === 'critical'
              ? 'block'
              : skill.severity === 'high'
                ? 'require'
                : 'suggest';
          const priority = skill.severity || 'normal';

          rules[skill.name] = {
            type,
            enforcement,
            priority,
            promptTriggers: skill.triggers
              ? {
                  keywords: skill.triggers.keywords,
                  intentPatterns: skill.triggers.intentPatterns,
                }
              : undefined,
            fileTriggers: skill.triggers
              ? {
                  pathPatterns: skill.triggers.pathPatterns,
                  contentPatterns: skill.triggers.contentPatterns,
                }
              : undefined,
          };

          if (options.verbose) {
            console.log(chalk.green(`✓ Generated rule for: ${skill.name}`));
          }
        }

        // Ensure output directory exists
        await ensureDir(resolve(outputPath, '..'));

        // Write skill-rules.json
        await writeJson(outputPath, rules, { spaces: 2 });

        console.log(chalk.green(`✅ Generated ${Object.keys(rules).length} skill rule(s)`));
        console.log(chalk.blue(`Rules written to: ${outputPath}`));

        process.exit(0);
      } catch (error) {
        console.error(
          chalk.red(
            `Error generating rules: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(2);
      }
    });

  skillsCmd
    .command('check')
    .description('Check which skills match an intent')
    .argument('<intent>', 'User intent to check')
    .option('-v, --verbose', 'Verbose output')
    .option('--open-files <files...>', 'Open files to consider for path triggers')
    .option('--threshold <number>', 'Activation threshold (0-1)', '0.6')
    .option('--v2', 'Use Prompt Builder v2 for enhanced analysis')
    .action(
      async (
        intent: string,
        options: { verbose?: boolean; openFiles?: string[]; threshold?: string; v2?: boolean }
      ) => {
        try {
          console.log(chalk.blue(`Checking intent: "${intent}"`));

          // Load registry and match skills
          const registryPath = resolve(process.cwd(), 'registry', 'index.json');
          const fsModule = await import('fs-extra');
          const fs = fsModule.default || fsModule;
          const { pathExists, readJson } = fs;

          if (!(await pathExists(registryPath))) {
            console.error(chalk.red('Registry not found. Run "skills index" first.'));
            process.exit(2);
          }

          const registry = (await readJson(registryPath)) as SkillRegistry;
          const lowerIntent = intent.toLowerCase();

          // Enhanced matching with scoring
          const matches: Array<{ skill: SkillMetadata; score: number; matchedKeywords: string[] }> =
            [];

          for (const skill of registry.skills) {
            const keywords = skill.triggers?.keywords || [];
            const intentPatterns = skill.triggers?.intentPatterns || [];
            const pathPatterns = skill.triggers?.pathPatterns || [];

            let score = 0;
            const matchedKeywords: string[] = [];

            // Keyword matching (basic scoring)
            const keywordMatches = keywords.filter(keyword =>
              lowerIntent.includes(keyword.toLowerCase())
            );
            if (keywordMatches.length > 0) {
              score += 0.4;
              matchedKeywords.push(...keywordMatches);
            }

            // Intent pattern matching
            const intentMatches = intentPatterns.filter(pattern => {
              try {
                return new RegExp(pattern, 'i').test(intent);
              } catch {
                return false;
              }
            });
            if (intentMatches.length > 0) {
              score += 0.4;
            }

            // Path pattern matching (if open files provided)
            if (options.openFiles && pathPatterns.length > 0) {
              const pathMatches = pathPatterns.filter(pattern =>
                options.openFiles!.some(file => {
                  // Simple glob matching
                  const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]+');
                  return new RegExp(regex).test(file);
                })
              );
              if (pathMatches.length > 0) {
                score += 0.2;
              }
            }

            if (score > 0) {
              matches.push({ skill, score, matchedKeywords });
            }
          }

          // Filter by threshold
          const threshold = parseFloat(options.threshold || '0.6');
          const filteredMatches = matches.filter(m => m.score >= threshold);

          // Sort by score descending
          filteredMatches.sort((a, b) => b.score - a.score);

          if (filteredMatches.length === 0) {
            console.log(chalk.yellow('⚠️  No matching skills found'));

            if (options.verbose && matches.length > 0) {
              console.log(
                chalk.gray(`\nFound ${matches.length} potential match(es) below threshold:`)
              );
              matches.slice(0, 5).forEach(m => {
                console.log(chalk.gray(`  ${m.skill.name}: ${(m.score * 100).toFixed(1)}%`));
              });
            }

            process.exit(0);
          }

          console.log(chalk.green(`\n✅ Found ${filteredMatches.length} matching skill(s):`));

          filteredMatches.forEach(({ skill, score, matchedKeywords }) => {
            console.log(chalk.green(`  ✓ ${skill.name} (${(score * 100).toFixed(1)}%)`));

            if (options.verbose) {
              if (matchedKeywords.length > 0) {
                console.log(
                  chalk.gray(`    → Matched keywords: ${matchedKeywords.slice(0, 3).join(', ')}`)
                );
              }
              if (skill.description) {
                console.log(chalk.gray(`    → ${skill.description.substring(0, 80)}...`));
              }
              if (skill.severity) {
                const severityColor =
                  skill.severity === 'critical'
                    ? chalk.red
                    : skill.severity === 'high'
                      ? chalk.yellow
                      : chalk.blue;
                console.log(severityColor(`    → Severity: ${skill.severity}`));
              }
            }
          });

          // Enhanced analysis with Prompt Builder v2 if requested
          if (options.v2) {
            console.log(chalk.blue('\n🔍 Enhanced analysis with Prompt Builder v2:'));

            try {
              const optimizedPrompt = await buildOptimizedPromptV2({
                description: intent,
                skillIds: matches.map(m => m.skill.name),
                includeTemplate: true,
                includeTags: true,
                complexity: 'medium',
                cwd: process.cwd(),
              });

              console.log(chalk.cyan(`  📊 Expected score: ${optimizedPrompt.expectedScore.toFixed(1)}`));
              console.log(chalk.cyan(`  🏷️  TAGs coverage: ${((optimizedPrompt.tagsCoverage || 0) * 100).toFixed(0)}%`));
              console.log(chalk.cyan(`  🔗 Template coverage: ${((optimizedPrompt.templateScore || 0) * 100).toFixed(0)}%`));

              if (optimizedPrompt.signals.tags && optimizedPrompt.signals.tags.length > 0) {
                console.log(chalk.gray(`  📋 Relevant tags: ${optimizedPrompt.signals.tags.slice(0, 5).join(', ')}`));
              }

              if (optimizedPrompt.skillActivation.length > 0) {
                console.log(chalk.gray(`  ⚡ Skill activations: ${optimizedPrompt.skillActivation.slice(0, 3).map(s => s.skillId).join(', ')}`));
              }
            } catch (error) {
              console.log(chalk.yellow(`  ⚠️  Enhanced analysis failed: ${error instanceof Error ? error.message : String(error)}`));
            }
          }

          process.exit(0);
        } catch (error) {
          console.error(
            chalk.red(
              `Error checking intent: ${error instanceof Error ? error.message : String(error)}`
            )
          );
          process.exit(2);
        }
      }
    );
  skillsCmd
    .command('confirm')
    .description('Confirm a write-safe (S1) challenge for a skill')
    .requiredOption('--challenge <id>', 'Challenge identifier returned by /execute preflight')
    .option('--nonce <value>', 'Nonce returned when CONFIRM_TEST_EXPOSE_NONCE=true (dev only)')
    .option('--cwd <path>', 'Working directory', '.')
    .option('--skill-id <id>', 'Skill id to confirm (defaults to policy-s1 example)', 'policy-s1')
    .option('--json', 'Print JSON response', false)
    .action(async (options: {
      challenge: string;
      nonce?: string;
      cwd?: string;
      skillId: string;
      json?: boolean;
    }) => {
      try {
        const secret = process.env.CONFIRM_SECRET || '';
        if (!secret) {
          console.error(chalk.red('CONFIRM_SECRET is required to generate confirm tokens.'));
          process.exit(2);
        }

        const nonce = options.nonce || '';
        const tokenArgs = ['scripts/make-confirm-token.mjs', options.challenge];
        if (nonce) tokenArgs.push(nonce);

        const { execFile } = await import('node:child_process');
        const { promisify } = await import('node:util');
        const execFileAsync = promisify(execFile);
        const tokenResult = await execFileAsync(process.execPath, tokenArgs, {
          cwd: process.cwd(),
          env: process.env,
        });
        const confirmToken = tokenResult.stdout.toString().trim();

        const confirmBody = {
          skill_id: options.skillId,
          challenge_id: options.challenge,
          confirm_token: confirmToken,
          needs: ['fs.write'],
          cwd: options.cwd || '.',
        };

        let status = 0;
        let json: any = {};
        let ok = false;

        if (process.env.SF_CONFIRM_INLINE === 'true') {
          const { inlineExecute, inlineClose, seedInlineChallenge } = await import('../lib/inline-execute.js');
          if (process.env.SF_CONFIRM_INLINE_SEED) {
            try {
              const seedData = JSON.parse(process.env.SF_CONFIRM_INLINE_SEED);
              await seedInlineChallenge(seedData);
            } catch (error) {
              console.warn('Failed to parse SF_CONFIRM_INLINE_SEED:', error);
            }
          }
          const response = await inlineExecute(confirmBody);
          status = response.statusCode;
          json = await response.json();
          ok = status >= 200 && status < 300;
          await inlineClose();
        } else {
          const { post } = await import('../lib/http.js');
          const result = await post('/execute', confirmBody);
          ok = result.ok;
          status = result.status;
          json = result.json;
        }

        await writeEvent({
          type: 'cli-confirm',
          ok,
          status,
          challenge_id: options.challenge,
          nonce: nonce || undefined,
        });

        if (!ok) {
          console.error(chalk.red('confirm failed'), status, json);
          process.exit(typeof status === 'number' ? status : 1);
        }

        if (options.json) {
          console.log(JSON.stringify(json, null, 2));
        } else {
          console.log(chalk.green('✓ Confirmed challenge'));
          const stdoutValue = typeof json.stdout === 'string' ? json.stdout : JSON.stringify(json.stdout, null, 2);
          console.log(stdoutValue);
          if (Array.isArray(json.changes)) {
            console.log('Changes:');
            for (const change of json.changes) {
              console.log(` - ${change.path}`);
            }
          }
          if (json.rollback_plan) {
            console.log('Rollback plan:', JSON.stringify(json.rollback_plan, null, 2));
          }
        }
      } catch (error) {
        console.error('confirm failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
