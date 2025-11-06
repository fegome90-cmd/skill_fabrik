/**
 * Plan types for skills-cli
 */
export type PlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'COMPLETED';
export interface PlanPhase {
    name: string;
    steps: string[];
    dependencies: string[];
}
export interface PlanRisk {
    description: string;
    mitigation: string;
}
export interface PlanMetrics {
    expected_tokens?: number;
    estimated_latency_s?: number;
}
export interface Plan {
    id: string;
    task: string;
    status: PlanStatus;
    phases: PlanPhase[];
    risks: PlanRisk[];
    metrics: PlanMetrics;
    created: string;
    updated: string;
    approvedBy?: string;
    approvedAt?: string;
    completedAt?: string;
}
/**
 * Valid transitions for plan status
 */
export declare const PLAN_STATUS_TRANSITIONS: Record<PlanStatus, PlanStatus[]>;
/**
 * Check if a status transition is valid
 */
export declare function isValidStatusTransition(from: PlanStatus, to: PlanStatus): boolean;
//# sourceMappingURL=plan.d.ts.map