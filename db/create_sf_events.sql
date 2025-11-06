-- Script para crear la tabla sf_events
-- Ejecutar con: psql -h 127.0.0.1 -U felipe -d sf_db -f db/create_sf_events.sql
-- O dentro de psql: \i db/create_sf_events.sql

-- Habilita función gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crea la tabla sf_events si no existe
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

-- Índices para optimizar consultas comunes
CREATE INDEX IF NOT EXISTS idx_sf_events_ts ON sf_events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_sf_events_skill ON sf_events (skill);
CREATE INDEX IF NOT EXISTS idx_sf_events_policy ON sf_events (policy_decision);

-- Verificar que la tabla se creó correctamente
SELECT 
  'Tabla sf_events creada exitosamente' AS mensaje,
  COUNT(*) AS total_registros
FROM sf_events;

