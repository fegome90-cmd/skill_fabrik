# Contexto Técnico - Skills Fabrik

> **Schema Version**: 1.0
> **Project Type**: infrastructure|development|automation
> **Created**: 2025-01-15T00:00:00Z
> **Last Updated**: 2025-11-06T15:05:37Z
> **Locale**: es-ES
> **Complexity**: enterprise
> **Filosofía**: "Menos (y Mejor) es Más" + CLOOP Methodology

---

## 🏗️ **METADATA DEL PROYECTO**

```json
{
  "schema_version": "1.0",
  "project_id": "skills-fabrik",
  "project_name": "Skills Fabrik - CLOOP Development Automation System",
  "created": "2025-01-15T00:00:00Z",
  "last_updated": "2025-11-06T15:05:37Z",
  "locale": "es-ES",
  "project_type": "infrastructure|automation",
  "complexity": "enterprise",
  "domain": "Development Automation, AI-Assisted Development, Quality Gates",
  "maintainer": "Skills Fabrik Team",
  "repository": "https://github.com/TU-USUARIO/skills-fabrik",
  "documentation": "docs/",
  "philosophy": "Menos (y Mejor) es Más + CLOOP (Clarify, Layout, Operate, Observe, Reflect)"
}
```

---

## 🎯 **PROPÓSITO Y ALCANCE**

### **Objetivo Principal**
Skills Fabrik es un sistema de automatización de desarrollo que implementa la metodología CLOOP (Context, Learning, Options, Outcomes, Planning) para acelerar y mejorar la calidad del desarrollo de software. Proporciona un sistema editor-agnóstico de activación de skills con quality gates integrados, documentación estructurada (dev-docs), y monitoreo en tiempo real.

El sistema actúa como un "asistente inteligente" que detecta la intención del desarrollador, activa las skills relevantes, ejecuta validaciones de calidad automáticas, y proporciona retroalimentación continua para mantener los estándares de código y arquitectura.

### **Problema que Resuelve**
- **Problema Principal**: Fragmentación en herramientas de desarrollo, falta de consistencia en calidad de código, procesos manuales repetitivos, y pérdida de contexto en proyectos complejos
- **Impacto**: Reducción del 91% en latencia de activación (5163ms → 466ms), 93.5% de adherencia a estándares, y 100% de tasa de éxito en tests
- **Solución Propuesta**: Sistema multi-servicio con CLI → Router → Daemon, activación inteligente de skills, quality gates automáticos, y monitoreo en tiempo real

### **Alcance del Proyecto**
- **Incluye**: 
  - CLI de gestión de skills (33 skills indexados, 28 validados en modo estricto)
  - Router con hooks pre/post invocación (Cursor IDE integration via PBv2)
  - Daemon core service con REST API (Fastify-based, puerto 7727)
  - Service Discovery centralizado (puerto 8877)
  - Sistema de quality gates (G1-G8: build, lint, activation, guardrails)
  - Dashboard en tiempo real con WebSocket (puerto 8888, opcional)
  - Sistema de skills organizado por categorías (guidelines, guardrails, workflows, generators)
  - Prompt Builder v2 con scoring avanzado y TAGs system
  - MemTech (Multi-tier storage: L0 local, L1 cache, L2 PostgreSQL, L3 Redis/ChromaDB opcional)

- **Excluye**: 
  - Hosting en la nube (self-hosted)
  - Gestión de usuarios multi-tenant
  - Integración directa con VSCode/JetBrains (usa adaptadores MCP)

- **Dependencies**: 
  - Node.js ≥ 18
  - pnpm ≥ 8
  - PM2 para gestión de procesos
  - PostgreSQL (opcional, para persistencia L2)
  - Redis/ChromaDB (opcional, para L3)

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Visión General de Arquitectura**

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Interface Layer                     │
│  skills-cli (commands: skills, plan, kpi, dashboard, etc)   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Router Service (Port 3000)                │
│  • Pre-invoke hooks (userPromptSubmit)                       │
│  • Post-response hooks (stop)                                │
│  • PBv2 Activator (3-stage pipeline)                         │
│  • Quality Gates integration                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Daemon Service (Port 7727)                 │
│  • Core execution service                                    │
│  • REST API (Fastify)                                        │
│  • Skill activation engine                                   │
│  • Event store                                               │
│  • Rate limiting & CORS                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌──────────────────┐
│ Service       │   │ MemTech Storage  │
│ Discovery     │   │ L0: .sf/         │
│ (Port 8877)   │   │ L1: .sf/cache/   │
│               │   │ L2: PostgreSQL   │
│               │   │ L3: Redis/Chroma │
└───────────────┘   └──────────────────┘

Optional:
┌─────────────────────────────────────────┐
│   Dashboard (Port 8888, WebSocket 8889) │
│   Real-time monitoring & KPIs           │
└─────────────────────────────────────────┘
```

**Flujo de Comunicación**:
```
User → CLI Request → Router (3000) → Daemon (7727) → Storage/DB
         ↓                                ↓
    Service Discovery (8877)      Event Store & Metrics
```

### **Componentes Principales**

#### **CLI - Command Line Interface**
```yaml
component:
  name: "skills-cli"
  type: "CLI Application"
  technology: "Node.js + TypeScript + Commander.js"
  port: "N/A (client-side)"
  health_check: "N/A"
  dependencies:
    - "router (3000)"
    - "daemon (7727) - optional direct access"
  configuration:
    package: "@skills-fabrik/skills-cli"
    entry_point: "dist/index.js"
    commands:
      - "skills check|lint|index|pack|verify|install"
      - "plan create"
      - "dev-docs create"
      - "kpi show"
      - "dashboard start|stop|status|health"
      - "guardrail <query>"
```

#### **Router - Pre/Post Hooks & Activation**
```yaml
component:
  name: "router-service"
  type: "HTTP Service"
  technology: "Node.js + TypeScript + Fastify"
  port: 3000
  health_check: "http://127.0.0.1:3000/health"
  dependencies:
    - "sf-daemon (7727)"
  configuration:
    package: "@skills-fabrik/router"
    entry_point: "dist/cli/start-router-server.js"
    hooks:
      userPromptSubmit:
        enabled: true
        threshold: 0.45
        maxSkills: 7
        fuzzy_matching: 0.7
        contextual_boost:
          fileContext: 0.15
          recentActivation: 0.10
          keywordDensity: 0.05
          intentMatch: 0.12
      stop:
        quality_gates: ["buildCheck", "lint", "prettier"]
        security_validation: ["sql_injection", "xss", "path_traversal", "command_injection"]
        bash_validator: true
        notifications: true
```

#### **Daemon - Core Service**
```yaml
component:
  name: "sf-daemon"
  type: "REST API Service"
  technology: "Node.js + TypeScript + Fastify 4.x"
  port: 7727
  health_check: "http://127.0.0.1:7727/health"
  dependencies:
    - "PostgreSQL (optional, L2 storage)"
    - "Redis (optional, L3 cache)"
  configuration:
    package: "@skills-fabrik/daemon"
    entry_point: "dist/index.js"
    features:
      rate_limiting:
        max: 100
        window: "1 minute"
        allowlist: ["127.0.0.1", "::1"]
      cors:
        origins: ["http://localhost:*"]
        credentials: true
      compression: true
    pm2:
      instances: 1
      exec_mode: "fork"
      max_memory_restart: "400M"
      autorestart: true
```

#### **Service Discovery - Central Registry**
```yaml
component:
  name: "service-discovery"
  type: "Service Registry"
  technology: "Node.js + TypeScript + Fastify 4.x"
  port: 8877
  health_check: "http://127.0.0.1:8877/health"
  dependencies: []
  configuration:
    package: "@skills-fabrik/shared"
    entry_point: "dist/cli/start-discovery-server.js"
    purpose: "Centralized service health checking and discovery"
    pm2:
      instances: 1
      exec_mode: "fork"
      max_memory_restart: "200M"
```

### **Flujo de Datos**

```yaml
data_flow:
  input_sources:
    - name: "User Command"
      type: "CLI Input"
      format: "Command line arguments + flags"
      validation: "Commander.js schema validation"
    
    - name: "IDE Hook Trigger"
      type: "Cursor IDE Event"
      format: "JSON payload with user prompt + context"
      validation: "PBv2 pipeline validation"

  processing_pipeline:
    - step: 1
      component: "Router"
      rules: "Detect intent, match skills (fuzzy + contextual boost)"
    
    - step: 2
      component: "Daemon"
      logic: "Execute skill activation, apply guardrails"
    
    - step: 3
      component: "Quality Gates"
      validation: "Run build, lint, security checks"
    
    - step: 4
      component: "Event Store"
      destination: "obs/kpi/events.jsonl + PostgreSQL"

  output_destinations:
    - name: "CLI Output"
      type: "Terminal STDOUT/STDERR"
      format: "Formatted text + ANSI colors"
    
    - name: "Metrics Storage"
      type: "File + Database"
      format: "JSONL + SQL"
```

---

## 🛠️ **STACK TECNOLÓGICO**

### **Frontend**
```yaml
frontend:
  framework: "N/A (CLI-based system)"
  dashboard_ui: "HTML + WebSocket (port 8888)"
  language: "TypeScript"
  styling: "Terminal ANSI colors + ASCII art"
  state_management: "In-memory (process-level)"
  testing: "Playwright E2E for CLI commands"
  deployment: "N/A (local execution)"
```

### **Backend**
```yaml
backend:
  framework: "Fastify 4.x"
  language: "TypeScript (ES Modules)"
  runtime: "Node.js ≥ 18"
  database: "PostgreSQL (optional, L2 tier)"
  orm: "Raw SQL + pg client"
  cache: "Redis (optional, L3 tier) + File-based (L1 tier)"
  queue: "In-process + Event Store (JSONL)"
  deployment: "PM2 process manager"
  packages:
    core:
      - "@fastify/cors ^8.4.0"
      - "@fastify/rate-limit"
      - "@fastify/compress"
      - "ajv 8.x + ajv-formats"
    cli:
      - "commander.js"
      - "inquirer"
      - "chalk"
      - "ora (spinners)"
```

### **DevOps e Infraestructura**
```yaml
devops:
  containerization: "Docker (optional, not primary)"
  orchestration: "PM2 Ecosystem (scripts/pm2/ecosystem.config.cjs)"
  cicd: "GitHub Actions (planned)"
  monitoring: 
    - "PM2 monit"
    - "Custom dashboard (port 8888)"
    - "KPI aggregation (obs/kpi/)"
  logging:
    - "File-based: packages/*/logs/*.log"
    - "JSON format for PM2"
    - "Event store: obs/kpi/events.jsonl"
  security:
    - "Rate limiting (daemon)"
    - "API key authentication (planned)"
    - "Bash validator (router hooks)"
    - "Security gates (SQL injection, XSS, path traversal)"
  performance:
    - "91% latency reduction (5163ms → 466ms)"
    - "93.5% adherence rate"
    - "100% test pass rate (20/20 tests)"
```

### **Integraciones Externas**
```yaml
integrations:
  - name: "Cursor IDE"
    type: "IDE Integration"
    provider: "Cursor"
    purpose: "Pre/post invoke hooks via PBv2"
    authentication: "File-based config (.cursor/hooks/hooks-config.json)"
    rate_limits: "Controlled by hook config (threshold: 0.45)"
    fallback: "Manual CLI invocation"
  
  - name: "MCP Adapters"
    type: "External Service Adapters"
    provider: "Custom"
    purpose: "Integration with external AI services"
    authentication: "API keys via env vars"
    rate_limits: "Service-specific"
    fallback: "Graceful degradation"
```

---

## 🔐 **SEGURIDAD Y VALIDACIÓN**

### **Framework de Seguridad**
```yaml
security:
  authentication:
    method: "API Key (planned for remote deployment)"
    provider: "Internal"
    token_expiry: "N/A (stateless)"
    refresh_strategy: "Manual rotation"

  authorization:
    model: "Allowlist-based (localhost by default)"
    roles: ["admin", "developer", "readonly"]
    permissions: "Defined in daemon config"

  data_protection:
    encryption: "TLS for remote connections (via Cloudflare/Nginx)"
    hashing: "bcrypt for API keys (if implemented)"
    compliance: "N/A (self-hosted)"

  security_gates:
    - name: "SQL Injection Prevention"
      enabled: true
      rules: ["Detect raw SQL with user input", "BLOCK deleteMany() without where"]
    
    - name: "XSS Prevention"
      enabled: true
      rules: ["Detect innerHTML with user input", "WARN on unsafe DOM manipulation"]
    
    - name: "Command Injection Prevention"
      enabled: true
      rules: ["Bash validator in router hooks", "BLOCK shell commands with unsanitized input"]
    
    - name: "Path Traversal Prevention"
      enabled: true
      rules: ["Validate file paths", "BLOCK ../ in user input"]
    
    - name: "Rate Limiting"
      enabled: true
      limits: "100 req/min per IP (daemon)"
    
    - name: "Secret Detection"
      enabled: true
      retention: "Scan for hardcoded secrets in code"
```

### **Validación de Calidad**
```yaml
quality_gates:
  code_quality:
    eslint: "enabled"
    prettier: "enabled"
    typescript_strict: true
    coverage_threshold: "90%+ (target)"
  
  performance:
    response_time_ms: 466  # Average activation latency
    throughput_rps: "Not measured (local system)"
    memory_usage_mb: 400  # Daemon max
    error_rate_percent: 0  # 20/20 tests passing
  
  security:
    vulnerability_scan: "npm audit"
    dependency_check: "pnpm audit"
    secret_detection: "Manual review + planned automation"
```

---

## 📊 **CONFIGURACIÓN Y POLÍTICAS**

### **Configuration Management**
```yaml
configuration:
  environment_variables:
    required:
      - name: "NODE_ENV"
        description: "Environment (development|production|testing)"
        validation: "enum"
      
      - name: "SF_PORT"
        description: "Daemon port (default: 7727)"
        validation: "number, 1024-65535"
      
      - name: "ROUTER_PORT"
        description: "Router port (default: 3000)"
        validation: "number, 1024-65535"
      
      - name: "DISCOVERY_PORT"
        description: "Service discovery port (default: 8877)"
        validation: "number, 1024-65535"

    optional:
      - name: "DATABASE_URL"
        description: "PostgreSQL connection string (L2 tier)"
        default: "N/A (file-based fallback)"
      
      - name: "REDIS_URL"
        description: "Redis connection string (L3 tier)"
        default: "N/A (disabled by default)"
      
      - name: "SF_DASHBOARD_ENABLED"
        description: "Enable real-time dashboard"
        default: "false"
      
      - name: "SF_API_KEY"
        description: "API key for remote access (planned)"
        default: "N/A"

  configuration_files:
    - path: "configs/skill-rules.json"
      format: "JSON"
      purpose: "Skill activation rules and thresholds"
      validation: "JSON Schema (test:skill-rules-schema)"
    
    - path: "registry/index.json"
      format: "JSON"
      purpose: "Compiled skill metadata (33 skills indexed)"
      validation: "Auto-generated by CLI"
    
    - path: ".cursor/hooks/hooks-config.json"
      format: "JSON"
      purpose: "Cursor IDE integration config"
      validation: "Manual + test suite (138 tests, 90.4% success)"
    
    - path: "scripts/pm2/ecosystem.config.cjs"
      format: "CommonJS"
      purpose: "PM2 service definitions"
      validation: "PM2 schema"
    
    - path: ".env.{environment}"
      format: "dotenv"
      purpose: "Environment-specific variables"
      validation: "Manual"
```

### **Políticas del Proyecto**
```yaml
policies:
  code_review:
    required_reviewers: 1
    auto_merge_disabled: true
    pr_templates: "PULL_REQUEST_TEMPLATE.md"

  testing:
    unit_tests_required: true
    integration_tests_required: true
    e2e_tests_required: true
    coverage_minimum: "80%"
    phases:
      - "Phase 1: Build + lint + schema (fast)"
      - "Phase 2: Integration tests (service communication)"
      - "Phase 3: Full system tests (20/20 passing)"

  deployment:
    environments: ["development", "production", "testing"]
    promotion_strategy: "Manual approval required"
    rollback_strategy: "PM2 restart with previous version"

  documentation:
    api_docs_required: true
    changelog_required: true
    architecture_docs_required: true
    dev_docs_templates: ["context.md", "plan.md", "tasks.md"]
```

---

## 🔧 **INTEGRACIÓN DE HERRAMIENTAS**

### **Herramientas de Desarrollo**
```yaml
development_tools:
  ide: "Cursor (primary), VS Code (supported via MCP)"
  version_control: "Git + GitHub"
  package_manager: "pnpm ≥ 8"
  debugger: "Node.js Inspector + Chrome DevTools"
  
  linting:
    tool: "ESLint + Prettier"
    config: ".eslintrc.json + .prettierrc"
    auto_fix: true

  testing:
    unit: "Node.js native test runner (node --test)"
    integration: "Custom test scripts"
    e2e: "Playwright (test/e2e-real/)"
```

### **Herramientas de Monitoreo**
```yaml
monitoring_tools:
  application_monitoring:
    tool: "Custom KPI aggregation"
    metrics: ["activation_latency", "adherence_rate", "test_success_rate"]
    alerts: "Terminal notifications + dashboard"

  infrastructure_monitoring:
    tool: "PM2 + Custom health checks"
    metrics: ["CPU", "Memory", "Uptime", "Restarts"]
    dashboards: "pm2 monit + skills-cli dashboard"

  logging:
    tool: "Fastify logger + PM2 logs"
    level: "info (dev), warn (prod)"
    format: "JSON for PM2, text for development"
    retention: "Rotated logs in packages/*/logs/"
```

### **Herramientas de Despliegue**
```yaml
deployment_tools:
  containerization:
    tool: "Docker (optional)"
    base_images: "node:18-alpine"
    build_strategy: "Multi-stage builds"

  orchestration:
    tool: "PM2"
    manifests: "scripts/pm2/ecosystem.config.cjs"

  cicd:
    platform: "GitHub Actions (planned)"
    pipelines: ["build", "test", "lint", "deploy"]
    environments: ["development", "production"]
```

---

## 📈 **MÉTRICAS Y PERFORMANCE**

### **Métricas de Performance**
```yaml
performance_metrics:
  response_time:
    target_ms: 500
    current_avg_ms: 466
    improvement: "91% reduction from 5163ms"

  throughput:
    target_rps: "N/A (local system)"
    concurrent_skills: 7  # Max skills per activation

  availability:
    target_percent: 99.9
    maintenance_windows: "Manual, announced"

  error_rate:
    target_percent: 0
    current_percent: 0  # 20/20 tests passing
    critical_threshold: 5
```

### **Métricas de Calidad**
```yaml
quality_metrics:
  code_quality:
    test_coverage: "Target: 90%+"
    skill_validation: "28/33 in strict mode (84.8%)"
    adherence_rate: "93.5%"

  skills:
    total_indexed: 33
    validated_strict: 28
    categories: ["guidelines", "guardrails", "workflows", "generators", "test", "quality", "security", "performance", "data"]

  testing:
    total_tests: 20
    passing_tests: 20
    success_rate: "100%"
    test_phases: 3
```

---

## 🔄 **FLUJO DE TRABAJO**

### **Development Workflow**
```yaml
workflow:
  development:
    - step: "Setup environment"
      command: "pnpm install && pnpm -w build"
    
    - step: "Start services"
      command: "pm2 start scripts/pm2/ecosystem.config.cjs --env development"
    
    - step: "Watch mode"
      command: "pnpm dev"
    
    - step: "Run tests"
      command: "pnpm test:phase3-quick"
    
    - step: "Validate quality"
      command: "pnpm gates"

  deployment:
    - step: "Clean build"
      command: "pnpm clean && pnpm -w build"
    
    - step: "Run full test suite"
      command: "pnpm test:phase3"
    
    - step: "Validate skills"
      command: "pnpm skills:lint"
    
    - step: "Deploy to production"
      command: "pm2 start scripts/pm2/ecosystem.config.cjs --env production"
    
    - step: "Verify health"
      command: "skills-cli dashboard health"
```

### **Procesos de Calidad**
```yaml
quality_processes:
  code_review:
    reviewers_required: 1
    automated_checks: ["build", "lint", "test"]
    approval_required: true

  testing:
    unit_tests: "node --test packages/*/test/*.spec.mjs"
    integration_tests: "pnpm test:daemon:* + pnpm test:policy:*"
    e2e_tests: "pnpm test:activation-cases"
    performance_tests: "pnpm bench:activate"

  security:
    vulnerability_scan: "pnpm audit"
    dependency_check: "npm audit"
    secret_scan: "Manual + router bash validator"
```

---

## 📚 **DOCUMENTACIÓN Y RECURSOS**

### **Documentación Requerida**
```yaml
documentation:
  technical_docs:
    - file: "CLAUDE.md"
      purpose: "AI assistant guidance and project overview"
      owner: "Core Team"
      update_frequency: "Per major feature"
    
    - file: "docs/architecture/activation-core.md"
      purpose: "Activation engine architecture"
      owner: "Core Team"
      update_frequency: "Per architecture change"
    
    - file: "README.md (per package)"
      purpose: "Package-specific documentation"
      owner: "Package maintainer"
      update_frequency: "Per release"

  process_docs:
    - file: "context.md"
      purpose: "Technical context and architecture (this file)"
      owner: "Core Team"
      update_frequency: "Monthly or per major change"
    
    - file: "plan.md"
      purpose: "Strategic planning (CLOOP methodology)"
      owner: "Project Lead"
      update_frequency: "Per sprint/milestone"
    
    - file: "tasks.md"
      purpose: "Task tracking and progress"
      owner: "Development Team"
      update_frequency: "Daily/weekly"
```

### **Recursos Externos**
```yaml
external_resources:
  documentation:
    - name: "Fastify Documentation"
      url: "https://fastify.dev"
      purpose: "Backend framework reference"
    
    - name: "PM2 Documentation"
      url: "https://pm2.keymetrics.io"
      purpose: "Process management reference"
    
    - name: "CLOOP Methodology"
      url: "Internal documentation"
      purpose: "Development methodology guide"

  tools:
    - name: "pnpm Workspaces"
      url: "https://pnpm.io/workspaces"
      purpose: "Monorepo management"
    
    - name: "TypeScript"
      url: "https://www.typescriptlang.org"
      purpose: "Language reference"
```

---

## 🚨 **MANEJO DE ERRORES Y INCIDENTES**

### **Strategy de Manejo de Errores**
```yaml
error_handling:
  logging:
    level: "info (dev), warn (prod)"
    format: "JSON for PM2, structured for daemon"
    fields: ["timestamp", "level", "message", "service", "context"]

  monitoring:
    alerts: "Terminal notifications + dashboard alerts"
    escalation: "PM2 auto-restart → Manual intervention"

  recovery:
    automatic_retry: "PM2 max_restarts: 10"
    circuit_breaker: "Rate limiting prevents cascade failures"
    fallback_services: "File-based storage when DB unavailable"
```

### **Incident Response**
```yaml
incident_response:
  severity_levels:
    - level: "P0 - Critical"
      response_time: "Immediate"
      escalation: "All services down, data loss risk"
      examples: ["Daemon won't start", "Database corruption"]
    
    - level: "P1 - High"
      response_time: "< 1 hour"
      escalation: "Core feature broken, workaround available"
      examples: ["Skill activation failing", "Quality gates not running"]
    
    - level: "P2 - Medium"
      response_time: "< 1 day"
      escalation: "Non-critical feature affected"
      examples: ["Dashboard not loading", "Slow performance"]

  communication:
    channels: ["GitHub Issues", "Team Chat", "Email"]
    stakeholders: ["Development Team", "Users"]
    templates: "ISSUE_TEMPLATE.md"
```

---

## 📞 **CONTACTO Y RESPONSABILIDADES**

### **Equipo del Proyecto**
```yaml
team:
  project_lead:
    name: "TBD"
    email: "project-lead@example.com"
    slack: "@project-lead"
    responsibilities: ["Strategic direction", "Roadmap", "Stakeholder communication"]

  technical_lead:
    name: "TBD"
    email: "tech-lead@example.com"
    slack: "@tech-lead"
    responsibilities: ["Architecture decisions", "Code review", "Technical debt management"]

  devops:
    name: "TBD"
    email: "devops@example.com"
    slack: "@devops"
    responsibilities: ["Deployment", "Monitoring", "Infrastructure"]
```

### **Información de Contacto**
```yaml
contact_info:
  primary_contact:
    email: "skills-fabrik@example.com"
    slack: "#skills-fabrik"
    phone: "N/A"

  escalation:
    level1: "GitHub Issues"
    level2: "Team Chat"
    level3: "Email to project lead"

  documentation:
    repository: "https://github.com/TU-USUARIO/skills-fabrik"
    wiki: "docs/"
    confluence: "N/A"
```

---

## ✅ **VALIDATION GATES**

### **Gate de Inicio**
- [ ] Node.js ≥ 18 instalado
- [ ] pnpm ≥ 8 instalado
- [ ] PM2 instalado globalmente
- [ ] PostgreSQL configurado (opcional, para L2 tier)
- [ ] Redis configurado (opcional, para L3 tier)
- [ ] Variables de entorno configuradas (.env.{environment})
- [ ] Repositorio clonado y dependencias instaladas (`pnpm install`)

### **Gate de Ejecución**
- [ ] Build exitoso: `pnpm -w build`
- [ ] Tests Phase 1 pasando: `pnpm test:phase1`
- [ ] Tests Phase 2 pasando: `pnpm test:phase2`
- [ ] Tests Phase 3 pasando: `pnpm test:phase3` (20/20 tests)
- [ ] Skills validados: `pnpm skills:lint --strict` (28/33 passing)
- [ ] Servicios levantados: `pm2 status` (all online)
- [ ] Health checks OK: `skills-cli dashboard health`

### **Gate de Finalización**
- [ ] Quality gates pasando: `pnpm gates` (G1-G8)
- [ ] Métricas generadas: `pnpm kpi:gen`
- [ ] Logs limpios: No errores críticos en `packages/*/logs/`
- [ ] Documentación actualizada: CLAUDE.md, context.md, plan.md
- [ ] PR creado y revisado
- [ ] Deployment exitoso: `pm2 list` confirma servicios running
- [ ] Smoke tests pasan