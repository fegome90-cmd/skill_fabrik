# Skills Fabrik

Editor-agnostic skill activation system with quality gates and structured development documentation.

## Overview

Skills Fabrik is a monorepo that implements the CLOOP methodology (Context, Learning, Options, Outcomes, Planning) for development automation. It provides a skill activation system integrated with code editors through hooks, along with quality gates and real-time monitoring.

**Key Components:**
- CLI for skill management and workflow automation
- Multi-service architecture (Router, Daemon, Service Discovery)
- 33 indexed skills covering guidelines, guardrails, workflows, and generators
- Quality gates system for code validation
- Real-time monitoring dashboard

## Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -w build

# Optional: Link CLI globally
pnpm --filter @skills-fabrik/skills-cli link --global
```

## Basic Usage

### CLI Commands

```bash
# Check which skills match a task
skills-cli skills check "implement REST API with authentication"

# Create a structured plan
skills-cli plan create "task description"

# Validate skills
skills-cli skills lint

# Index skills
skills-cli skills index ./skills --out ./registry/index.json

# View system metrics
skills-cli kpi --days 7

# Dashboard health check
skills-cli dashboard health
```

### Starting Services

```bash
# Start all services
pm2 start scripts/pm2/ecosystem.config.cjs --env development

# Individual services
pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon --env development
pm2 start scripts/pm2/ecosystem.config.cjs --only service-discovery --env development
pm2 start scripts/pm2/ecosystem.config.cjs --only router-service --env development
```

**Services:**

| Service           | Port | Endpoint                     |
|-------------------|------|------------------------------|
| sf-daemon         | 7727 | http://127.0.0.1:7727/health |
| service-discovery | 8877 | http://127.0.0.1:8877/health |
| router-service    | 3000 | http://127.0.0.1:3000/health |

## Architecture

**Structure:**
```
packages/
├── skills-cli/       # CLI interface
├── router/           # Activation engine and hooks
├── daemon/           # Core service with REST API
├── shared/           # Service discovery
├── kpi/              # Metrics and KPI aggregation
└── slash-commands/   # Slash command system

skills/
├── guidelines/       # Development best practices
├── guardrails/       # Safety checks
├── workflows/        # CLOOP automation
└── generators/       # Plan and test generation
```

**Communication Flow:**
```
CLI Request → Router (3000) → Daemon (7727)
                ↓
        Service Discovery (8877)
```

## Testing

```bash
# Quick validation (build + lint + schema)
pnpm test:phase3-quick

# Full test suite
pnpm test:phase3

# Individual test suites
pnpm test:daemon:smoke
pnpm test:activation-cases
pnpm test:skill-rules-schema
```

**Current Metrics:**
- 20/20 tests passing
- 33 indexed skills (28 validated in strict mode)
- Response time: ~466ms average

## Development

### Creating a New Skill

```bash
# Using generator
skills-cli init guideline my-skill-name

# Manual creation
mkdir -p skills/guidelines/my-skill-name
cp configs/SKILL.template.md skills/guidelines/my-skill-name/SKILL.md
# Edit SKILL.md with your content
skills-cli skills lint ./skills --strict
skills-cli skills index ./skills --out ./registry/index.json
```

### Code Quality

```bash
pnpm lint              # Check linting and formatting
pnpm lint:fix          # Fix linting and formatting
pnpm gates             # Run all quality gates
```

## Configuration

Key environment variables:

```bash
# Services
DAEMON_PORT=7727
ROUTER_PORT=3000
DISCOVERY_PORT=8877

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/skills_fabrik

# Development
NODE_ENV=development
LOG_LEVEL=info
SKILL_ACTIVATION_THRESHOLD=0.45
```

## Documentation

- [Quick Start Guide](docs/cli/QUICK-START.md)
- [CLI Commands Reference](docs/cli/CLI-COMMANDS-GUIDE.md)
- [CLOOP Methodology](cloop/CLOOP-METHODOLOGY-GUIDE.md)
- [Architecture Documentation](docs/architecture/activation-core.md)
- [Development Documentation](docs/dev/README.md)

See [CLAUDE.md](CLAUDE.md) for detailed development guidelines and troubleshooting.

## Requirements

- Node.js >= 18
- pnpm >= 8
- PostgreSQL (optional)

## License

See LICENSE file for details.
