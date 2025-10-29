/**
 * Plan validation utilities
 */

import type { Plan, PlanStatus } from '../types/plan.js';
import { isValidStatusTransition } from '../types/plan.js';

export interface PlanValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate plan structure
 */
export function validatePlan(plan: Partial<Plan>): PlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!plan.id || typeof plan.id !== 'string' || plan.id.length === 0) {
    errors.push('Plan must have a valid id');
  }

  if (!plan.task || typeof plan.task !== 'string' || plan.task.length === 0) {
    errors.push('Plan must have a task description');
  }

  if (!plan.status || !isValidPlanStatus(plan.status)) {
    errors.push('Plan must have a valid status');
  }

  if (!plan.phases || !Array.isArray(plan.phases) || plan.phases.length === 0) {
    errors.push('Plan must have at least one phase');
  }

  // Validate phases
  if (plan.phases) {
    plan.phases.forEach((phase, idx) => {
      if (!phase.name || phase.name.length === 0) {
        errors.push(`Phase ${idx + 1} must have a name`);
      }
      if (!Array.isArray(phase.steps) || phase.steps.length === 0) {
        warnings.push(`Phase ${idx + 1} has no steps`);
      }
    });
  }

  // Validate dates
  if (plan.created && !isValidDate(plan.created)) {
    errors.push('created date must be a valid ISO date');
  }

  if (plan.updated && !isValidDate(plan.updated)) {
    errors.push('updated date must be a valid ISO date');
  }

  // Status-specific validations
  if (plan.status === 'APPROVED' && !plan.approvedBy) {
    warnings.push('APPROVED plans should have approvedBy field');
  }

  if (plan.status === 'APPROVED' && !plan.approvedAt) {
    warnings.push('APPROVED plans should have approvedAt field');
  }

  if (plan.status === 'COMPLETED' && !plan.completedAt) {
    warnings.push('COMPLETED plans should have completedAt field');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate status transition
 */
export function validateStatusTransition(
  currentStatus: PlanStatus,
  newStatus: PlanStatus
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  if (!isValidStatusTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition: ${currentStatus} → ${newStatus}`,
    };
  }

  return { valid: true };
}

/**
 * Check if status is valid
 */
function isValidPlanStatus(status: string): status is PlanStatus {
  return ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'EXECUTING', 'COMPLETED'].includes(status);
}

/**
 * Check if date string is valid ISO date
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}
