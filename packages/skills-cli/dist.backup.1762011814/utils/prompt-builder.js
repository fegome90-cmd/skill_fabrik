/**
 * Prompt Builder - Genera prompts optimizados para activar skills
 * Basado en promptcreate.md y heurística multi-señal
 */
import { readFile } from 'fs/promises';
import { resolve } from 'path';
/**
 * Carga skill-rules.json
 */
async function loadSkillRules(cwd) {
    const possiblePaths = [
        resolve(cwd, 'configs/skill-rules.json'),
        resolve(cwd, '../configs/skill-rules.json'),
        resolve(cwd, '../../configs/skill-rules.json'),
    ];
    for (const rulesPath of possiblePaths) {
        try {
            const content = await readFile(rulesPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            continue;
        }
    }
    return {};
}
/**
 * Calcula score esperado para un prompt dado y skill
 */
function calculateExpectedScore(prompt, suggestedFiles, suggestedContent, rule) {
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
        // Verificar si algún archivo sugerido coincide
        // Simplificado: asumimos que si sugerimos archivos relevantes, hay match
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
/**
 * Genera prompt optimizado para activar un skill específico
 */
export async function buildOptimizedPrompt(options) {
    const cwd = options.cwd || process.cwd();
    const rules = await loadSkillRules(cwd);
    const skillId = options.skillId;
    const description = options.description;
    if (!skillId || !rules[skillId]) {
        throw new Error(`Skill '${skillId}' no encontrado en skill-rules.json`);
    }
    const rule = rules[skillId];
    // Construir prompt base con keywords
    const keywords = rule.promptTriggers?.keywords || [];
    const intentPatterns = rule.promptTriggers?.intentPatterns || [];
    const pathPatterns = rule.fileTriggers?.pathPatterns || [];
    const contentPatterns = rule.fileTriggers?.contentPatterns || [];
    // Intentar detectar mejor intent pattern
    let bestIntent = description;
    if (intentPatterns.length > 0) {
        // Buscar pattern que ya esté cumplido en la descripción
        const matchedPattern = intentPatterns.find(pattern => {
            try {
                return new RegExp(pattern, 'i').test(description);
            }
            catch {
                return false;
            }
        });
        if (matchedPattern) {
            // Si ya coincide, usar descripción tal cual
            bestIntent = description;
        }
        else {
            // Si no coincide, mejorar con verbo de acción del primer pattern
            const firstPattern = intentPatterns[0];
            const match = firstPattern.match(/\(([^)]+)\)/);
            if (match) {
                const verbs = match[1].split('|');
                // Solo agregar verbo si no está ya en la descripción
                if (!description.toLowerCase().includes(verbs[0].toLowerCase())) {
                    bestIntent = `${verbs[0]} ${description}`;
                }
                else {
                    bestIntent = description;
                }
            }
        }
    }
    // Agregar keywords relevantes al inicio
    const relevantKeywords = keywords.slice(0, 3).filter(kw => !bestIntent.toLowerCase().includes(kw.toLowerCase()));
    const promptBase = relevantKeywords.length > 0
        ? `${relevantKeywords.join(', ')}: ${bestIntent}`
        : bestIntent;
    // Sugerir archivos reales basados en pathPatterns
    const suggestedFiles = [];
    if (options.includeFiles && pathPatterns.length > 0) {
        // Convertir pathPatterns en ejemplos reales
        for (const pattern of pathPatterns.slice(0, 2)) {
            // Extraer estructura del pattern
            let examplePath = pattern;
            // Reemplazar wildcards con ejemplos reales
            if (pattern.includes('backend/src/**')) {
                examplePath = 'backend/src/controllers/AuthController.ts';
            }
            else if (pattern.includes('frontend/src/**')) {
                examplePath = 'frontend/src/components/AuthForm.tsx';
            }
            else if (pattern.includes('**/controllers/**')) {
                examplePath = 'packages/api/src/controllers/UserController.ts';
            }
            else if (pattern.includes('**/components/**')) {
                examplePath = 'packages/ui/src/components/Button.tsx';
            }
            else if (pattern.includes('dev/plans/**')) {
                examplePath = 'dev/plans/new-feature-plan.md';
            }
            else {
                // Fallback: crear ejemplo basado en pattern
                examplePath = pattern
                    .replace(/\*\*/g, 'example')
                    .replace(/\*/g, 'example')
                    .replace(/\.\{[^}]+\}/g, '.ts');
            }
            suggestedFiles.push(examplePath);
        }
    }
    // Sugerir contenido
    let suggestedContent = '';
    if (options.includeContent && contentPatterns.length > 0) {
        // Extraer ejemplo de content pattern
        const firstPattern = contentPatterns[0];
        // Generar ejemplo básico
        if (firstPattern.includes('router\\.')) {
            suggestedContent = "router.post('/endpoint', Controller.handler);";
        }
        else if (firstPattern.includes('export.*Controller')) {
            suggestedContent = 'export class ExampleController { ... }';
        }
        else if (firstPattern.includes('function\\s')) {
            suggestedContent = 'function ExampleComponent() { ... }';
        }
    }
    // Construir prompt completo siguiendo estructura mejorada
    let optimizedPrompt = promptBase;
    // Agregar información de archivos si hay paths sugeridos
    if (suggestedFiles.length > 0) {
        optimizedPrompt += `\n\nAbre/edita estos archivos:\n${suggestedFiles.map(f => `- ${f}`).join('\n')}`;
    }
    // Agregar contenido esperado si hay patterns
    if (suggestedContent) {
        optimizedPrompt += `\n\nEl archivo debería contener:\n\`\`\`\n${suggestedContent}\n\`\`\``;
    }
    // Si score aún es bajo, agregar instrucciones adicionales
    const tempScore = calculateExpectedScore(optimizedPrompt, suggestedFiles, suggestedContent, rule).score;
    if (tempScore < 0.6 && options.includeFiles) {
        // Agregar nota sobre abrir archivos relevantes
        optimizedPrompt += '\n\n💡 Asegúrate de tener estos archivos abiertos en tu editor para maximizar la activación del skill.';
    }
    // Calcular score esperado
    const scoreResult = calculateExpectedScore(optimizedPrompt, suggestedFiles, suggestedContent, rule);
    return {
        prompt: optimizedPrompt,
        expectedScore: scoreResult.score,
        signals: {
            keywords: relevantKeywords,
            intent: intentPatterns.slice(0, 2),
            paths: suggestedFiles,
            content: suggestedContent ? [suggestedContent] : [],
        },
        skillActivation: [
            {
                skillId,
                score: scoreResult.score,
                reasons: scoreResult.reasons,
            },
        ],
    };
}
/**
 * Sugiere mejoras si un prompt tiene score bajo
 */
export async function suggestPromptImprovements(prompt, openFiles, activeFileContent, cwd) {
    const workingCwd = cwd || process.cwd();
    const rules = await loadSkillRules(workingCwd);
    // Calcular scores para todos los skills
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
    // Si hay skills con score < 0.6, sugerir mejoras
    if (scores.length > 0) {
        const topSkill = scores.sort((a, b) => b.score - a.score)[0];
        const optimized = await buildOptimizedPrompt({
            skillId: topSkill.skillId,
            description: prompt,
            includeFiles: openFiles.length === 0,
            includeContent: !activeFileContent,
            cwd: workingCwd,
        });
        return `💡 Tu prompt tiene score ${topSkill.score.toFixed(2)} para "${topSkill.skillId}". 
    
Prompt optimizado sugerido:
\`\`\`
${optimized.prompt}
\`\`\`

Score esperado: ${optimized.expectedScore.toFixed(2)} (${optimized.expectedScore >= 0.6 ? '✅ activaría' : '❌ no activaría'})`;
    }
    return null;
}
//# sourceMappingURL=prompt-builder.js.map