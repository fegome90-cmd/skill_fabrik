# Skills Fabric CLI Commands Guide

## Overview

Skills Fabric CLI provides comprehensive command-line tools for managing skills, workflows, CLOOP methodology, and development automation.

## Core Commands

### Skills Management (`skills`)

#### `skills check <intent> [options]`
Check which skills match an intent with optional enhanced analysis.

```bash
# Basic skill checking
skills-cli skills check "crear API REST" --threshold 0.5

# Enhanced analysis with Prompt Builder v2
skills-cli skills check "desarrollo backend APIs" --v2 --threshold 0.3
```

**Options:**
- `-v, --verbose`: Verbose output
- `--open-files <files...>`: Open files to consider for path triggers
- `--threshold <number>`: Activation threshold (0-1, default: 0.6)
- `--v2`: Use Prompt Builder v2 for enhanced analysis

**Enhanced Analysis (`--v2`) provides:**
- Expected score prediction
- TAGs coverage percentage
- Template coverage
- Relevant tags
- Skill activation predictions

### Plan Management (`plan`)

#### `plan create <task> [options]`
Create structured plans using CLOOP methodology.

```bash
# Basic plan creation
skills-cli plan create "implementar sistema de autenticación"

# Enhanced plan with Prompt Builder v2
skills-cli plan create "desarrollar microservicios" --v2
```

**Options:**
- `--output <dir>`: Output directory for plan (default: dev/plans)
- `-v, --verbose`: Verbose output
- `--v2`: Use Prompt Builder v2 for intelligent plan generation

**Prompt Builder v2 plans include:**
- CLOOP methodology phases (Clarify, Layout, Operate, Observe, Reflect)
- Structured steps with dependencies
- Risk assessment and mitigation strategies
- Estimated metrics and timeline

### Development Documentation (`dev-docs`)

#### `dev-docs create <task-name> [options]`
Create comprehensive development documentation.

```bash
# Basic dev docs
skills-cli dev-docs create "feature-implementation" --plan path/to/plan.json

# Enhanced docs with Prompt Builder v2
skills-cli dev-docs create "api-development" --v2
```

**Options:**
- `--plan <file>`: Path to approved plan file
- `-v, --verbose`: Verbose output
- `--v2`: Use Prompt Builder v2 for enhanced documentation generation

**Enhanced Documentation (`--v2`) provides:**
- Expected quality scores
- TAGs coverage analysis
- Template coverage metrics
- Context-aware content generation

## New Commands

### CLOOP Initialization (`init`)

#### `init cloop`
Initialize CLOOP configuration for your project.

```bash
skills-cli init cloop
```

**Creates configuration files:**
- `config/cloop.yaml`: Project and sprint configuration
- `policies/sprints/S14.yaml`: Sprint-specific policies
- `config/memory.yaml`: Memory system configuration

**Configuration includes:**
- Project metadata and sprint information
- Retrieval system settings
- Loop iteration limits
- Timeout configurations
- Write policies and merge requirements

### Memory Management (`mem`)

#### `mem`
Manage the memory system for storing and retrieving development context.

```bash
skills-cli mem
```

**Features:**
- In-memory and persistent storage backends
- Context namespace management
- Embedding model configuration
- Memory retention policies

### Navigation (`nav`)

#### `nav`
Navigate and manage project structure and context.

```bash
skills-cli nav
```

**Features:**
- Project structure navigation
- Context-aware path resolution
- Development environment management

## Integration with Prompt Builder v2

### TAGs Coverage

Prompt Builder v2 provides intelligent TAGs coverage analysis:
- **20-30% coverage**: Basic context detection
- **Template coverage**: 100% (structured prompts)
- **Expected scores**: 0.2-0.4 (quality prediction)

### Enhanced Features

When using `--v2` flags:
1. **Context Analysis**: Automatic project structure detection
2. **Skill Activation**: Predicts relevant skills for your task
3. **Template Application**: Applies proven prompt templates
4. **Quality Metrics**: Expected scores and coverage analysis

## Best Practices

### Using Enhanced Commands (`--v2`)

1. **Always use `--v2` for complex tasks** to get better context analysis
2. **Check TAGs coverage** - aim for 20%+ coverage
3. **Review expected scores** - higher scores indicate better quality
4. **Use structured plans** for multi-phase development

### Workflow Integration

```bash
# 1. Initialize project
skills-cli init cloop

# 2. Create intelligent plan
skills-cli plan create "implement user authentication" --v2

# 3. Check relevant skills
skills-cli skills check "authentication system" --v2

# 4. Generate enhanced documentation
skills-cli dev-docs create "auth-feature" --v2
```

### Monitoring and Quality

- **KPI Tracking**: Use `skills-cli kpi` to monitor system performance
- **Adherence Metrics**: Aim for 80%+ skill activation adherence
- **Template Coverage**: Ensure 100% template application
- **TAGs Quality**: Monitor coverage percentages

### Dashboard API Commands

#### `dashboard health`
Check dashboard API health status and system information.

```bash
# Basic health check
skills-cli dashboard health

# JSON output for automation
skills-cli dashboard health --json

# Custom host/port
skills-cli dashboard health --host 127.0.0.1 --port 7727
```

**Output includes:**
- Overall system status (healthy/degraded/error)
- Service health (database, cache, schemas)
- Performance metrics (activations, latency, cache)
- System resources (memory, CPU, uptime)

#### `dashboard skills`
List available skills from the dashboard registry.

```bash
# List all skills
skills-cli dashboard skills

# JSON output
skills-cli dashboard skills --json
```

**Output includes:**
- Total skill count
- Skill details (name, description, severity)
- Activation statistics
- Last used timestamps

#### `dashboard metrics`
Get real-time metrics from the dashboard.

```bash
# Table format (default)
skills-cli dashboard metrics

# JSON format
skills-cli dashboard metrics --format json
```

**Output includes:**
- Daily activation counts
- Live activation tracking
- Historical activation data
- Performance trends

#### `dashboard system`
Get comprehensive system health report.

```bash
# System report with colored output
skills-cli dashboard system

# JSON format for integration
skills-cli dashboard system --json
```

**Output includes:**
- Complete health status
- Resource utilization
- Performance metrics
- Skill registry summary

## Examples

### Complete Development Workflow

```bash
# Initialize CLOOP configuration
skills-cli init cloop

# Create comprehensive plan for API development
skills-cli plan create "build REST API with authentication" --v2

# Check which skills will be activated
skills-cli skills check "API development with JWT auth" --v2

# Generate project documentation
skills-cli dev-docs create "api-project" --v2

# Monitor KPIs and adherence
skills-cli kpi --days 7
```

### Quick Skill Analysis

```bash
# Quick analysis of task requirements
skills-cli skills check "implement React components" --v2

# Expected output:
# 📊 Expected score: 0.2
# 🏷️  TAGs coverage: 20%
# 🔗 Template coverage: 100%
# 📋 Relevant tags: [K:FRONTEND-ARCHITECTURE], [C:REACT-DEVELOPMENT]
# ⚡ Skill activations: frontend-dev-guidelines, project-catalog-developer
```

## Troubleshooting

### Common Issues

1. **Low TAGs coverage (<20%)**: Add more context or specific file paths
2. **Low expected scores (<0.2)**: Refine the task description
3. **No skill activations**: Check if relevant skills exist in registry

### Getting Help

```bash
# General help
skills-cli --help

# Command-specific help
skills-cli skills check --help
skills-cli plan --help
skills-cli dev-docs --help

# Check system status
skills-cli kpi --days 1
```

For detailed troubleshooting, see the main README.md file or run `skills-cli --help`.