/**
 * Plan generator utilities
 */

import * as path from 'path';
import { randomBytes } from 'crypto';
import fs from 'fs-extra';
import type { Plan } from '../types/plan.js';
import { buildOptimizedPromptV2 } from './prompt-builder-v2.js';

const { writeFile, ensureDir } = fs;

/**
 * Generate plan.md from Plan object
 */
export async function generatePlanMarkdown(plan: Plan, outputPath: string): Promise<void> {
  const content = `# Plan: ${plan.task}

**ID**: ${plan.id}  
**Status**: ${plan.status}  
**Created**: ${new Date(plan.created).toLocaleString()}  
**Updated**: ${new Date(plan.updated).toLocaleString()}

${plan.approvedBy ? `**Approved by**: ${plan.approvedBy}` : ''}  
${plan.approvedAt ? `**Approved at**: ${new Date(plan.approvedAt).toLocaleString()}` : ''}

---

## Objetivo

${plan.task}

## Fases

${plan.phases
  .map(
    (phase, idx) => `### ${idx + 1}. ${phase.name}

${phase.dependencies.length > 0 ? `**Dependencias**: ${phase.dependencies.join(', ')}` : ''}

**Pasos**:
${phase.steps.map((step, stepIdx) => `  ${stepIdx + 1}. ${step}`).join('\n')}
`
  )
  .join('\n')}

## Riesgos

${
  plan.risks.length > 0
    ? plan.risks
        .map(
          (risk, idx) => `### ${idx + 1}. ${risk.description}

**Mitigación**: ${risk.mitigation}
`
        )
        .join('\n')
    : 'No se identificaron riesgos significativos.'
}

## Métricas

${plan.metrics.expected_tokens ? `- Tokens esperados: ${plan.metrics.expected_tokens}` : ''}
${plan.metrics.estimated_latency_s ? `- Latencia estimada: ${plan.metrics.estimated_latency_s}s` : ''}

---

**Estado actual**: ${plan.status}
${plan.status === 'APPROVED' ? '\n✅ Plan aprobado y listo para ejecución' : ''}
`;

  await ensureDir(path.dirname(outputPath));
  await writeFile(outputPath, content, 'utf-8');
}

/**
 * Generate context.md for a task
 */
export async function generateContextMarkdown(
  taskName: string,
  plan: Plan,
  outputPath: string
): Promise<void> {
  const relevantFiles: string[] = [];
  const dependencies: string[] = [];
  const constraints: string[] = [];

  // Extract from plan phases
  plan.phases.forEach(phase => {
    if (phase.dependencies.length > 0) {
      dependencies.push(...phase.dependencies);
    }
  });

  const content = `# Context: ${taskName}

## Overview

${plan.task}

**Plan ID**: ${plan.id}  
**Status**: ${plan.status}

## Relevant Files

${relevantFiles.length > 0 ? relevantFiles.map(f => `- ${f}`).join('\n') : '<!-- Agregar archivos relevantes aquí -->'}

## Dependencies

${
  dependencies.length > 0
    ? dependencies.map(d => `- ${d}`).join('\n')
    : '<!-- Agregar dependencias aquí -->'
}

## Constraints

${
  constraints.length > 0
    ? constraints.map(c => `- ${c}`).join('\n')
    : '<!-- Agregar restricciones aquí -->'
}

## Decisions

<!-- Documentar decisiones arquitectónicas (ADR) aquí -->

## Notes

<!-- Notas adicionales del contexto -->
`;

  await ensureDir(path.dirname(outputPath));
  await writeFile(outputPath, content, 'utf-8');
}

/**
 * Generate tasks.md checklist from plan
 */
export async function generateTasksMarkdown(
  taskName: string,
  plan: Plan,
  outputPath: string
): Promise<void> {
  const todoItems: string[] = [];
  const inProgressItems: string[] = [];
  const completedItems: string[] = [];

  plan.phases.forEach(phase => {
    phase.steps.forEach(step => {
      todoItems.push(`- [ ] ${phase.name}: ${step}`);
    });
  });

  const content = `# Tasks: ${taskName}

**Plan ID**: ${plan.id}  
**Status**: ${plan.status}

## TODO

${todoItems.length > 0 ? todoItems.join('\n') : '- [ ] No hay tareas pendientes'}

## In Progress

${inProgressItems.length > 0 ? inProgressItems.join('\n') : '<!-- Tareas en progreso -->'}

## Completed

${completedItems.length > 0 ? completedItems.join('\n') : '<!-- Tareas completadas -->'}
`;

  await ensureDir(path.dirname(outputPath));
  await writeFile(outputPath, content, 'utf-8');
}

/**
 * Generate a short unique ID
 */
function generatePlanId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(4).toString('hex');
  return `${timestamp}-${random}`.substring(0, 16);
}

/**
 * Create a new plan from task description
 * Creates a basic plan with an initial phase to pass validation
 */
export function createPlanFromTask(task: string): Plan {
  const planId = generatePlanId();
  const now = new Date().toISOString();

  return {
    id: planId,
    task,
    status: 'DRAFT',
    phases: [
      {
        name: 'Fase inicial',
        steps: ['Editar este plan y agregar pasos específicos'],
        dependencies: [],
      },
    ],
    risks: [],
    metrics: {},
    created: now,
    updated: now,
  };
}

/**
 * Create plan from task using Prompt Builder v2 for intelligent plan generation
 */
export async function createPlanFromTaskV2(task: string, cwd?: string): Promise<Plan> {
  const planId = generatePlanId();
  const now = new Date().toISOString();

  // Use Prompt Builder v2 to generate intelligent planning prompt
  const planningPrompt = await buildOptimizedPromptV2({
    description: `Generate a structured CLOOP methodology plan for the following task: "${task}"

    Please provide:
    1. Clear phases (Clarify, Layout, Operate, Observe, Reflect)
    2. Specific, actionable steps for each phase
    3. Potential risks and mitigation strategies
    4. Estimated metrics (tokens, latency)

    Format the response as JSON with this structure:
    {
      "phases": [{"name": "phase name", "steps": ["step1", "step2"], "dependencies": ["phase1"]}],
      "risks": [{"description": "risk", "mitigation": "mitigation strategy"}],
      "metrics": {"expected_tokens": number, "estimated_latency_s": number}
    }`,
    skillIds: ['plan-architect'],
    includeTemplate: true,
    includeTags: true,
    complexity: 'medium',
    cwd: cwd || process.cwd(),
  });

  try {
    // Parse the AI response to extract structured plan data
    const planData = parsePlanResponse(planningPrompt.prompt);

    return {
      id: planId,
      task,
      status: 'DRAFT',
      phases: planData.phases || [
        {
          name: 'Clarify - Define Objectives',
          steps: [
            'Define clear objectives and success criteria',
            'Identify stakeholders and requirements',
            'Establish scope and boundaries'
          ],
          dependencies: [],
        },
        {
          name: 'Layout - Design Approach',
          steps: [
            'Design high-level architecture',
            'Define implementation strategy',
            'Create detailed task breakdown'
          ],
          dependencies: ['Clarify - Define Objectives'],
        },
        {
          name: 'Operate - Execute Plan',
          steps: [
            'Implement core functionality',
            'Test and validate components',
            'Iterate based on feedback'
          ],
          dependencies: ['Layout - Design Approach'],
        },
        {
          name: 'Observe - Monitor Progress',
          steps: [
            'Track progress against objectives',
            'Measure performance metrics',
            'Collect qualitative feedback'
          ],
          dependencies: ['Operate - Execute Plan'],
        },
        {
          name: 'Reflect - Analyze Results',
          steps: [
            'Analyze what worked and what didn\'t',
            'Document lessons learned',
            'Recommend improvements for future iterations'
          ],
          dependencies: ['Observe - Monitor Progress'],
        },
      ],
      risks: planData.risks || [
        {
          description: 'Scope creep during implementation',
          mitigation: 'Regular scope reviews and stakeholder alignment'
        }
      ],
      metrics: planData.metrics || {
        expected_tokens: 15000,
        estimated_latency_s: 300
      },
      created: now,
      updated: now,
    };
  } catch (error) {
    // Fallback to basic plan if parsing fails
    console.warn('Failed to parse plan response, using basic structure:', error);
    return createPlanFromTask(task);
  }
}

/**
 * Parse AI response to extract structured plan data
 */
function parsePlanResponse(response: string): any {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch {
    return {};
  }
}
