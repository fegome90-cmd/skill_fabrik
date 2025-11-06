/**
 * Plan generator utilities
 */
import type { Plan } from '../types/plan.js';
/**
 * Generate plan.md from Plan object
 */
export declare function generatePlanMarkdown(plan: Plan, outputPath: string): Promise<void>;
/**
 * Generate context.md for a task
 */
export declare function generateContextMarkdown(taskName: string, plan: Plan, outputPath: string): Promise<void>;
/**
 * Generate tasks.md checklist from plan
 */
export declare function generateTasksMarkdown(taskName: string, plan: Plan, outputPath: string): Promise<void>;
/**
 * Create a new plan from task description
 * Creates a basic plan with an initial phase to pass validation
 */
export declare function createPlanFromTask(task: string): Plan;
/**
 * Create plan from task using Prompt Builder v2 for intelligent plan generation
 */
export declare function createPlanFromTaskV2(task: string, cwd?: string): Promise<Plan>;
//# sourceMappingURL=plan-generator.d.ts.map