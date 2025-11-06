export interface ActivateContext {
  files?: string[];
  activeFile?: string;
  activeFileContent?: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  editor?: string;
}

export interface ActivateOptions {
  maxCandidates?: number;
  maxResults?: number;
  threshold?: number;
  includeMetadata?: boolean;
}

export interface ActivateRequest {
  intent: string;
  context: ActivateContext;
  options?: ActivateOptions;
}

export interface ActivateResultItem {
  skillId: string;
  confidence: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivateResponse {
  success: boolean;
  timestamp: string;
  results?: ActivateResultItem[];
  metrics?: Record<string, unknown>;
  error?: { code?: string; message?: string; details?: unknown };
}

export interface ExecuteRequest {
  skill_id: string;
  args?: Record<string, unknown>;
  dry_run?: boolean;
  cwd?: string;
  needs?: string[];
}

export interface ExecuteResponse {
  stdout?: string;
  changes?: Array<{ path: string; diff: string }>;
  artifacts?: Array<{ path: string; hash: string }>;
  run_latency_ms?: number;
  evidence_id?: string;
  error?: string | Record<string, unknown>;
}

