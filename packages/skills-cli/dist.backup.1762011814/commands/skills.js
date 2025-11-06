"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractKeywords = extractKeywords;
exports.skillsCommand = skillsCommand;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importStar(require("path"));
const skill_packager_js_1 = require("../utils/skill-packager.js");
const events_js_1 = require("../lib/events.js");
const prompt_builder_v2_js_1 = require("../utils/prompt-builder-v2.js");
const url_1 = require("url");
function extractKeywords(description) {
    // Simple keyword extraction from description
    // Split by common words and extract meaningful terms
    const words = description
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['when', 'should', 'this', 'skill', 'that', 'with', 'from', 'will'].includes(word));
    // Return unique keywords (max 10)
    return [...new Set(words)].slice(0, 10);
}
/**
 * Valida skill completo (descripción, summary, when_to_use, resources, type)
 */
async function validateSkill(metadata, skillPath) {
    const errors = [];
    const warnings = [];
    const fsModule = await Promise.resolve().then(() => __importStar(require('fs-extra')));
    const fs = fsModule.default || fsModule;
    const { pathExists } = fs;
    const { join } = await Promise.resolve().then(() => __importStar(require('path')));
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
    const actionVerbs = /(?:ejecuta|crea|valida|genera|analiza|aplica|implementa|diseña|desarrolla|construye|configura|establece|patrones|manejo|pruebas|guía|guía|define|organiza)/i;
    if (!actionVerbs.test(description)) {
        warnings.push('Descripción podría beneficiarse de verbos de acción más claros');
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
function skillsCommand(program) {
    const skillsCmd = program
        .command('skills')
        .description('Skills management commands (index/lint/check/pack/verify/install/activate/execute)');
    skillsCmd
        .command('index')
        .description('Index skills and generate registry')
        .argument('[path]', 'Path to skills directory', './skills')
        .option('-o, --out <file>', 'Output file path', './registry/index.json')
        .option('-v, --verbose', 'Verbose output')
        .action(async (skillsPath, options) => {
        try {
            console.log(chalk_1.default.blue(`Indexing skills from: ${skillsPath}`));
            const outputPath = options.out || './registry/index.json';
            const { parseSkillMD } = await Promise.resolve().then(() => __importStar(require('../utils/skill-parser.js')));
            const fsModule = await Promise.resolve().then(() => __importStar(require('fs-extra')));
            const fs = fsModule.default || fsModule;
            const { pathExists, ensureDir, writeJson, readdir } = fs;
            const { join, resolve: resolvePath } = await Promise.resolve().then(() => __importStar(require('path')));
            const resolvedPath = resolvePath(skillsPath);
            if (!(await pathExists(resolvedPath))) {
                throw new Error(`Skills directory not found: ${resolvedPath}`);
            }
            // Find all SKILL.md files
            const skills = [];
            const categories = await readdir(resolvedPath, { withFileTypes: true });
            for (const category of categories) {
                if (!category.isDirectory())
                    continue;
                const categoryPath = join(resolvedPath, category.name);
                const skillDirs = await readdir(categoryPath, { withFileTypes: true });
                for (const skillDir of skillDirs) {
                    if (!skillDir.isDirectory())
                        continue;
                    const skillMD = join(categoryPath, skillDir.name, 'SKILL.md');
                    if (!(await pathExists(skillMD))) {
                        if (options.verbose) {
                            console.log(chalk_1.default.yellow(`⚠️  SKILL.md not found in ${category.name}/${skillDir.name}`));
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
                            console.log(chalk_1.default.green(`✓ Indexed: ${category.name}/${skillDir.name}`));
                        }
                    }
                    catch (error) {
                        console.error(chalk_1.default.red(`✗ Error parsing ${category.name}/${skillDir.name}: ${error}`));
                    }
                }
            }
            // Generate registry
            const registry = {
                skills,
                version: '1.0.0',
                generatedAt: new Date().toISOString(),
            };
            // Validate against schema
            if (options.verbose) {
                console.log(chalk_1.default.blue(`Validating registry against schema...`));
            }
            // TODO: Add JSON schema validation
            // Write registry
            const outputResolved = resolvePath(outputPath);
            const outputDir = join(outputResolved, '..');
            await ensureDir(outputDir);
            await writeJson(outputResolved, registry, { spaces: 2 });
            console.log(chalk_1.default.green(`✅ Indexed ${skills.length} skills`));
            console.log(chalk_1.default.blue(`Registry written to: ${outputPath}`));
            process.exit(0);
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error indexing skills: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(2);
        }
    });
    skillsCmd
        .command('lint')
        .description('Validate skill descriptions and structure')
        .argument('[path]', 'Path to skills directory', './skills')
        .option('-v, --verbose', 'Verbose output')
        .option('--strict', 'Fail on warnings')
        .action(async (skillsPath, options) => {
        console.log(chalk_1.default.blue(`Validating skills in: ${skillsPath}`));
        const results = [];
        const resolvedPath = (0, path_1.resolve)(skillsPath);
        try {
            const { parseSkillMD } = await Promise.resolve().then(() => __importStar(require('../utils/skill-parser.js')));
            const fsModule = await Promise.resolve().then(() => __importStar(require('fs-extra')));
            const fs = fsModule.default || fsModule;
            const { readdir, pathExists } = fs;
            const categories = await readdir(resolvedPath, { withFileTypes: true });
            for (const category of categories) {
                if (!category.isDirectory())
                    continue;
                const categoryPath = (0, path_1.join)(resolvedPath, category.name);
                const skillDirs = await readdir(categoryPath, { withFileTypes: true });
                for (const skillDir of skillDirs) {
                    if (!skillDir.isDirectory())
                        continue;
                    if (['resources', 'scripts', 'examples', 'tests', '__tests__'].includes(skillDir.name)) {
                        continue;
                    }
                    const skillMD = (0, path_1.join)(categoryPath, skillDir.name, 'SKILL.md');
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
                    }
                    catch (error) {
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
            console.log(chalk_1.default.blue(`\nValidación completada: ${validCount}/${totalCount} skills válidos\n`));
            for (const result of results) {
                if (result.valid && result.warnings.length === 0) {
                    console.log(chalk_1.default.green(`✓ ${result.skill}`));
                }
                else {
                    console.log(chalk_1.default.red(`✗ ${result.skill}`));
                    if (result.errors.length > 0) {
                        result.errors.forEach(err => {
                            console.log(chalk_1.default.red(`  ERROR: ${err}`));
                        });
                    }
                    if (result.warnings.length > 0 && options.verbose) {
                        result.warnings.forEach(warn => {
                            console.log(chalk_1.default.yellow(`  WARN: ${warn}`));
                        });
                    }
                }
            }
            const hasErrors = results.some(r => !r.valid || (options.strict && r.warnings.length > 0));
            process.exit(hasErrors ? 1 : 0);
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error validando skills: ${error}`));
            process.exit(1);
        }
    });
    skillsCmd
        .command('pack')
        .description('Package a skill directory into a reproducible .tgz and manifest')
        .argument('<skillDir>', 'Path to skill directory')
        .option('-o, --out <dir>', 'Output directory', '.registry')
        .option('--manifest-version <version>', 'Version to embed in manifest')
        .action(async (skillDir, options) => {
        try {
            const { manifest, packagePath, manifestPath } = await (0, skill_packager_js_1.packSkill)(skillDir, {
                outDir: options.out,
                version: options.manifestVersion,
            });
            console.log(chalk_1.default.green('✓ Skill packaged successfully'));
            console.log(`  package : ${packagePath}`);
            console.log(`  manifest: ${manifestPath}`);
            await (0, events_js_1.writeEvent)({
                type: 'skill-pack',
                id: manifest.id,
                version: manifest.version,
                package: packagePath,
                manifest: manifestPath,
            });
            process.exit(0);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to package skill:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    skillsCmd
        .command('verify')
        .description('Verify a packaged skill (.tgz) against its manifest and schema')
        .argument('<package>', 'Path to skill package (.tgz)')
        .option('--manifest <path>', 'Manifest JSON path (defaults to same directory with .manifest.json)')
        .action(async (pkgPath, options) => {
        const resolvePkgPath = (input) => {
            if (input.startsWith('file://')) {
                return (0, url_1.fileURLToPath)(input);
            }
            return path_1.default.resolve(input);
        };
        try {
            const resolvedPackage = resolvePkgPath(pkgPath);
            const manifestPath = options.manifest !== undefined
                ? path_1.default.resolve(options.manifest)
                : resolvedPackage.replace(/\.tgz$/, '.manifest.json');
            const fsModule = await Promise.resolve().then(() => __importStar(require('fs-extra')));
            const fs = fsModule.default || fsModule;
            if (!(await fs.pathExists(manifestPath))) {
                throw new Error(`Manifest not found at ${manifestPath}`);
            }
            const manifest = await (0, skill_packager_js_1.loadManifest)(manifestPath);
            await (0, skill_packager_js_1.verifyPackage)(resolvedPackage, manifest);
            console.log(chalk_1.default.green('✓ Package verified successfully'));
            process.exit(0);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to verify package:'), error instanceof Error ? error.message : String(error));
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
        .action(async (pkgPath, options) => {
        const resolvePkgPath = (input) => {
            if (input.startsWith('file://')) {
                return (0, url_1.fileURLToPath)(input);
            }
            return path_1.default.resolve(input);
        };
        try {
            const resolvedPackage = resolvePkgPath(pkgPath);
            const manifestPath = options.manifest !== undefined
                ? path_1.default.resolve(options.manifest)
                : resolvedPackage.replace(/\.tgz$/, '.manifest.json');
            const fsModule = await Promise.resolve().then(() => __importStar(require('fs-extra')));
            const fs = fsModule.default || fsModule;
            if (!(await fs.pathExists(manifestPath))) {
                throw new Error(`Manifest not found at ${manifestPath}`);
            }
            const manifest = await (0, skill_packager_js_1.loadManifest)(manifestPath);
            await (0, skill_packager_js_1.verifyPackage)(resolvedPackage, manifest);
            const installDir = await (0, skill_packager_js_1.installPackage)(resolvedPackage, manifest, {
                targetDir: options.target,
                force: options.force,
            });
            console.log(chalk_1.default.green(`✓ Skill ${manifest.id}@${manifest.version} installed at ${installDir}`));
            await (0, events_js_1.writeEvent)({
                type: 'skill-install',
                id: manifest.id,
                version: manifest.version,
                package: resolvedPackage,
                target: installDir,
            });
            process.exit(0);
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to install package:'), error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
    // New: activate (calls daemon /activate)
    skillsCmd
        .command('activate')
        .description('Activate skills based on intent (via daemon /activate)')
        .requiredOption('--intent <text>', 'Intent text')
        .option('--cwd <path>', '.', 'Working directory')
        .option('--json', 'Print JSON output', false)
        .action(async (options) => {
        try {
            const { post } = await Promise.resolve().then(() => __importStar(require('../lib/http.js')));
            const { writeEvent } = await Promise.resolve().then(() => __importStar(require('../lib/events.js')));
            const t0 = Date.now();
            const { ok, status, json } = await post('/activate', {
                intent: options.intent,
                context: {
                    workingDirectory: options.cwd || process.cwd(),
                    environment: process.env,
                    files: [], // TODO: Add file context if needed
                    userId: 'cli-user',
                    sessionId: `cli-${Date.now()}`
                },
                options: {
                    threshold: 0.6, // Default threshold for skills activation
                    maxResults: 5,
                    includeMetadata: true
                }
            });
            const latency = Date.now() - t0;
            await writeEvent({ type: 'cli-activate', ok, status, latency_ms: latency });
            if (options.json) {
                console.log(JSON.stringify(json, null, 2));
            }
            else {
                if (!ok || !json.success) {
                    console.error('[activate] error', status, json.error?.message || json);
                    process.exit(1);
                }
                console.log('Activated skills:', json.results?.length || 0);
                if (json.results && json.results.length > 0) {
                    json.results.forEach((result, index) => {
                        console.log(`${index + 1}. ${result.skillId}: ${(result.confidence * 100).toFixed(1)}%`);
                        if (result.reason) {
                            console.log(`   Reason: ${result.reason}`);
                        }
                    });
                }
                if (json.metrics) {
                    console.log(`Processing time: ${json.metrics.processingTime}ms`);
                    if (json.metrics.cacheHit !== undefined) {
                        console.log(`Cache hit: ${json.metrics.cacheHit ? 'YES' : 'NO'}`);
                    }
                }
            }
        }
        catch (error) {
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
        .action(async (options) => {
        try {
            const { post } = await Promise.resolve().then(() => __importStar(require('../lib/http.js')));
            const { writeEvent } = await Promise.resolve().then(() => __importStar(require('../lib/events.js')));
            const { ok, status, json } = await post('/execute', {
                skill_id: options.skillId,
                args: {},
                dry_run: !!options.dryRun,
            });
            await writeEvent({ type: 'cli-execute', ok, status });
            if (options.json) {
                console.log(JSON.stringify(json, null, 2));
            }
            else {
                if (!ok) {
                    console.error('[execute] error', status, json);
                    process.exit(1);
                }
                console.log(json.stdout);
                console.log('Latency:', json.run_latency_ms, 'ms');
                console.log('Evidence:', json.evidence_id);
            }
        }
        catch (error) {
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
        .action(async (options) => {
        try {
            console.log(chalk_1.default.blue('Generating skill-rules.json from registry...'));
            const inputPath = (0, path_1.resolve)(options.input || './registry/index.json');
            const outputPath = (0, path_1.resolve)(options.output || './configs/skill-rules.json');
            const fsModule = await Promise.resolve().then(() => __importStar(require('fs-extra')));
            const fs = fsModule.default || fsModule;
            const { pathExists, readJson, ensureDir, writeJson } = fs;
            if (!(await pathExists(inputPath))) {
                console.error(chalk_1.default.red(`Registry not found: ${inputPath}. Run "skills index" first.`));
                process.exit(2);
            }
            const registry = (await readJson(inputPath));
            // Convert registry to skill-rules format
            const rules = {};
            for (const skill of registry.skills) {
                // Determine type and enforcement from skill metadata
                // Default mapping (can be enhanced with metadata fields)
                const type = skill.severity === 'critical' ? 'guardrail' : 'guideline';
                const enforcement = skill.severity === 'critical'
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
                    console.log(chalk_1.default.green(`✓ Generated rule for: ${skill.name}`));
                }
            }
            // Ensure output directory exists
            await ensureDir((0, path_1.resolve)(outputPath, '..'));
            // Write skill-rules.json
            await writeJson(outputPath, rules, { spaces: 2 });
            console.log(chalk_1.default.green(`✅ Generated ${Object.keys(rules).length} skill rule(s)`));
            console.log(chalk_1.default.blue(`Rules written to: ${outputPath}`));
            process.exit(0);
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error generating rules: ${error instanceof Error ? error.message : String(error)}`));
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
        .action(async (intent, options) => {
        try {
            console.log(chalk_1.default.blue(`Checking intent: "${intent}"`));
            // Load registry and match skills
            const registryPath = (0, path_1.resolve)(process.cwd(), 'registry', 'index.json');
            const fsModule = await Promise.resolve().then(() => __importStar(require('fs-extra')));
            const fs = fsModule.default || fsModule;
            const { pathExists, readJson } = fs;
            if (!(await pathExists(registryPath))) {
                console.error(chalk_1.default.red('Registry not found. Run "skills index" first.'));
                process.exit(2);
            }
            const registry = (await readJson(registryPath));
            const lowerIntent = intent.toLowerCase();
            // Enhanced matching with scoring
            const matches = [];
            for (const skill of registry.skills) {
                const keywords = skill.triggers?.keywords || [];
                const intentPatterns = skill.triggers?.intentPatterns || [];
                const pathPatterns = skill.triggers?.pathPatterns || [];
                let score = 0;
                const matchedKeywords = [];
                // Keyword matching (basic scoring)
                const keywordMatches = keywords.filter(keyword => lowerIntent.includes(keyword.toLowerCase()));
                if (keywordMatches.length > 0) {
                    score += 0.4;
                    matchedKeywords.push(...keywordMatches);
                }
                // Intent pattern matching
                const intentMatches = intentPatterns.filter(pattern => {
                    try {
                        return new RegExp(pattern, 'i').test(intent);
                    }
                    catch {
                        return false;
                    }
                });
                if (intentMatches.length > 0) {
                    score += 0.4;
                }
                // Path pattern matching (if open files provided)
                if (options.openFiles && pathPatterns.length > 0) {
                    const pathMatches = pathPatterns.filter(pattern => options.openFiles.some(file => {
                        // Simple glob matching
                        const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]+');
                        return new RegExp(regex).test(file);
                    }));
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
                console.log(chalk_1.default.yellow('⚠️  No matching skills found'));
                if (options.verbose && matches.length > 0) {
                    console.log(chalk_1.default.gray(`\nFound ${matches.length} potential match(es) below threshold:`));
                    matches.slice(0, 5).forEach(m => {
                        console.log(chalk_1.default.gray(`  ${m.skill.name}: ${(m.score * 100).toFixed(1)}%`));
                    });
                }
                process.exit(0);
            }
            console.log(chalk_1.default.green(`\n✅ Found ${filteredMatches.length} matching skill(s):`));
            filteredMatches.forEach(({ skill, score, matchedKeywords }) => {
                console.log(chalk_1.default.green(`  ✓ ${skill.name} (${(score * 100).toFixed(1)}%)`));
                if (options.verbose) {
                    if (matchedKeywords.length > 0) {
                        console.log(chalk_1.default.gray(`    → Matched keywords: ${matchedKeywords.slice(0, 3).join(', ')}`));
                    }
                    if (skill.description) {
                        console.log(chalk_1.default.gray(`    → ${skill.description.substring(0, 80)}...`));
                    }
                    if (skill.severity) {
                        const severityColor = skill.severity === 'critical'
                            ? chalk_1.default.red
                            : skill.severity === 'high'
                                ? chalk_1.default.yellow
                                : chalk_1.default.blue;
                        console.log(severityColor(`    → Severity: ${skill.severity}`));
                    }
                }
            });
            // Enhanced analysis with Prompt Builder v2 if requested
            if (options.v2) {
                console.log(chalk_1.default.blue('\n🔍 Enhanced analysis with Prompt Builder v2:'));
                try {
                    const optimizedPrompt = await (0, prompt_builder_v2_js_1.buildOptimizedPromptV2)({
                        description: intent,
                        skillIds: matches.map(m => m.skill.name),
                        includeTemplate: true,
                        includeTags: true,
                        complexity: 'medium',
                        cwd: process.cwd(),
                    });
                    console.log(chalk_1.default.cyan(`  📊 Expected score: ${optimizedPrompt.expectedScore.toFixed(1)}`));
                    console.log(chalk_1.default.cyan(`  🏷️  TAGs coverage: ${((optimizedPrompt.tagsCoverage || 0) * 100).toFixed(0)}%`));
                    console.log(chalk_1.default.cyan(`  🔗 Template coverage: ${((optimizedPrompt.templateScore || 0) * 100).toFixed(0)}%`));
                    if (optimizedPrompt.signals.tags && optimizedPrompt.signals.tags.length > 0) {
                        console.log(chalk_1.default.gray(`  📋 Relevant tags: ${optimizedPrompt.signals.tags.slice(0, 5).join(', ')}`));
                    }
                    if (optimizedPrompt.skillActivation.length > 0) {
                        console.log(chalk_1.default.gray(`  ⚡ Skill activations: ${optimizedPrompt.skillActivation.slice(0, 3).map(s => s.skillId).join(', ')}`));
                    }
                }
                catch (error) {
                    console.log(chalk_1.default.yellow(`  ⚠️  Enhanced analysis failed: ${error instanceof Error ? error.message : String(error)}`));
                }
            }
            process.exit(0);
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error checking intent: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(2);
        }
    });
    skillsCmd
        .command('confirm')
        .description('Confirm a write-safe (S1) challenge for a skill')
        .requiredOption('--challenge <id>', 'Challenge identifier returned by /execute preflight')
        .option('--nonce <value>', 'Nonce returned when CONFIRM_TEST_EXPOSE_NONCE=true (dev only)')
        .option('--cwd <path>', 'Working directory', '.')
        .option('--skill-id <id>', 'Skill id to confirm (defaults to policy-s1 example)', 'policy-s1')
        .option('--json', 'Print JSON response', false)
        .action(async (options) => {
        try {
            const secret = process.env.CONFIRM_SECRET || '';
            if (!secret) {
                console.error(chalk_1.default.red('CONFIRM_SECRET is required to generate confirm tokens.'));
                process.exit(2);
            }
            const nonce = options.nonce || '';
            const tokenArgs = ['scripts/make-confirm-token.mjs', options.challenge];
            if (nonce)
                tokenArgs.push(nonce);
            const { execFile } = await Promise.resolve().then(() => __importStar(require('node:child_process')));
            const { promisify } = await Promise.resolve().then(() => __importStar(require('node:util')));
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
            let json = {};
            let ok = false;
            if (process.env.SF_CONFIRM_INLINE === 'true') {
                const { inlineExecute, inlineClose, seedInlineChallenge } = await Promise.resolve().then(() => __importStar(require('../lib/inline-execute.js')));
                if (process.env.SF_CONFIRM_INLINE_SEED) {
                    try {
                        const seedData = JSON.parse(process.env.SF_CONFIRM_INLINE_SEED);
                        await seedInlineChallenge(seedData);
                    }
                    catch (error) {
                        console.warn('Failed to parse SF_CONFIRM_INLINE_SEED:', error);
                    }
                }
                const response = await inlineExecute(confirmBody);
                status = response.statusCode;
                json = await response.json();
                ok = status >= 200 && status < 300;
                await inlineClose();
            }
            else {
                const { post } = await Promise.resolve().then(() => __importStar(require('../lib/http.js')));
                const result = await post('/execute', confirmBody);
                ok = result.ok;
                status = result.status;
                json = result.json;
            }
            await (0, events_js_1.writeEvent)({
                type: 'cli-confirm',
                ok,
                status,
                challenge_id: options.challenge,
                nonce: nonce || undefined,
            });
            if (!ok) {
                console.error(chalk_1.default.red('confirm failed'), status, json);
                process.exit(typeof status === 'number' ? status : 1);
            }
            if (options.json) {
                console.log(JSON.stringify(json, null, 2));
            }
            else {
                console.log(chalk_1.default.green('✓ Confirmed challenge'));
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
        }
        catch (error) {
            console.error('confirm failed:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
}
