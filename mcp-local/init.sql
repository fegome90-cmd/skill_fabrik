-- Inicialización de base de datos para MemTech
-- Creado para MCP Local Deployment

-- Tabla para contexto de memoria (L2)
CREATE TABLE IF NOT EXISTS memory_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  storage_layer VARCHAR(2) NOT NULL DEFAULT 'L2',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para métricas de KPIs
CREATE TABLE IF NOT EXISTS kpi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(100) DEFAULT 'mcp-local',
  metrics JSONB DEFAULT '{}'
);

-- Tabla para snapshots de planes
CREATE TABLE IF NOT EXISTS plan_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR(255) UNIQUE NOT NULL,
  task TEXT NOT NULL,
  phases JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  uri TEXT,
  storage_layer VARCHAR(2) DEFAULT 'L1'
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_memory_context_key ON memory_context(key);
CREATE INDEX IF NOT EXISTS idx_memory_context_layer ON memory_context(storage_layer);
CREATE INDEX IF NOT EXISTS idx_memory_context_expires ON memory_context(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kpi_events_name ON kpi_events(event_name);
CREATE INDEX IF NOT EXISTS idx_kpi_events_timestamp ON kpi_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_kpi_events_source ON kpi_events(source);

CREATE INDEX IF NOT EXISTS idx_plan_snapshots_id ON plan_snapshots(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_snapshots_status ON plan_snapshots(status);

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
