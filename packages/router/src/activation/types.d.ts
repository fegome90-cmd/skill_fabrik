export type ActivationContext = {
    currentFile?: string;
    openFiles?: string[];
    gitDiff?: string;
    projectType?: string;
    fileContent?: string;
    recentFiles?: string[];
    historical?: SkillHistoricalData;
};
export type SkillHistoricalData = {
    totalActivations: number;
    accuracy: number;
};
export type ActivationSignals = Record<string, number>;
export type ActivationWeights = Record<string, number>;
export type ActivationConfig = {
    threshold: number;
    allowList: string[];
    denyList: string[];
    weights: ActivationWeights;
};
export type ActivationDecision = {
    activate: boolean;
    finalScore: number;
    signals: ActivationSignals;
    reasoning: string[];
    reason: 'allowList' | 'denyList' | 'threshold';
};
export type ScoreInput = {
    skillName: string;
    prompt: string;
    context: ActivationContext;
};
export interface Signal {
    name: string;
    score(input: ScoreInput): Promise<number> | number;
}
//# sourceMappingURL=types.d.ts.map