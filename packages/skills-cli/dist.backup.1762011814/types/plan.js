/**
 * Plan types for skills-cli
 */
/**
 * Valid transitions for plan status
 */
export const PLAN_STATUS_TRANSITIONS = {
    DRAFT: ['PENDING_APPROVAL', 'DRAFT'],
    PENDING_APPROVAL: ['APPROVED', 'DRAFT'],
    APPROVED: ['EXECUTING', 'PENDING_APPROVAL'],
    EXECUTING: ['COMPLETED', 'APPROVED'],
    COMPLETED: [], // Terminal state
};
/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(from, to) {
    return PLAN_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
//# sourceMappingURL=plan.js.map