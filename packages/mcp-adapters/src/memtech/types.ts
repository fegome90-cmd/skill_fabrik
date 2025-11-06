/**
 * Types for MemTech integration
 */

export type StorageLayer = 'L0' | 'L1' | 'L2' | 'L3';

export interface MemoryItemMetadata {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  version?: number;
  layer?: StorageLayer;
  storage?: StorageReference;
  size_bytes?: number;
  last_access?: string;
  [key: string]: unknown;
}

export interface StorageReference {
  backend: 'redis-cache' | 'redis-core' | 'postgresql' | 'qdrant' | 'chroma';
  key?: string;
  id?: string;
  table?: string;
  collection?: string;
  ttl?: number;
  stored_at?: string;
}

export interface MemoryItemPayload {
  id: string;
  layer: StorageLayer;
  title: string;
  tags: string[];
  metadata: MemoryItemMetadata;
  content: string;
  stored_at: string;
}

export interface AddItemResult {
  success: boolean;
  id: string;
  uri: string;
  metadata: MemoryItemMetadata;
  created_at: string;
}

export interface PlanSnapshotContent {
  plan_id: string;
  task: string;
  phases: Array<{
    name: string;
    description?: string;
    risks?: unknown[];
    tasks?: unknown[];
  }>;
  status: string;
  approved_at?: string;
  risks?: unknown[];
  metrics?: unknown;
}

export interface PlanSnapshotMetadata {
  plan_id: string;
  task_name: string;
  status: string;
  approved_at?: string;
  phases_count: number;
  created_at: string;
  expires_at: string;
}

export interface PlanSnapshotInput {
  id: string;
  task: string;
  phases: Array<{
    name: string;
    description?: string;
    risks?: unknown[];
    tasks?: unknown[];
  }>;
  status: string;
  approved_at?: string;
  risks?: unknown[];
  metrics?: unknown;
}

