export declare function extractPhaseNumber(phase: string): number;
export declare function generatePlanStart(phase: string): Promise<string>;
export declare function generatePresprint(phase: string, metrics: Record<string, unknown>): Promise<string>;
export declare function validateQualityGate(gate: string, _phase: number): Promise<boolean>;
export declare function validatePreviousPhase(phaseNum: number): Promise<void>;
//# sourceMappingURL=cloop-templates.d.ts.map