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
  const fs = await import('fs-extra');
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
        const fs = await import('fs-extra');
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
        const fs = await import('fs-extra');
        const { readdir, pathExists } = fs;

        // Buscar todos los SKILL.md en subdirectorios
        const categories = await readdir(resolvedPath, { withFileTypes: true });

        for (const category of categories) {
          if (!category.isDirectory()) continue;

          const categoryPath = join(resolvedPath, category.name);
          const skillDirs = await readdir(categoryPath, { withFileTypes: true });

          for (const skillDir of skillDirs) {
            if (!skillDir.isDirectory()) continue;

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
    .command('check')
    .description('Check which skills match an intent')
    .argument('<intent>', 'User intent to check')
    .option('-v, --verbose', 'Verbose output')
    .action(async (intent: string, _options: { verbose?: boolean }) => {
      console.log(chalk.blue(`Checking intent: "${intent}"`));
      console.log(chalk.yellow('⚠️  Implementation pending - stub command'));
      // TODO: Implement skills check functionality using router
      process.exit(0);
    });
}
