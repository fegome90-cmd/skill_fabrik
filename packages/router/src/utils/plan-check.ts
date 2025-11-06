/**
 * Plan checking utilities for gate enforcement
 */

import { readFile, access, constants } from 'fs/promises';
import { resolve, join } from 'path';
import type { Plan } from '../types.js';

/**
 * Verifica si un path existe
 */
async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const ACTIVE_DIR = 'dev/active';

/**
 * Check if there's an approved plan for the current context
 */
export async function checkApprovedPlan(cwd: string): Promise<{
  hasPlan: boolean;
  plan?: Plan;
  taskName?: string;
  error?: string;
}> {
  try {
    const activeBase = resolve(cwd, ACTIVE_DIR);

    if (!(await pathExists(activeBase))) {
      return { hasPlan: false, error: 'No dev/active directory found' };
    }

    // Try to find active task with plan
    const { readdir } = await import('fs/promises');
    const entries = await readdir(activeBase, { withFileTypes: true });
    const taskDirs = entries.filter(e => e.isDirectory());

    for (const taskDir of taskDirs) {
      const taskJsonPath = join(activeBase, taskDir.name, 'task.json');

      if (!(await pathExists(taskJsonPath))) {
        continue;
      }

      let taskJson: any;
      try {
        taskJson = JSON.parse(await readFile(taskJsonPath, 'utf-8'));
      } catch (error) {
        // Skip corrupted task descriptors instead of failing the entire check
        console.warn(`[plan-check] Invalid task.json at ${taskJsonPath}:`, error instanceof Error ? error.message : error);
        continue;
      }

      if (!taskJson.planPath) {
        continue;
      }

      const resolvedPlanPath = resolve(taskJson.planPath);
      if (!(await pathExists(resolvedPlanPath))) {
        continue;
      }

      try {
        const rawPlan = await readFile(resolvedPlanPath, 'utf-8');
        const plan = JSON.parse(rawPlan) as Plan;

        if (plan.status === 'APPROVED' || plan.status === 'EXECUTING') {
          return {
            hasPlan: true,
            plan,
            taskName: taskDir.name,
          };
        }
      } catch (error) {
        // Plans stored como Markdown u otro formato no deben bloquear el resto
        console.warn(`[plan-check] Skipping invalid plan at ${resolvedPlanPath}:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    return { hasPlan: false, error: 'No approved plan found in active tasks' };
  } catch (error) {
    return {
      hasPlan: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if planning mode is enabled (env var or config)
 */
export function isPlanningModeEnabled(): boolean {
  return process.env.SKILLS_PLANNING_MODE !== 'false'; // Default: enabled
}
