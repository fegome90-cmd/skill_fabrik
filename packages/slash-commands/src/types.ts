/**
 * Slash Commands System Types
 */

// Base slash command interface
export interface SlashCommand {
  name: string;
  description: string;
  category: CommandCategory;
  handler: string;
  requiresAuth: boolean;
  persistenceLevel: PersistenceLevel;
  integration?: CommandIntegration;
  aliases?: string[];
  examples?: string[];
}

export enum CommandCategory {
  DEV_DOCS = 'dev-docs',
  QUALITY = 'quality',
  TESTING = 'testing',
  UTILITIES = 'utilities',
}

export enum PersistenceLevel {
  NONE = 'none',
  SESSION = 'session',
  PERMANENT = 'permanent',
}

export interface CommandIntegration {
  skillId?: string;
  daemonEndpoint?: string;
  cliCommand?: string;
  memTechL1?: boolean;
}

// Parsed slash command
export interface ParsedSlashCommand {
  raw: string;
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  options: Record<string, string>;
}

// Command execution context
export interface SlashCommandContext {
  sessionId: string;
  userId?: string;
  workspace: WorkspaceSnapshot;
  command: ParsedSlashCommand;
  metadata: CommandMetadata;
  state: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSnapshot {
  root: string;
  gitStatus?: GitStatus;
  packageJson?: any;
  env?: Record<string, string>;
  openFiles?: string[];
}

export interface GitStatus {
  branch: string;
  commit: string;
  clean: boolean;
  modified: string[];
  staged: string[];
  untracked: string[];
}

export interface CommandMetadata {
  executionTimeMs?: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  integrationType: 'skill' | 'daemon' | 'cli' | 'native';
  persistenceKey?: string;
}

// Context persistence schema
export interface PersistentSlashContext {
  id: string;
  sessionId: string;
  command: string;
  state: Record<string, any>;
  workspaceSnapshot: WorkspaceSnapshot;
  memtechL1Key?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

// Command registry
export interface SlashCommandRegistry {
  version: string;
  commands: Record<string, SlashCommand>;
  categories: Record<CommandCategory, string[]>;
  aliases: Record<string, string>;
}

// Execution result
export interface SlashCommandResult {
  success: boolean;
  output: string;
  data?: any;
  context?: SlashCommandContext;
  nextActions?: string[];
  error?: CommandError;
  metadata?: {
    executionTimeMs?: number;
    integrationType?: 'skill' | 'daemon' | 'cli' | 'native';
    persistenceKey?: string;
    cacheHit?: boolean;
    warnings?: string[];
  };
}

export interface CommandError {
  type: 'validation' | 'execution' | 'integration' | 'permission' | 'timeout';
  message: string;
  details?: any;
  code?: string;
}

// Dev-Docs specific types
export interface DevDocsPlan {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  phases: PlanPhase[];
  risks: Risk[];
  kpis: KPI[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  tasks: Task[];
  dependencies?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignee?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation?: string;
  status: 'open' | 'mitigated' | 'accepted';
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  target: string;
  current?: string;
  unit: string;
  category: 'performance' | 'quality' | 'delivery' | 'user-satisfaction';
}

// Build and fix types
export interface BuildAndFixResult {
  prettier: ToolResult;
  typescript: ToolResult;
  tests: ToolResult;
  totalErrors: number;
  autoFixed: number;
  suggestions: string[];
  blocked: boolean;
}

export interface ToolResult {
  success: boolean;
  exitCode: number;
  output: string;
  errors: string[];
  warnings: string[];
  duration: number;
}

// Code review types
export interface CodeReviewResult {
  summary: string;
  score: number;
  categories: ReviewCategory[];
  suggestions: string[];
  guardrails: GuardrailFinding[];
  architecturalIssues: ArchitecturalIssue[];
}

export interface ReviewCategory {
  name: string;
  score: number;
  findings: string[];
}

export interface GuardrailFinding {
  type: 'block' | 'warn' | 'suggest';
  pattern: string;
  location: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ArchitecturalIssue {
  type: 'pattern' | 'structure' | 'dependency' | 'performance';
  description: string;
  location: string;
  suggestion: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Route testing types
export interface RouteTestResult {
  route: string;
  method: string;
  authRequired: boolean;
  authProfile?: string;
  tests: TestCase[];
  summary: TestSummary;
}

export interface TestCase {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  error?: string;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  successRate: number;
}

// Route research types
export interface RouteResearchResult {
  route: string;
  routeAnalysis: ToolResult;
  dependencies: ToolResult;
  testSuggestions: string[];
  coverageGap: string[];
  testFiles: string[];
  complexity: number;
  blocked: boolean;
}

// Plugin system types
export interface PluginResult {
  name: string;
  version: string;
  status: 'installed' | 'uninstalled' | 'failed';
  operations: PluginOperation[];
  summary: string;
}

export interface PluginOperation {
  action: 'install' | 'uninstall' | 'configure' | 'activate' | 'deactivate' | 'list';
  target: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
}

// Note: Validation schemas removed to avoid zod dependency
// Implement runtime validation in handlers instead