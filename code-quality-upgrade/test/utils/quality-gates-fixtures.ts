/**
 * T4.1.1: Quality Gates Fixtures for E2E Testing
 *
 * Helper functions to create execution contexts for quality gates E2E tests.
 */

/**
 * Creates an execution context for quality gates testing
 * For this task: uses the current code-quality-upgrade project as "healthy project"
 */
export function createExecutionContext(options: { projectPath: string }): {
  projectPath: string;
} {
  // For this task: use the current project as a healthy project
  return {
    projectPath: options.projectPath,
    // files property can be added later if needed
  };
}
