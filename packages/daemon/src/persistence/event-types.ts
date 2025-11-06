export type ActivationEvent = {
  kind: 'activate';
  ts: string; // ISO date
  intent: string;
  results_len: number;
  cache_hit: boolean;
  latency_ms: number;
};

export type ExecuteEvent = {
  kind: 'execute';
  ts: string; // ISO date
  skill_id: string;
  dry_run: boolean;
  run_latency_ms: number;
  policy_level: string;
};

export type SystemEvent = {
  kind: 'system';
  ts: string;
  message: string;
  level?: 'info' | 'warn' | 'error';
};

export type PersistedEvent = ActivationEvent | ExecuteEvent | SystemEvent;

