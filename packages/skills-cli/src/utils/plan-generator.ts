/**
 * Plan generator utilities
 */

import * as path from 'path';
import { randomBytes } from 'crypto';
import fs from 'fs-extra';
import type { Plan } from '../types/plan.js';

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
 */
export function createPlanFromTask(task: string): Plan {
  const planId = generatePlanId();
  const now = new Date().toISOString();

  return {
    id: planId,
    task,
    status: 'DRAFT',
    phases: [],
    risks: [],
    metrics: {},
    created: now,
    updated: now,
  };
}
