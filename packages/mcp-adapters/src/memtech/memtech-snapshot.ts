/**
 * Utility for creating MemTech L1 snapshots from plans
 */

import type { PlanSnapshotInput, PlanSnapshotContent, PlanSnapshotMetadata, AddItemResult } from './types.js';
import { MemoryManager } from './memory-manager.js';

/**
 * Create L1 snapshot from an approved plan
 */
export async function createPlanSnapshot(plan: PlanSnapshotInput): Promise<AddItemResult> {
  // Calculate expiration (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Serialize plan essential content
  const content: PlanSnapshotContent = {
    plan_id: plan.id,
    task: plan.task,
    phases: plan.phases,
    status: plan.status,
    approved_at: plan.approved_at,
    risks: plan.risks,
    metrics: plan.metrics,
  };

  // Create metadata
  const metadata: PlanSnapshotMetadata = {
    plan_id: plan.id,
    task_name: plan.task,
    status: plan.status,
    approved_at: plan.approved_at,
    phases_count: plan.phases.length,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  // Intento principal: Redis via MemoryManager (L1)
  try {
    const memoryManager = new MemoryManager();
    const result = await memoryManager.addItem({
      title: `Plan: ${plan.task}`,
      content: JSON.stringify(content, null, 2),
      description: `Plan snapshot for task: ${plan.task}`,
      tags: ['plan', 'approved', 'active', 'snapshot'],
      type: 'plan_snapshot',
      level: 'L1',
      plan_id: plan.id,
      task_name: plan.task,
      approved_at: plan.approved_at,
      phases_count: plan.phases.length,
      expires_at: expiresAt.toISOString(),
    });
    return result;
  } catch (error) {
    // Fallback: almacenamiento local de snapshots
    const fs = await import('fs-extra');
    const { ensureDir, writeJson } = fs;
    const snapshotDir = 'dev/plans/snapshots';
    await ensureDir(snapshotDir);

    const snapshot = {
      id: `snapshot-${Date.now()}-${plan.id}`,
      uri: `file://${snapshotDir}/${plan.id}.snapshot.json`,
      created_at: new Date().toISOString(),
      plan_id: plan.id,
      task: plan.task,
      phases: plan.phases,
      status: plan.status,
      approved_at: plan.approved_at,
      risks: plan.risks,
      metrics: plan.metrics,
    };

    await writeJson(`${snapshotDir}/${plan.id}.snapshot.json`, {
      metadata,
      content,
      snapshot,
    }, { spaces: 2 });

    return {
      id: snapshot.id,
      uri: snapshot.uri,
      created_at: snapshot.created_at,
    };
  }
}

