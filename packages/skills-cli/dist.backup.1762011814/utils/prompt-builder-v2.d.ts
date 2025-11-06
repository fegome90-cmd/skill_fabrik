/**
 * Prompt Builder v2 - Mejorado con lecciones del sprint
 * Integra Template v1.1.0, TAGs system, detección de archivos reales, y patrones aprendidos
 */
/**
 * Estructura de proyecto detectada
 */
export interface ProjectStructure {
    type: 'monorepo' | 'standard' | 'packages' | 'unknown';
    detectedPaths: {
        backend?: string[];
        frontend?: string[];
        packages?: string[];
        config?: string[];
        memtech?: string[];
    };
}
/**
 * Obtiene configuración de complejidad según promptcreate.md
 */
export declare function getComplexityConfig(complexity: 'low' | 'medium' | 'high' | 'very-high'): ComplexityConfig;
export interface SkillRule {
    type: 'guideline' | 'guardrail' | 'workflow' | 'analyst' | 'generator';
    enforcement?: 'suggest' | 'require' | 'block';
    priority?: 'critical' | 'high' | 'normal' | 'low';
    promptTriggers?: {
        keywords?: string[];
        intentPatterns?: string[];
    };
    fileTriggers?: {
        pathPatterns?: string[];
        contentPatterns?: string[];
    };
    resources?: string[];
}
export interface SkillRules {
    [skillId: string]: SkillRule;
}
/**
 * Configuración de complejidad según promptcreate.md
 */
export interface ComplexityConfig {
    coverage: number;
    duration: string;
    innovation_level: 'low' | 'medium' | 'high' | 'very-high' | 'revolutionary';
    target_coverage?: number;
}
/**
 * Opciones para generar prompt
 */
export interface PromptBuilderOptions {
    skillId?: string;
    skillIds?: string[];
    description: string;
    includeFiles?: boolean;
    includeContent?: boolean;
    includeTemplate?: boolean;
    includeTags?: boolean;
    includePlanContext?: boolean;
    cwd?: string;
    complexity?: 'low' | 'medium' | 'high' | 'very-high';
    duration?: string;
    enableBatchCreation?: boolean;
    enableValidation?: boolean;
    enableSurpriseMetrics?: boolean;
}
export interface OptimizedPrompt {
    prompt: string;
    expectedScore: number;
    signals: {
        keywords: string[];
        intent: string[];
        paths: string[];
        content: string[];
        tags?: string[];
        templateComponents?: string[];
    };
    skillActivation: Array<{
        skillId: string;
        score: number;
        reasons: string[];
    }>;
    templateScore?: number;
    tagsCoverage?: number;
    planContext?: {
        planId?: string;
        taskName?: string;
        phases?: Array<{
            name: string;
        }>;
    };
}
/**
 * Construye prompt optimizado mejorado
 */
export declare function buildOptimizedPromptV2(options: PromptBuilderOptions): Promise<OptimizedPrompt>;
/**
 * Sugiere mejoras basado en múltiples skills
 */
export declare function suggestPromptImprovementsV2(prompt: string, openFiles: string[], activeFileContent?: string, cwd?: string): Promise<string | null>;
//# sourceMappingURL=prompt-builder-v2.d.ts.map