/**
 * Prompt Builder - Genera prompts optimizados para activar skills
 * Basado en promptcreate.md y heurística multi-señal
 */
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
 * Opciones para generar prompt
 */
export interface PromptBuilderOptions {
    skillId?: string;
    description: string;
    includeFiles?: boolean;
    includeContent?: boolean;
    cwd?: string;
}
/**
 * Prompt optimizado generado
 */
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
    skillActivation: {
        skillId: string;
        score: number;
        reasons: string[];
    }[];
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
 * Genera prompt optimizado para activar un skill específico
 */
export declare function buildOptimizedPrompt(options: PromptBuilderOptions): Promise<OptimizedPrompt>;
/**
 * Sugiere mejoras si un prompt tiene score bajo
 */
export declare function suggestPromptImprovements(prompt: string, openFiles: string[], activeFileContent?: string, cwd?: string): Promise<string | null>;
//# sourceMappingURL=prompt-builder.d.ts.map