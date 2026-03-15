# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Skills Fabric** is a monorepo implementing the CLOOP methodology (Context, Learning, Options, Outcomes, Planning) for development automation. It provides an editor-agnostic skill activation system with quality gates, structured dev-docs, and real-time monitoring.

**Architecture**: Multi-service system with CLI → Router (port 3000) → Daemon (port 7727), with centralized service discovery (port 8877). Services managed via PM2.

**Status**:

- 33 indexed skills (28 validated in strict mode)
- 20/20 tests passing (100% success rate)
- 91% latency reduction (5163ms → 466ms)
- 93.5% adherence rate

## Common Commands

### Setup & Build

```bash
# Initial setup
pnpm install && pnpm -w build

# Global CLI installation (optional)
pnpm --filter @skills-fabrik/skills-cli link --global

# Clean build
pnpm clean && pnpm -w build
```

### Development Workflow

```bash
# Dev mode (watch)
pnpm dev

# Fast validation: build + lint + schema
pnpm test:phase3-quick

# Full Phase 3 test suite
pnpm test:phase3

# Run all quality gates
pnpm gates
```

### Testing

```bash
# Run all tests
pnpm test

# Individual test suites
pnpm test:skill-rules-schema          # T002 - Schema validation
pnpm test:activation-cases            # T004-T006 - Activation tests
pnpm test:daemon:smoke               # Daemon health
pnpm test:daemon:auth                # Auth tests
pnpm test:daemon:client              # Client tests
pnpm test:policy:s1                  # Policy tests
pnpm test:pack                       # Pack tests
pnpm test:verify                     # Verify tests
pnpm test:install                    # Install tests

# Single test file
node --test packages/daemon/test/health.smoke.spec.mjs
```

### Skill Management

```bash
# Validate skills
pnpm skills:lint

# Check activation for task
skills-cli skills check "implement auth" --v2

# Index skills
skills-cli skills index ./skills --out ./registry/index.json

# Pack/verify/install workflow
skills-cli skills pack skills/repo-auditor --out ./.registry
skills-cli skills verify ./.registry/repo-auditor-0.1.0.tgz
skills-cli skills install file://./.registry/repo-auditor-0.1.0.tgz --target ./.skills-installed
```

### Code Quality

```bash
pnpm lint                    # Check lint and format
pnpm lint:fix               # Fix lint and format issues
pnpm format                 # Format code only
```

### System Monitoring

```bash
# View metrics and KPIs
pnpm kpi:show
skills-cli kpi --days 7
skills-cli dashboard health

# PM2 service management
pm2 start scripts/pm2/ecosystem.config.cjs --env development
pm2 status
pm2 monit
pm2 logs <service-name> --lines 200
```

## High-Level Architecture

### Multi-Service System

**Communication Flow**:

```
CLI Request → Router (3000) → Daemon (7727)
     ↓
Service Discovery (8877) - centralized registry
```

**Services**:

| Package                     | Port | Purpose                                  | Dependencies          |
| --------------------------- | ---- | ---------------------------------------- | --------------------- |
| `@skills-fabrik/skills-cli` | N/A  | CLI interface, skill management          | Router                |
| `@skills-fabrik/router`     | 3000 | Pre-invoke/stop hooks, activation engine | Daemon                |
| `@skills-fabrik/daemon`     | 7727 | Core execution service, REST API         | PostgreSQL (optional) |
| `@skills-fabrik/shared`     | 8877 | Service discovery, health checking       | None                  |

### Memory Technology (MemTech) - Multi-Tier Storage

**L0 (Local)**: `.sf/` directory - immediate access, runtime data
**L1 (Cache)**: `.sf/cache/` - performance optimization layer
**L2 (Persistent)**: PostgreSQL - primary database
**L3 (Optional)**: Redis/ChromaDB - advanced caching (disabled by default)

### Package Structure

```
packages/
├── skills-cli/          # Main CLI interface
├── router/              # Activation engine (TypeScript)
├── daemon/              # Core service with REST API
├── shared/              # Service discovery & health checks
├── mcp-adapters/        # External service adapters
├── kpi/                 # Metrics & KPI aggregation
└── slash-commands/      # Slash command system
```

### Skills Organization

```
skills/
├── guidelines/          # Development best practices (backend-dev, frontend-dev, etc.)
├── guardrails/          # Safety checks (database-verification, secrets-and-config)
├── workflows/           # CLOOP automation
├── generators/          # Plan and test generation
├── test/               # Testing skills (cli-integration, visual-regression, webapp)
├── quality/            # Code quality
├── security/           # Security testing
├── performance/        # Performance optimization
└── data/               # Database management
```

**Skill Structure**: Each skill = `SKILL.md` (≤400 lines) + `resources/` + `scripts/`

## CLOOP Methodology

**5-Phase Development Process**:

1. **Clarify** → Define objectives and success criteria
2. **Layout** → Create minimal executable plan
3. **Operate** → Execute workflow iteratively
4. **Observe** → Collect metrics and evidence
5. **Reflect** → Metacognition analysis and improvements

### Commands

```bash
# Create structured plans (CLOOP)
skills-cli plan create "Feature X" --v2

# Generate development docs
skills-cli dev-docs create "feature" --v2

# Initialize CLOOP project
skills-cli init cloop
```

## Cursor IDE Integration

**Configuration**: `.cursor/hooks/hooks-config.json` controls PBv2 hook system

### userPromptSubmit Hook (Pre-invoke)

- **Enabled**: true, threshold: 0.45, maxSkills: 7
- **Fuzzy Matching**: threshold 0.7
- **Contextual Boost**: fileContext (0.15), recentActivation (0.10), keywordDensity (0.05), intentMatch (0.12)
- **Plan Detection**: Auto-detects CLOOP plans via patterns

### stop Hook (Post-response)

- **Quality Gates**: buildCheck, lint, prettier enabled
- **Security Validation**: SQL injection, XSS, path traversal, command injection checks
- **Bash Validator**: Blocks dangerous commands
- **Notifications**: Success/warning/error alerts

### PBv2 Activator

- **3-Stage Pipeline**: plan-detector → pbv2-activator → pbv2-integration
- **Testing Framework**: 138 tests, 90.4% success rate
- **Modes**: logOnly (default), onDemand, auto

## Service Management (PM2)

### Start Services

```bash
# All services
pm2 start scripts/pm2/ecosystem.config.cjs --env development

# Individual services
pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon --env development
pm2 start scripts/pm2/ecosystem.config.cjs --only service-discovery --env development
pm2 start scripts/pm2/ecosystem.config.cjs --only router-service --env development
```

### Health Checks

```bash
# Individual service health
curl http://127.0.0.1:7727/health  # Daemon
curl http://127.0.0.1:3000/health  # Router
curl http://127.0.0.1:8877/health  # Discovery

# Via CLI
skills-cli dashboard health
```

### Common Issues

```bash
# Services stuck in "waiting" - ensure process.send('ready') or remove wait_ready
pm2 delete <service-name> && pm2 start scripts/pm2/ecosystem.config.cjs --only <service-name> --env development

# CORS errors - uses @fastify/cors ^8.4.0 (Fastify 4.x compatible)
# For Fastify 5, upgrade to @fastify/cors ^11

# Restart with new environment
pm2 restart <service-name> --update-env
```

## Quality Gates (G1-G8)

### Priority Classification

- **P0 (Critical)**: Build/lint, activation, guardrails - Blocks merge
- **P1 (High)**: Notifications, content health - Non-blocking
- **P2 (Medium)**: Documentation, optional checks

### Enforcement Levels

- **BLOCK**: Critical patterns (e.g., `deleteMany()` without `where`)
- **WARN**: High-risk patterns (e.g., `updateMany()` without `where`)
- **SUGGEST**: Best practices
- **REQUIRE**: Mandatory checks

### Run Quality Gates

```bash
pnpm gates

# Individual gates
pnpm -w build                        # G1 - Build
pnpm test:activation-cases          # G2 - Activation
skills-cli guardrail "query"         # G3 - Guardrails
```

## Prompt Builder v2

**Advanced prompt optimization** with 8-component structure:

- **TAGs System**: Auto contextual tags [K], [C], [U], [EVIDENCIA], [PROPUESTA]
- **Template Coverage**: 100% structured templates
- **Quality Scoring**: Expected scores (0.2-0.4 typical)

### Usage

```bash
skills-cli skills check "task" --v2
```

### Example Output

```
✅ Found 2 matching skill(s):
  ✓ backend-dev-guidelines (40.0%)
  ✓ database-verification (20.0%)

🔍 Enhanced analysis with Prompt Builder v2:
  📊 Expected score: 0.2
  🏷️  TAGs coverage: 20%
  🔗 Template coverage: 100%
  ⚡ Skill activations: backend-dev-guidelines, database-verification
```

### Debug Mode

```bash
skills-cli skills check "task" --v2 --debug --verbose
```

## Configuration Management

### Environment Setup

```bash
# Development
cp .env.example .env.development

# Production
cp .env.example .env.production

# Testing
cp .env.example .env.testing
```

### Key Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/skills_fabrik
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skills_fabrik

# Service Ports
DAEMON_PORT=7727
ROUTER_PORT=3000
DISCOVERY_PORT=8877

# Optional Services (disabled by default)
REDIS_URL=redis://localhost:6379
CHROMADB_URL=http://localhost:8000

# Dashboard
SF_DASHBOARD_ENABLED=true
SF_DASHBOARD_PORT=8888

# Development Settings
NODE_ENV=development
LOG_LEVEL=info
SF_USE_SHARED_RULES=1
SF_USE_SHARED_SIGNALS=1

# Skill Activation
SKILL_ACTIVATION_THRESHOLD=0.45
MAX_SKILLS_PER_REQUEST=7
```

### Core Configuration Files

- `configs/skill-rules.json` - Skill activation rules
- `registry/index.json` - Compiled skill metadata
- `.cursor/hooks/hooks-config.json` - IDE integration
- `scripts/pm2/ecosystem.config.cjs` - PM2 configuration
- `configs/SKILL.template.md` - Skill template

## Creating New Skills

### Using Generator

```bash
skills-cli init guideline my-new-skill
```

### Manual Creation

```bash
# 1. Create directory
mkdir -p skills/guidelines/my-new-skill

# 2. Copy template
cp configs/SKILL.template.md skills/guidelines/my-new-skill/SKILL.md

# 3. Add resources/scripts (optional)
mkdir -p skills/guidelines/my-new-skill/{resources,scripts}

# 4. Update SKILL.md frontmatter
---
id: my-new-skill
version: 0.1.0
type: guideline
summary: 'Description'
audience: engineers
when_to_use: 'When to apply'
resources:
  - resources/my-resource.md
scripts:
  - name: test-script
    run: node scripts/test-script.js
---

# 5. Validate
skills-cli skills lint ./skills --strict

# 6. Index
skills-cli skills index ./skills --out ./registry/index.json
```

## Testing Strategy

### Testing Phases

- **Phase 1**: Basic validation (build, lint, schema) - fast
- **Phase 2**: Integration tests (service communication)
- **Phase 3**: Full system tests (skill activation, guardrails, performance)

```bash
pnpm test:phase1
pnpm test:phase2
pnpm test:phase3
pnpm test:phase3-quick  # Fast validation
```

### Test Types

```bash
# Daemon tests
pnpm test:daemon:smoke       # Health checks
pnpm test:daemon:activate    # Activation boost
pnpm test:daemon:auth        # API key auth
pnpm test:daemon:client      # Client integration
pnpm test:daemon:state       # Distributed state
pnpm test:daemon:events      # Event store

# Policy tests
pnpm test:policy:s1          # Level 1 policies
pnpm test:policy:s2          # Level 2 policies
pnpm test:policy:net         # Network policies
pnpm test:policy:levels      # Policy levels

# Skill workflow tests
pnpm test:pack               # Packaging
pnpm test:verify             # Verification
pnpm test:install            # Installation
pnpm test:pack:det           # Determinism

# Performance & security
pnpm test:chaos:auto-recovery
pnpm test:security:optimize
pnpm test:performance:optimized
```

### Performance & Load Testing

```bash
pnpm bench:activate          # Benchmark activation
pnpm test:chaos:auto-recovery
pnpm test:performance:optimized

# Performance benchmarking
node scripts/bench-activate.mjs

# Load testing suites
pnpm test:e2e:scale          # End-to-end scale testing
pnpm test:boundary:enhanced  # Enhanced boundary testing
```

### Performance Metrics

**Current System Performance**:

- **Latency Reduction**: 91% (5163ms → 466ms average response time)
- **Activation Success Rate**: 93.5% adherence rate
- **Test Coverage**: 20/20 tests passing (100% success rate)
- **Skill Index**: 33 indexed skills (28 validated in strict mode)

**Benchmark Targets**:

- Skill activation: < 500ms average
- Daemon response: < 100ms average
- Router processing: < 200ms average
- Service discovery: < 50ms average

## Real-Time Monitoring Dashboard

**Access**: http://localhost:8888

### Commands

```bash
# Start dashboard
skills-cli dashboard start

# Health check
curl http://localhost:8888/health

# View status
skills-cli dashboard status
skills-cli kpi --live
```

### Endpoints

- **HTTP**: http://localhost:8888 (Web interface)
- **WebSocket**: ws://localhost:8889 (Real-time updates)

## Troubleshooting

### Services Won't Start

```bash
# Check logs
pm2 logs <service-name> --lines 200

# Check port availability
lsof -i :7727  # Daemon
lsof -i :3000  # Router
lsof -i :8877  # Discovery

# Clean restart
pm2 delete all
pm2 start scripts/pm2/ecosystem.config.cjs --env development
```

### Build Errors

```bash
# Clean rebuild
pnpm clean && pnpm -w build

# Check TypeScript errors
pnpm --filter @skills-fabrik/skills-cli build 2>&1 | grep -i error

# Check for ES modules issues
node packages/skills-cli/dist/index.js --version
```

### Skills Not Activating

```bash
# Verify index
skills-cli skills index ./skills --out ./registry/index.json

# Check rules
cat configs/skill-rules.json | jq '.skills[] | select(.id=="my-skill")'

# Test activation with debug
skills-cli skills check "test query" --v2 --debug --verbose

# Check registry integrity
node -e "require('./registry/index.json'); console.log('✅ Registry valid')"
```

### Test Failures

```bash
# Run specific test
node --test packages/daemon/test/health.smoke.spec.mjs

# Full test with logging
pnpm test:phase3 2>&1 | tee test-output.log

# Validate schema
pnpm test:skill-rules-schema

# Quick validation
pnpm test:phase3-quick
```

### Common Issues and Solutions

**ES Modules Import Errors**

```bash
# Ensure using ESM-compatible imports
# Error: Cannot find package '@skills-fabrik/kpi'
# Solution: Use local CLI or ensure proper linking
alias skills="node packages/skills-cli/dist/index.js"
```

**Services Stuck in PM2 "waiting" Status**

```bash
# Remove wait_ready from PM2 config or ensure process.send('ready')
pm2 delete <service-name>
pm2 start scripts/pm2/ecosystem.config.cjs --only <service-name> --env development
```

**CORS Issues**

```bash
# Check Fastify version compatibility
# Uses @fastify/cors ^8.4.0 for Fastify 4.x
# For Fastify 5.x, upgrade to @fastify/cors ^11
```

**Daemon Connection Refused**

```bash
# Check if daemon is running
curl http://127.0.0.1:7727/health

# Restart daemon service
pm2 restart sf-daemon
```

**Memory Leaks or High Memory Usage**

```bash
# Check PM2 monitoring
pm2 monit

# Restart service with memory limit
pm2 restart sf-daemon --update-env
```

## Repository Guidelines

### Code Style

- **TypeScript + ESM** with 2-space indents
- **File naming**: kebab-case (e.g., `prompt-builder.ts`)
- **Classes**: PascalCase
- **Functions/commands**: verbs (e.g., `activateSkill`)
- Let Prettier handle formatting

### Project Structure

- **Monorepo**: managed by pnpm workspaces
- **Core runtime**: `packages/`
- **Skills**: `skills/`
- **Adapters**: `adapters/`
- **Scripts**: `scripts/` (`.mjs`)
- **Configs**: `configs/`
- **Tests**: near source (`packages/*/test`)

### Development Workflow

1. Create feature branch
2. Make changes with tests
3. Run validation: `pnpm test:phase3-quick`
4. Submit PR with conventional commits
5. Ensure all quality gates pass

### Commit Guidelines

- **Conventional Commits** enforced by Husky
- Use: `feat:`, `fix:`, `chore:`, etc.
- Group related changes
- No WIP commits

## Technical Requirements

- **Node.js**: ≥ 18
- **pnpm**: ≥ 8
- **All packages**: ES modules (`"type": "module"`)
- **CLI Invocation**: `skills-cli` (global) or `node packages/skills-cli/dist/index.js <command>`

## Useful Shortcuts

### Daily Development Commands

```bash
# Quick health check
skills-cli dashboard health

# Fast validation (build + lint + schema)
pnpm test:phase3-quick

# Format all code
pnpm lint:fix

# View recent events
tail -f obs/kpi/events.jsonl
```

### Service Management

```bash
# Start all services
pm2 start scripts/pm2/ecosystem.config.cjs --env development

# Check service status
pm2 status

# View service logs
pm2 logs sf-daemon --lines 50
```

### Testing & Validation

```bash
# Run specific test
node --test packages/daemon/test/health.smoke.spec.mjs

# Full test suite
pnpm test:phase3

# Skill validation
pnpm skills:lint
```

### Monitoring & Debugging

```bash
# Generate KPI report
pnpm kpi:gen

# Real-time monitoring
skills-cli kpi --live

# Debug skill activation
skills-cli skills check "task" --v2 --debug --verbose
```

### Smoke Tests (Health Checks)

```bash
pnpm smoke:health         # Service health
pnpm smoke:discovery      # Service discovery
pnpm smoke:pg            # PostgreSQL connection
pnpm smoke:redis         # Redis connection (if enabled)
pnpm smoke:metrics       # Metrics system
```

## Project Status

**Current State**:

- ✅ Phase 3 Complete (2025-10-29) - All 20/20 tests passing
- ✅ 33 indexed skills (28 validated in strict mode)
- ✅ All services operational with auto-restart
- ✅ 91% latency reduction achieved
- ✅ 93.5% adherence rate maintained

For detailed architecture, see `docs/architecture/activation-core.md` and service-specific READMEs in each package.

## 🛡️ Protocolo de Seguridad y Auditoría (2025)

**Instrucciones Críticas para Agentes:**
Se requiere realizar verificaciones periódicas de seguridad en este repositorio para mitigar amenazas de cadena de suministro y vulnerabilidades conocidas.

### 1. Detección de Paquetes Maliciosos

Buscar proactivamente dependencias conocidas por contener malware (robo de credenciales SSH, inyección de código):

- `warbeast2000`
- `kodiak2k`
- `lottie-player` (versiones comprometidas)

**Comando de verificación:**

```bash
npm list warbeast2000 kodiak2k || pnpm list warbeast2000 kodiak2k
```

### 2. Vulnerabilidades Críticas (React/Next.js)

Verificar versiones vulnerables a RCE (Remote Code Execution):

- **React:** Versiones 19.0, 19.1, 19.2 son vulnerables. Usar v18.3.1 o superior parcheada.
- **Next.js:** Versiones 15.x, 16.x y canaries recientes pueden ser vulnerables.

### 3. Mantenimiento Preventivo

- **Lockfiles:** Asegurar que `package-lock.json` o `pnpm-lock.yaml` estén siempre versionados.
- **Auditoría:** Ejecutar `npm audit` o `pnpm audit` regularmente.
