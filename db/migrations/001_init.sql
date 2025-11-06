-- Habilita función gen_random_uuid(); usa uuid-ossp si prefieres uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sf_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  editor TEXT,
  repo TEXT,
  task TEXT,
  skill TEXT,
  activation_latency_ms INT,
  run_latency_ms INT,
  policy_decision TEXT CHECK (policy_decision IN ('allow','deny') OR policy_decision IS NULL),
  policy_tool TEXT,
  adr_applied TEXT[],
  labels TEXT[],
  evidence_id UUID,
  extra JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sf_events_ts ON sf_events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_sf_events_skill ON sf_events (skill);
CREATE INDEX IF NOT EXISTS idx_sf_events_policy ON sf_events (policy_decision);

CREATE TABLE IF NOT EXISTS sf_runs (
  evidence_id UUID PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  skill_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned','dry-run','running','succeeded','failed')),
  stdout TEXT,
  artifacts JSONB DEFAULT '[]'::jsonb,
  changes JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sf_runs_skill ON sf_runs (skill_id);

CREATE TABLE IF NOT EXISTS sf_policies (
  policy_id TEXT PRIMARY KEY,
  tool TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT false,
  scope TEXT DEFAULT 'global',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sf_policies_tool ON sf_policies (tool);

CREATE TABLE IF NOT EXISTS sf_skills (
  skill_id TEXT PRIMARY KEY,
  name TEXT,
  manifest JSONB NOT NULL,
  allowed_tools JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

