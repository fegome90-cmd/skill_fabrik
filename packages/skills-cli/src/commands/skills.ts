import { Command } from 'commander';
import chalk from 'chalk';
import type { SkillMetadata, SkillRegistry } from '../types/skill.js';
import { join, resolve } from 'path';

function extractKeywords(description: string): string[] {
  // Simple keyword extraction from description
  // Split by common words and extract meaningful terms
  const words = description
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(
      word => !['when', 'should', 'this', 'skill', 'that', 'with', 'from', 'will'].includes(word)
    );

  // Return unique keywords (max 10)
  return [...new Set(words)].slice(0, 10);
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

  // Validación: verbos de acción (advertencia)
  const actionVerbs =
    /(?:ejecuta|crea|valida|genera|analiza|aplica|implementa|diseña|desarrolla|construye|configura|establece)/i;
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
    .description('Skills management commands (index/lint/check)');

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
        const { pathExists, ensureDir, writeJson, readdir } = fs;
        const { join, resolve: resolvePath } = await import('path');

        const resolvedPath = resolvePath(skillsPath);

        if (!(await pathExists(resolvedPath))) {
          throw new Error(`Skills directory not found: ${resolvedPath}`);
        }

        // Find all SKILL.md files
        const skills: SkillMetadata[] = [];
        const categories = await readdir(resolvedPath, { withFileTypes: true });

        for (const category of categories) {
          if (!category.isDirectory()) continue;

          const categoryPath = join(resolvedPath, category.name);
          const skillDirs = await readdir(categoryPath, { withFileTypes: true });

          for (const skillDir of skillDirs) {
            if (!skillDir.isDirectory()) continue;

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

              // Try to extract triggers from content (basic implementation)
              // TODO: Read triggers from config or skill-rules.json
              skills.push({
                name: metadata.name,
                description: metadata.description,
                severity: metadata.severity || 'medium',
                triggers: {
                  keywords: extractKeywords(metadata.description),
                },
              });

              if (options.verbose) {
                console.log(chalk.green(`✓ Indexed: ${category.name}/${skillDir.name}`));
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

        // Buscar todos los SKILL.md en subdirectorios
        const categories = await readdir(resolvedPath, { withFileTypes: true });

        for (const category of categories) {
          if (!category.isDirectory()) continue;

          const categoryPath = join(resolvedPath, category.name);
          const skillDirs = await readdir(categoryPath, { withFileTypes: true });

          for (const skillDir of skillDirs) {
            if (!skillDir.isDirectory()) continue;

            // Ignorar directorios comunes (resources, scripts, etc.)
            if (
              ['resources', 'scripts', 'examples', 'tests', '__tests__'].includes(skillDir.name)
            ) {
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

        // Reporte
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
    .action(
      async (
        intent: string,
        options: { verbose?: boolean; openFiles?: string[]; threshold?: string }
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
}
