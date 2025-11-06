/**
 * Plan validation utilities
 */
import type { Plan, PlanStatus } from '../types/plan.js';
export interface PlanValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Validate plan structure
 */
export declare function validatePlan(plan: Partial<Plan>): PlanValidationResult;
/**
 * Validate status transition
 */
export declare function validateStatusTransition(currentStatus: PlanStatus, newStatus: PlanStatus): {
    valid: boolean;
    error?: string;
};
//# sourceMappingURL=plan-validator.d.ts.map