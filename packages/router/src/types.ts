/**
 * Types for router package
 */

export interface SkillRule {
  type: 'guideline' | 'guardrail' | 'workflow' | 'analyst' | 'generator';
  enforcement?: 'suggest' | 'warn' | 'require' | 'block';
  priority?: 'critical' | 'high' | 'normal' | 'low';
  promptTriggers?: {
    keywords?: string[];
    intentPatterns?: string[];
  };
  fileTriggers?: {
    pathPatterns?: string[];
    contentPatterns?: string[];
  };
  resources?: string[];
}

export interface SkillRules {
  [skillId: string]: SkillRule;
}

export interface PreHookInput {
  prompt: string;
  openFiles: string[];
  activeFileContent?: string; // Snapshot ≤2KB
  cwd: string;
  activeFile?: string;
  editor?: string;
}

export interface PreHookOutput {
  injectedNote?: string; // "🎯 Skill Activation Check"
  activated: string[]; // Skills activados
  metadata: {
    scores: Record<string, number>; // Score de cada skill
    reasons: Record<string, string[]>; // Razones de activación
    [key: string]: any; // Allow additional metadata properties
  };
  blocked?: boolean; // Si está bloqueado por gate (plan, etc.)
  blockReason?: string; // Razón del bloqueo
}

export interface EditLogEntry {
  file: string;
  repo: string;
  ts: number;
}

export interface StopHookInput {
  editLog: EditLogEntry[];
  reposChanged: Set<string>;
  cwd: string;
}

export interface TypeCheckResult {
  repo: string;
  errors: number;
  output: string;
}

export interface StopHookOutput {
  formatted: string[]; // Archivos formateados
  typecheck: TypeCheckResult[];
  hints?: string[]; // Sugerencias de errores
  autoResolved: boolean; // Si se auto-resolvió
  autoResolveSummary?: string[]; // Resumen de errores auto-resueltos
  kpiEvent?: KPIEvent; // Evento JSONL
  metrics?: any; // Métricas de performance del pipeline
}

export interface KPIEvent {
  ts: string;
  repo: string;
  task?: string;
  skills: string[];
  activated_by: {
    keywords: boolean;
    intent_regex: boolean;
    path_globs: boolean;
    content_patterns: boolean;
  };
  adherence: boolean;
  errors_ts: number;
  auto_resolver_used: boolean;
  latency_ms: number;
  tokens_total?: number;
  zero_errors_left_behind: boolean;
  progressive_disclosure: {
    metadata_loaded: boolean;
    skill_md_loaded: boolean;
    resources_loaded: number;
  };
}

export interface GuardrailViolation {
  skillId: string;
  file: string;
  line: number;
  pattern: string;
  message: string;
  enforcement: 'suggest' | 'warn' | 'block';
}

/**
 * Plan Lifecycle Types (Phase 2)
 */
export type PlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'COMPLETED';

export interface PlanPhase {
  name: string;
  steps: string[];
  dependencies: string[];
}

export interface PlanRisk {
  description: string;
  mitigation: string;
}

export interface PlanMetrics {
  expected_tokens?: number;
  estimated_latency_s?: number;
}

export interface Plan {
  id: string;
  task: string;
  status: PlanStatus;
  phases: PlanPhase[];
  risks: PlanRisk[];
  metrics: PlanMetrics;
  created: string;
  updated: string;
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
}
