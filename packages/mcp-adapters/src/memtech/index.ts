/**
 * MemTech MCP Adapter
 */

export { MemoryStore, determineStorageLayer } from './memory-store.js';
export { MemoryManager } from './memory-manager.js';
export { createPlanSnapshot } from './memtech-snapshot.js';
export { 
  setL1Item, 
  getL1Item, 
  deleteL1Item, 
  closeRedisConnection,
  testConnection,
} from './redis-client.js';
export {
  getRedisClient,
  getPgPool,
  ensurePostgresTables,
  getChromaWrapper,
  testAllConnections,
  closeAllConnections,
} from './database-clients.js';
export { 
  loadConfig, 
  getConfig, 
  validateConfig,
  resetConfig,
  type ConfigValidationResult,
} from './config.js';
export type {
  StorageLayer,
  MemoryItemMetadata,
  StorageReference,
  MemoryItemPayload,
  AddItemResult,
  PlanSnapshotContent,
  PlanSnapshotMetadata,
  PlanSnapshotInput,
} from './types.js';

// Re-export memory adapter as alias for compatibility
export { MemoryManager as MemoryAdapter } from './memory-manager.js';
