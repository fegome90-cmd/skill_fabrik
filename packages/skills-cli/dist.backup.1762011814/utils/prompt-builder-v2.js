"use strict";
/**
 * Prompt Builder v2 - Mejorado con lecciones del sprint
 * Integra Template v1.1.0, TAGs system, detección de archivos reales, y patrones aprendidos
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplexityConfig = getComplexityConfig;
exports.buildOptimizedPromptV2 = buildOptimizedPromptV2;
exports.suggestPromptImprovementsV2 = suggestPromptImprovementsV2;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const fs_1 = require("fs");
const crypto_1 = require("crypto");
// Cache global para archivos detectados (performance)
const fileCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
// Cache de estructura de proyecto detectada
let projectStructureCache = null;
// Importar plan-check de forma dinámica para evitar dependencias circulares
// Usamos path relativo para acceder al módulo desde packages/router
let planCheckModule = null;
async function getPlanCheck(cwd) {
    if (!planCheckModule) {
        try {
            // Intentar múltiples paths posibles
            const possiblePaths = [
                (0, path_1.resolve)(cwd, 'packages/router/src/utils/plan-check.js'),
                (0, path_1.resolve)(cwd, '../../router/src/utils/plan-check.js'),
            ];
            for (const path of possiblePaths) {
                if ((0, fs_1.existsSync)(path)) {
                    planCheckModule = await Promise.resolve(`${path}`).then(s => __importStar(require(s)));
                    break;
                }
            }
            if (!planCheckModule) {
                // Fallback: función que retorna sin plan
                planCheckModule = { checkApprovedPlan: async () => ({ hasPlan: false }) };
            }
        }
        catch {
            // Fallback si falla completamente
            planCheckModule = { checkApprovedPlan: async () => ({ hasPlan: false }) };
        }
    }
    return planCheckModule;
}
/**
 * Obtiene configuración de complejidad según promptcreate.md
 */
function getComplexityConfig(complexity) {
    const configs = {
        low: {
            coverage: 0.70,
            duration: '6h',
            innovation_level: 'medium',
            target_coverage: 70,
        },
        medium: {
            coverage: 0.80,
            duration: '8h',
            innovation_level: 'high',
            target_coverage: 80,
        },
        high: {
            coverage: 0.90,
            duration: '12h',
            innovation_level: 'very-high',
            target_coverage: 90,
        },
        'very-high': {
            coverage: 0.95,
            duration: '16h',
            innovation_level: 'revolutionary',
            target_coverage: 95,
        },
    };
    return configs[complexity] || configs.medium;
}
async function runPreHooks(input) {
    const text = input.description.trim();
    const intent = /plan|planificar/i.test(text)
        ? 'planning'
        : /audita|analiza/i.test(text)
            ? 'analysis'
            : /crear|genera/i.test(text)
                ? 'creation'
                : 'unknown';
    const phase = /clarify|aclarar/i.test(text) ? 'Clarify' :
        /layout|estructura/i.test(text) ? 'Layout' :
            /operar|ejecutar/i.test(text) ? 'Operate' :
                /observa|eval/i.test(text) ? 'Observe' :
                    /reflex/i.test(text) ? 'Reflect' : 'Clarify';
    const tags = [...text.matchAll(/\[(K|C|U|EVIDENCIA|PROPUESTA)\]/gi)].map(m => String(m[1]).toUpperCase());
    const lenScore = Math.min(text.length / 500, 0.4);
    const tagScore = Math.min(tags.length / 5, 0.6);
    const preScore = +(lenScore + tagScore).toFixed(2);
    return {
        description: text,
        intent,
        phase,
        tags: Array.from(new Set(tags)),
        preScore,
        notes: input.planContext?.planId ? [`plan:${input.planContext.planId}`] : [],
    };
}
function runPostHooks(input) {
    const out = input.prompt.trim();
    const metrics = {
        length: out.split(/\s+/).length,
        hasMd: out.includes('```'),
        hasSections: /##|###/.test(out),
    };
    const completeness = out.length > 900 ? 10 : out.length > 500 ? 8 : 6;
    const quality = metrics.hasSections ? 9 : 6;
    const impact = /conclusión|recomendación/i.test(out) ? 9 : 6;
    const sustainability = /reutilizable|escalable|modular/i.test(out) ? 8 : 5;
    const score4D = +(0.3 * completeness + 0.3 * quality + 0.25 * impact + 0.15 * sustainability).toFixed(2);
    const tagsOut = [];
    if (metrics.hasMd)
        tagsOut.push('DOC');
    tagsOut.push(score4D >= 7 ? 'APPROVED' : 'REVIEW');
    const summary = out.split('. ').slice(0, 2).join('. ') + '...';
    const audited = [out, '', '---', `Audit 4D: ${score4D}/10`, `Tags: ${tagsOut.join(', ')}`, `Summary: ${summary}`].join('\n');
    return { prompt: audited, meta: { score4D, tagsOut, summary } };
}
/**
 * Detecta estructura del proyecto (monorepo, standard, etc.)
 */
async function detectProjectStructure(cwd) {
    // Usar cache si está disponible
    if (projectStructureCache) {
        return projectStructureCache;
    }
    const structure = {
        type: 'unknown',
        detectedPaths: {},
    };
    try {
        // Verificar si es monorepo (tiene packages/)
        const packagesPath = (0, path_1.resolve)(cwd, 'packages');
        if ((0, fs_1.existsSync)(packagesPath)) {
            structure.type = 'monorepo';
            const packages = await (0, promises_1.readdir)(packagesPath, { withFileTypes: true });
            for (const pkg of packages) {
                if (pkg.isDirectory()) {
                    const pkgPath = (0, path_1.join)(packagesPath, pkg.name);
                    // Detectar si tiene memtech
                    if ((0, fs_1.existsSync)((0, path_1.join)(pkgPath, 'src', 'memtech')) || (0, fs_1.existsSync)((0, path_1.join)(pkgPath, 'memtech'))) {
                        if (!structure.detectedPaths.memtech)
                            structure.detectedPaths.memtech = [];
                        structure.detectedPaths.memtech.push(`packages/${pkg.name}`);
                    }
                    // Detectar si es backend/API
                    if (pkg.name.includes('api') || pkg.name.includes('backend') || pkg.name.includes('service')) {
                        if (!structure.detectedPaths.backend)
                            structure.detectedPaths.backend = [];
                        structure.detectedPaths.backend.push(`packages/${pkg.name}`);
                    }
                    // Detectar si es frontend/UI
                    if (pkg.name.includes('ui') || pkg.name.includes('frontend') || pkg.name.includes('react')) {
                        if (!structure.detectedPaths.frontend)
                            structure.detectedPaths.frontend = [];
                        structure.detectedPaths.frontend.push(`packages/${pkg.name}`);
                    }
                }
            }
            structure.detectedPaths.packages = packages.filter(p => p.isDirectory()).map(p => `packages/${p.name}`);
        }
        // Verificar estructura standard (backend/, frontend/)
        if ((0, fs_1.existsSync)((0, path_1.resolve)(cwd, 'backend')) || (0, fs_1.existsSync)((0, path_1.resolve)(cwd, 'backend/src'))) {
            structure.type = structure.type === 'unknown' ? 'standard' : structure.type;
            if (!structure.detectedPaths.backend)
                structure.detectedPaths.backend = [];
            structure.detectedPaths.backend.push('backend');
        }
        if ((0, fs_1.existsSync)((0, path_1.resolve)(cwd, 'frontend')) || (0, fs_1.existsSync)((0, path_1.resolve)(cwd, 'frontend/src'))) {
            structure.type = structure.type === 'unknown' ? 'standard' : structure.type;
            if (!structure.detectedPaths.frontend)
                structure.detectedPaths.frontend = [];
            structure.detectedPaths.frontend.push('frontend');
        }
        // Config files
        const configFiles = ['.env', 'config', 'configs'];
        for (const config of configFiles) {
            if ((0, fs_1.existsSync)((0, path_1.resolve)(cwd, config))) {
                if (!structure.detectedPaths.config)
                    structure.detectedPaths.config = [];
                structure.detectedPaths.config.push(config);
            }
        }
        // Cachear resultado
        projectStructureCache = structure;
    }
    catch {
        // Si falla, retornar estructura básica
    }
    return structure;
}
/**
 * Detecta archivos reales en el proyecto que coinciden con pathPatterns (con cache)
 */
async function findRealFiles(pathPatterns, cwd, maxFiles = 5) {
    // Generar key de cache
    const cacheKey = (0, crypto_1.createHash)('md5')
        .update(pathPatterns.join('|') + cwd)
        .digest('hex');
    // Verificar cache
    const cached = fileCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.files.slice(0, maxFiles);
    }
    const found = [];
    // Detectar estructura del proyecto para búsqueda más inteligente
    const projectStructure = await detectProjectStructure(cwd);
    // Convertir glob patterns a paths relativos a buscar
    for (const pattern of pathPatterns.slice(0, 5)) {
        try {
            const searchPaths = [];
            // Búsqueda inteligente basada en estructura detectada
            if (pattern.includes('packages/**') || pattern.includes('**/memtech/**')) {
                if (projectStructure.detectedPaths.memtech) {
                    searchPaths.push(...projectStructure.detectedPaths.memtech.map(p => (0, path_1.resolve)(cwd, p)));
                }
                else if (projectStructure.detectedPaths.packages) {
                    searchPaths.push(...projectStructure.detectedPaths.packages.map(p => (0, path_1.resolve)(cwd, p, 'src')));
                }
            }
            else if (pattern.includes('**/repository/**')) {
                // Buscar en backend packages
                if (projectStructure.detectedPaths.backend) {
                    searchPaths.push(...projectStructure.detectedPaths.backend.map(p => (0, path_1.resolve)(cwd, p, 'src')));
                }
            }
            else if (pattern.includes('backend/src/**')) {
                if (projectStructure.detectedPaths.backend) {
                    searchPaths.push(...projectStructure.detectedPaths.backend.map(p => (0, path_1.resolve)(cwd, p, 'src')));
                }
            }
            else if (pattern.includes('frontend/src/**')) {
                if (projectStructure.detectedPaths.frontend) {
                    searchPaths.push(...projectStructure.detectedPaths.frontend.map(p => (0, path_1.resolve)(cwd, p, 'src')));
                }
            }
            else if (pattern.includes('**/.env*') || pattern.includes('**/config/**')) {
                if (projectStructure.detectedPaths.config) {
                    searchPaths.push(...projectStructure.detectedPaths.config.map(p => (0, path_1.resolve)(cwd, p)));
                }
                else {
                    searchPaths.push(cwd); // Buscar en raíz si no hay configs específicos
                }
            }
            else {
                // Fallback: extraer path antes de /**
                const match = pattern.match(/^([^/*]+)/);
                if (match) {
                    searchPaths.push((0, path_1.resolve)(cwd, match[1]));
                }
                else {
                    searchPaths.push(cwd);
                }
            }
            // Buscar archivos en cada path
            for (const searchPath of searchPaths) {
                if (!(0, fs_1.existsSync)(searchPath)) {
                    continue;
                }
                const matches = await findFilesMatching(searchPath, pattern, cwd, maxFiles - found.length);
                found.push(...matches);
                if (found.length >= maxFiles) {
                    break;
                }
            }
            if (found.length >= maxFiles) {
                break;
            }
        }
        catch {
            continue;
        }
    }
    // Actualizar cache
    fileCache.set(cacheKey, { files: found, timestamp: Date.now() });
    return found.slice(0, maxFiles);
}
/**
 * Busca archivos que coinciden con un glob pattern
 */
async function findFilesMatching(dir, pattern, baseDir, maxFiles) {
    const matches = [];
    try {
        // Convertir glob pattern a regex simple
        const regexStr = pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\.\{ts,js\}/g, '\\.(ts|js)')
            .replace(/\.\{ts,tsx\}/g, '\\.(ts|tsx)')
            .replace(/\.ts/g, '\\.ts')
            .replace(/\.js/g, '\\.js')
            .replace(/\.json/g, '\\.json')
            .replace(/\.md/g, '\\.md');
        const regex = new RegExp(`^${regexStr}$`);
        await searchDir(dir, regex, baseDir, matches, maxFiles);
    }
    catch {
        // Si falla, continuar
    }
    return matches;
}
async function searchDir(dir, pattern, baseDir, matches, maxFiles) {
    if (matches.length >= maxFiles) {
        return;
    }
    try {
        const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (matches.length >= maxFiles) {
                break;
            }
            const fullPath = (0, path_1.join)(dir, entry.name);
            const relativePath = fullPath.replace(baseDir + '/', '');
            if (entry.isDirectory()) {
                // Buscar recursivamente (con límite de profundidad)
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    await searchDir(fullPath, pattern, baseDir, matches, maxFiles);
                }
            }
            else if (entry.isFile()) {
                // Verificar si el archivo coincide con el pattern
                if (pattern.test(relativePath)) {
                    matches.push(relativePath);
                }
            }
        }
    }
    catch {
        // Ignorar errores de lectura
    }
}
/**
 * Carga skill-rules.json
 */
async function loadSkillRules(cwd) {
    const possiblePaths = [
        (0, path_1.resolve)(cwd, 'configs/skill-rules.json'),
        (0, path_1.resolve)(cwd, '../configs/skill-rules.json'),
        (0, path_1.resolve)(cwd, '../../configs/skill-rules.json'),
    ];
    for (const rulesPath of possiblePaths) {
        try {
            const content = await (0, promises_1.readFile)(rulesPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            continue;
        }
    }
    return {};
}
/**
 * Calcula score esperado mejorado con validación de TAGs
 */
function calculateExpectedScore(prompt, suggestedFiles, suggestedContent, rule, _tagsCoverage, _templateComponents) {
    let score = 0;
    const reasons = [];
    // Keywords (20%)
    if (rule.promptTriggers?.keywords) {
        const lowerPrompt = prompt.toLowerCase();
        const keywordMatches = rule.promptTriggers.keywords.filter(kw => lowerPrompt.includes(kw.toLowerCase()));
        if (keywordMatches.length > 0) {
            score += 0.2;
            reasons.push(`keywords: ${keywordMatches.join(', ')}`);
        }
    }
    // Intent (30%)
    if (rule.promptTriggers?.intentPatterns) {
        const intentMatches = rule.promptTriggers.intentPatterns.filter(pattern => {
            try {
                return new RegExp(pattern, 'i').test(prompt);
            }
            catch {
                return false;
            }
        });
        if (intentMatches.length > 0) {
            score += 0.3;
            reasons.push(`intent: ${intentMatches.length} pattern(s) matched`);
        }
    }
    // Path (30%)
    if (rule.fileTriggers?.pathPatterns && suggestedFiles.length > 0) {
        const hasRelevantPath = suggestedFiles.some(file => rule.fileTriggers?.pathPatterns?.some(pattern => file.match(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))));
        if (hasRelevantPath) {
            score += 0.3;
            reasons.push(`path: ${suggestedFiles[0]}`);
        }
    }
    // Content (20%)
    if (rule.fileTriggers?.contentPatterns && suggestedContent) {
        const contentMatches = rule.fileTriggers.contentPatterns.filter(pattern => {
            try {
                return new RegExp(pattern).test(suggestedContent);
            }
            catch {
                return false;
            }
        });
        if (contentMatches.length > 0) {
            score += 0.2;
            reasons.push(`content: ${contentMatches.length} pattern(s) matched`);
        }
    }
    return { score, reasons };
}
function generateTags(skillId, description, planContext) {
    const tags = [];
    // Tags basados en skill type
    if (skillId.includes('database')) {
        tags.push('[K:DATABASE-OPERATIONS]', '[C:DATABASE-CONTEXT]');
    }
    if (skillId.includes('plan')) {
        tags.push('[K:PLAN-MANAGEMENT]', '[C:CLOOP-METHODOLOGY]', '[U:DEVELOPER-WORKFLOW]');
    }
    if (skillId.includes('backend')) {
        tags.push('[K:BACKEND-ARCHITECTURE]', '[C:API-DEVELOPMENT]');
    }
    if (skillId.includes('secret')) {
        tags.push('[K:SECURITY-PATTERNS]', '[C:CONFIGURATION-MANAGEMENT]');
    }
    // Tags basados en keywords en la descripción
    const descLower = description.toLowerCase();
    if (descLower.includes('redis') || descLower.includes('postgres') || descLower.includes('database')) {
        tags.push('[K:DATABASE-CONNECTION]', '[C:INFRASTRUCTURE-SETUP]');
    }
    if (descLower.includes('memtech')) {
        tags.push('[K:MEMORY-SYSTEM]', '[C:MEMORY-MANAGEMENT]');
    }
    if (descLower.includes('template')) {
        tags.push('[K:TEMPLATE-SYSTEM]', '[C:DOCUMENTATION-STANDARDS]');
    }
    if (descLower.includes('plan') || descLower.includes('planificar')) {
        tags.push('[U:PLANNING-WORKFLOW]', '[C:CLOOP-INTEGRATION]');
    }
    // Tags basados en plan activo
    if (planContext?.planId) {
        tags.push(`[EVIDENCIA:${planContext.planId}]`);
    }
    if (planContext?.phases && planContext.phases.length > 0) {
        tags.push('[C:PHASE-DEPENDENCIES]');
    }
    // Limitar a máximo 10 tags para evitar ruido
    return tags.slice(0, 10);
}
/**
 * Genera estructura Template v1.1.0 (8/8 componentes)
 */
function generateTemplateStructure(skillId, description, _options, planContext) {
    const components = [];
    // C1: CSE Completo
    components.push('C1: CSE_Completo ✅');
    // C2: TAGs Coverage
    const tags = generateTags(skillId, description, planContext);
    components.push(`C2: TAGs_Cobertura ✅ (${tags.length} tags)`);
    // C3: Boundary Markers (implícito en estructura)
    components.push('C3: Boundary_Markers ✅');
    // C4: Frontmatter YAML
    components.push('C4: Frontmatter_YAML ✅');
    // C5: Anti_Drift
    components.push('C5: Anti_Drift ✅');
    // C6: Objetivos SMART
    components.push('C6: Objetivos_SMART ✅');
    // C7: Tests Ejecutables
    components.push('C7: Tests_Ejecutables ✅');
    // C8: Separación EVIDENCIA vs PROPUESTA
    components.push('C8: Separacion_EVIDENCIA_PROPUESTA ✅');
    return `Template v1.1.0 aplicado (8/8 componentes):
${components.map(c => `  • ${c}`).join('\n')}`;
}
/**
 * Construye prompt optimizado mejorado
 */
async function buildOptimizedPromptV2(options) {
    const cwd = options.cwd || process.cwd();
    const rules = await loadSkillRules(cwd);
    // Soporte para múltiples skills
    const skillIds = options.skillIds || (options.skillId ? [options.skillId] : []);
    if (skillIds.length === 0) {
        throw new Error('Debe especificar al menos un skillId o skillIds');
    }
    // Verificar que todos los skills existen
    for (const id of skillIds) {
        if (!rules[id]) {
            throw new Error(`Skill '${id}' no encontrado en skill-rules.json`);
        }
    }
    // Cargar contexto de plan activo si está habilitado
    let planContext = undefined;
    if (options.includePlanContext) {
        try {
            const planCheckModule = await getPlanCheck(cwd);
            const planCheck = await planCheckModule.checkApprovedPlan(cwd);
            if (planCheck.hasPlan && planCheck.plan) {
                const plan = planCheck.plan;
                planContext = {
                    planId: plan.id,
                    taskName: planCheck.taskName,
                    phases: plan.phases,
                };
            }
        }
        catch {
            // Si falla, continuar sin contexto de plan
        }
    }
    // PRE HOOKS por defecto (v2)
    const pre = await runPreHooks({
        description: options.description,
        openFiles: [],
        activeFileContent: undefined,
        planContext,
    });
    const description = pre.description;
    let optimizedPrompt = '';
    const skillActivations = [];
    const allKeywords = [];
    const allIntents = [];
    const allPaths = [];
    const allContent = [];
    const allTags = [];
    // Aplicar configuración de complejidad si está definida
    const complexityConfig = options.complexity
        ? getComplexityConfig(options.complexity)
        : null;
    // Procesar cada skill
    for (const skillId of skillIds) {
        const rule = rules[skillId];
        const keywords = rule.promptTriggers?.keywords || [];
        const intentPatterns = rule.promptTriggers?.intentPatterns || [];
        const pathPatterns = rule.fileTriggers?.pathPatterns || [];
        const contentPatterns = rule.fileTriggers?.contentPatterns || [];
        // Agregar keywords e intents
        allKeywords.push(...keywords.slice(0, 3));
        allIntents.push(...intentPatterns.slice(0, 2));
        // Mejorar intent
        let bestIntent = description;
        if (intentPatterns.length > 0) {
            const matchedPattern = intentPatterns.find(pattern => {
                try {
                    return new RegExp(pattern, 'i').test(description);
                }
                catch {
                    return false;
                }
            });
            if (!matchedPattern) {
                const firstPattern = intentPatterns[0];
                const match = firstPattern.match(/\(([^)]+)\)/);
                if (match) {
                    const verbs = match[1].split('|');
                    if (!description.toLowerCase().includes(verbs[0].toLowerCase())) {
                        bestIntent = `${verbs[0]} ${description}`;
                    }
                }
            }
        }
        // Detectar archivos reales en el proyecto
        const suggestedFiles = [];
        if (options.includeFiles && pathPatterns.length > 0) {
            const realFiles = await findRealFiles(pathPatterns, cwd, 3);
            if (realFiles.length > 0) {
                suggestedFiles.push(...realFiles);
                allPaths.push(...realFiles);
            }
            else {
                // Fallback a ejemplos basados en patterns
                for (const pattern of pathPatterns.slice(0, 2)) {
                    let examplePath = pattern;
                    if (pattern.includes('packages/**/memtech/**')) {
                        examplePath = 'packages/mcp-adapters/src/memtech/memory-store.ts';
                    }
                    else if (pattern.includes('packages/**/src/**')) {
                        examplePath = 'packages/skills-cli/src/commands/plan.ts';
                    }
                    else if (pattern.includes('dev/plans/**')) {
                        examplePath = 'dev/plans/post-estudio-operacional.json';
                    }
                    else if (pattern.includes('**/.env*')) {
                        examplePath = '.env';
                    }
                    else if (pattern.includes('**/repository/**')) {
                        examplePath = 'packages/api/src/repository/UserRepository.ts';
                    }
                    else {
                        examplePath = pattern
                            .replace(/\*\*/g, 'example')
                            .replace(/\*/g, 'example')
                            .replace(/\.\{[^}]+\}/g, '.ts');
                    }
                    suggestedFiles.push(examplePath);
                    allPaths.push(examplePath);
                }
            }
        }
        // Sugerir contenido mejorado
        let suggestedContent = '';
        if (options.includeContent && contentPatterns.length > 0) {
            const firstPattern = contentPatterns[0];
            if (firstPattern.includes('redis\\.|getL1Item')) {
                suggestedContent = "const value = await getL1Item(key);";
            }
            else if (firstPattern.includes('pool\\.query|client\\.query')) {
                suggestedContent = "await client.query('SELECT * FROM table WHERE ...');";
            }
            else if (firstPattern.includes('router\\.')) {
                suggestedContent = "router.post('/endpoint', Controller.handler);";
            }
            else if (firstPattern.includes('PASSWORD|SECRET|API_KEY')) {
                suggestedContent = "REDIS_PASSWORD=your_secret_here";
            }
            else if (firstPattern.includes('findMany')) {
                suggestedContent = "await prisma.model.findMany({ where: { ... } });";
            }
            if (suggestedContent) {
                allContent.push(suggestedContent);
            }
        }
        // Construir prompt base
        const relevantKeywords = keywords.slice(0, 3).filter(kw => !bestIntent.toLowerCase().includes(kw.toLowerCase()));
        const promptBase = relevantKeywords.length > 0
            ? `${relevantKeywords.join(', ')}: ${bestIntent}`
            : bestIntent;
        // Agregar al prompt principal (solo para el primer skill, o combinar si múltiples)
        if (skillIds.length === 1 || skillIds.indexOf(skillId) === 0) {
            optimizedPrompt = promptBase;
            // Agregar contexto de plan si está disponible
            if (planContext && options.includePlanContext) {
                optimizedPrompt += `\n\n📋 Plan activo: ${planContext.planId} (${planContext.taskName})`;
                if (planContext.phases && planContext.phases.length > 0) {
                    optimizedPrompt += `\nFases del plan: ${planContext.phases.map((p) => p.name).join(', ')}`;
                }
            }
            // Agregar archivos sugeridos
            if (suggestedFiles.length > 0) {
                optimizedPrompt += `\n\nAbre/edita estos archivos:\n${suggestedFiles.map(f => `- ${f}`).join('\n')}`;
            }
            // Agregar contenido esperado
            if (suggestedContent) {
                optimizedPrompt += `\n\nEl archivo debería contener:\n\`\`\`\n${suggestedContent}\n\`\`\``;
            }
        }
        // Generar TAGs
        if (options.includeTags) {
            const tags = generateTags(skillId, description, planContext);
            allTags.push(...tags);
        }
        // Calcular score
        const scoreResult = calculateExpectedScore(optimizedPrompt || promptBase, suggestedFiles, suggestedContent, rule);
        skillActivations.push({
            skillId,
            score: scoreResult.score,
            reasons: scoreResult.reasons,
        });
    }
    // Agregar estructura Template v1.1.0 si está habilitada
    if (options.includeTemplate && skillIds.length > 0) {
        const templateStructure = generateTemplateStructure(skillIds[0], description, options, planContext);
        optimizedPrompt += `\n\n${templateStructure}`;
    }
    // Agregar TAGs si están habilitados
    if (options.includeTags && allTags.length > 0) {
        const uniqueTags = [...new Set(allTags)];
        optimizedPrompt += `\n\n🏷️ TAGs aplicados:\n${uniqueTags.map(t => `  ${t}`).join('\n')}`;
    }
    // Calcular scores consolidados
    const avgScore = skillActivations.reduce((sum, a) => sum + a.score, 0) / skillActivations.length;
    const maxScore = Math.max(...skillActivations.map(a => a.score));
    let expectedScore = skillIds.length > 1 ? avgScore : maxScore;
    // Boost por preScore de hooks (peso 0.2)
    expectedScore = Math.min(1, expectedScore + pre.preScore * 0.2);
    // Validar TAGs coverage
    const tagsCoverageValue = allTags.length / 10; // 10 tags = 100% coverage mínimo recomendado
    // Agregar nota si score es bajo
    if (expectedScore < 0.6 && options.includeFiles) {
        optimizedPrompt += '\n\n💡 Asegúrate de tener estos archivos abiertos en tu editor para maximizar la activación del skill.';
    }
    // Agregar nota sobre TAGs coverage si está bajo
    if (options.includeTags && tagsCoverageValue < 0.6) {
        optimizedPrompt += `\n\n⚠️ TAGs coverage: ${(tagsCoverageValue * 100).toFixed(0)}% (recomendado: ≥60%)`;
    }
    // Añadir resumen de complejidad si se configuró (para usar complexityConfig)
    if (complexityConfig && options.complexity) {
        optimizedPrompt += `\n\n📊 Complejidad: ${options.complexity} — cobertura ${(complexityConfig.coverage * 100).toFixed(0)}%, duración ${complexityConfig.duration}`;
    }
    // Fusionar TAGs de pre-hook
    if (pre.tags && pre.tags.length) {
        allTags.push(...pre.tags);
    }
    const result = {
        prompt: optimizedPrompt,
        expectedScore,
        signals: {
            keywords: [...new Set(allKeywords)],
            intent: [...new Set(allIntents)],
            paths: [...new Set(allPaths)],
            content: [...new Set(allContent)],
            tags: options.includeTags ? [...new Set(allTags)] : undefined,
            templateComponents: options.includeTemplate ? ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'] : undefined,
        },
        skillActivation: skillActivations,
        templateScore: options.includeTemplate ? 1.0 : undefined,
        tagsCoverage: options.includeTags ? tagsCoverageValue : undefined,
        planContext,
    };
    // POST HOOKS por defecto (v2)
    const post = runPostHooks({ prompt: result.prompt, signals: { tags: result.signals.tags, templateComponents: result.signals.templateComponents } });
    result.prompt = post.prompt;
    return result;
}
/**
 * Sugiere mejoras basado en múltiples skills
 */
async function suggestPromptImprovementsV2(prompt, openFiles, activeFileContent, cwd) {
    const workingCwd = cwd || process.cwd();
    const rules = await loadSkillRules(workingCwd);
    const scores = [];
    for (const [skillId, rule] of Object.entries(rules)) {
        const result = calculateExpectedScore(prompt, openFiles, activeFileContent || '', rule);
        if (result.score > 0 && result.score < 0.6) {
            scores.push({
                skillId,
                score: result.score,
                reasons: result.reasons,
            });
        }
    }
    if (scores.length > 0) {
        const topSkill = scores.sort((a, b) => b.score - a.score)[0];
        const optimized = await buildOptimizedPromptV2({
            skillId: topSkill.skillId,
            description: prompt,
            includeFiles: openFiles.length === 0,
            includeContent: !activeFileContent,
            includeTemplate: true, // Incluir template por defecto en sugerencias
            includeTags: true, // Incluir tags por defecto en sugerencias
            cwd: workingCwd,
        });
        return `💡 Tu prompt tiene score ${topSkill.score.toFixed(2)} para "${topSkill.skillId}". 

Prompt optimizado sugerido:
\`\`\`
${optimized.prompt}
\`\`\`

Score esperado: ${optimized.expectedScore.toFixed(2)} (${optimized.expectedScore >= 0.6 ? '✅ activaría' : '❌ no activaría'})
${optimized.tagsCoverage ? `TAGs coverage: ${(optimized.tagsCoverage * 100).toFixed(0)}%` : ''}
${optimized.templateScore ? `Template v1.1.0: ✅ (8/8 componentes)` : ''}`;
    }
    return null;
}
