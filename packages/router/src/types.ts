/**
 * Tipos para el router de activación de skills
 */

export interface SkillRule {
  type: 'guideline' | 'guardrail' | 'workflow' | 'analyst' | 'generator';
  enforcement: 'suggest' | 'require' | 'block';
  priority: 'critical' | 'high' | 'normal' | 'low';
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
}

export interface PreHookOutput {
  injectedNote?: string; // "🎯 Skill Activation Check"
  activated: string[];
  metadata: {
    scores: Record<string, number>;
    reasons: Record<string, string[]>;
  };
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
  formatted: string[];
  typecheck: TypeCheckResult[];
  hints?: string[];
  autoResolved: boolean;
  kpiEvent: KPIEvent;
}

export interface KPIEvent {
  ts: string;
  repo: string;
  task?: string;
  skills: string[];
  activated_by?: {
    keywords?: boolean;
    intent_regex?: boolean;
    path_globs?: boolean;
    content_patterns?: boolean;
  };
  adherence?: boolean;
  errors_ts: number;
  auto_resolver_used: boolean;
  latency_ms: number;
  tokens_total?: number;
  zero_errors_left_behind: boolean;
  progressive_disclosure?: {
    metadata_loaded: boolean;
    skill_md_loaded: boolean;
    resources_loaded: number;
  };
}

export interface GuardrailViolation {
  skillId: string;
  file: string;
  line?: number;
  pattern: string;
  message: string;
}
