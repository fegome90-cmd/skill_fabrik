export interface PhaseNumber {
    value: number;
    formatted: string;
}
export interface QualityGate {
    name: string;
    phase: number;
    status: 'pending' | 'passed' | 'failed';
    details?: string;
}
export interface CLOOPMetrics {
    phase: number;
    clarify: {
        objectiveSmart: boolean;
        hypothesis: boolean;
        successCriteria: boolean;
        context: boolean;
    };
    layout: {
        architecture: boolean;
        contracts: boolean;
        testsPlan: boolean;
        metrics: boolean;
    };
    operate: {
        implementation: boolean;
        tests: boolean;
        metricsInTarget: boolean;
        decisions: boolean;
    };
    observe: {
        metricsCollected: boolean;
        performance: boolean;
        quality: boolean;
        findings: boolean;
    };
    reflect: {
        analysis: boolean;
        lessons: boolean;
        patterns: boolean;
        nextIteration: boolean;
    };
    timestamp: string;
}
//# sourceMappingURL=cloop.d.ts.map