# Skills Fabric CLI - Quick Start Guide

## 🚀 5-Minute Quick Start

Get up and running with Skills Fabric CLI in under 5 minutes.

### Prerequisites
- Node.js ≥ 18
- pnpm ≥ 8
- Git

### Installation
```bash
# Clone and install
git clone <repository-url>
cd skills-fabrik
pnpm install

# Build and link
pnpm -w build
pnpm --filter @skills-fabrik/skills-cli link --global
```

## ⚡ First Commands

### 1. Check System Health
```bash
skills-cli dashboard health
```
Expected output:
```
🏥 Dashboard API Health Check
Status: healthy
Uptime: 1751s

📊 Services:
  database: not_configured
  cache: healthy
  schemas: healthy

📈 Metrics:
  Activations: 0
  Avg Latency: 0ms
  Cache Size: 0
```

### 2. Test Skill Activation
```bash
skills-cli skills check "implement user authentication" --v2
```
Expected output:
```
🔍 Enhanced analysis with Prompt Builder v2:
  📊 Expected score: 0.2
  🏷️  TAGs coverage: 20%
  🔗 Template coverage: 100%
  📋 Relevant tags: [K:BACKEND-ARCHITECTURE], [C:API-DEVELOPMENT]
  ⚡ Skill activations: backend-dev-guidelines, database-verification
```

### 3. Create Your First Plan
```bash
skills-cli plan create "build user authentication system" --v2
```
Creates a structured CLOOP plan in `dev/plans/`.

### 4. Generate Documentation
```bash
skills-cli dev-docs create "auth-feature" --v2
```
Creates development documentation in `dev/active/auth-feature/`.

## 📋 Essential Commands

### Skills Management
```bash
# Check what skills will activate
skills-cli skills check "task description" --v2

# Validate all skills
skills-cli skills lint ./skills --strict

# Generate skill registry
skills-cli skills index ./skills --out ./registry/index.json
```

### Planning & Documentation
```bash
# Create structured plan
skills-cli plan create "task description" --v2

# Generate development docs
skills-cli dev-docs create "feature-name" --v2

# List active tasks
skills-cli dev-docs list
```

### Monitoring & Health
```bash
# System health check
skills-cli dashboard health

# Performance metrics
skills-cli dashboard metrics

# KPI reporting
skills-cli kpi --days 7

# Complete system report
skills-cli dashboard system
```

## 🎯 Common Workflows

### Backend Development Workflow
```bash
# 1. Check relevant skills
skills-cli skills check "create REST API with authentication" --v2

# 2. Create implementation plan
skills-cli plan create "implement user authentication API" --v2

# 3. Generate project structure
skills-cli dev-docs create "auth-api" --v2

# 4. Monitor performance
skills-cli dashboard system
```

### Frontend Development Workflow
```bash
# 1. Check skills for React development
skills-cli skills check "build React components with hooks" --v2

# 2. Create frontend plan
skills-cli plan create "implement user interface components" --v2

# 3. Generate component docs
skills-cli dev-docs create "ui-components" --v2
```

### Security Validation Workflow
```bash
# 1. Check code security
skills-cli guardrail "rm -rf /path/to/files"

# 2. Validate migrations
skills-cli guardrail --file database/migration.sql

# 3. System health check
skills-cli dashboard health
```

## 📊 Performance Tips

### Get Best Performance
- Use `--v2` flag for enhanced analysis
- Monitor system health regularly
- Keep skill registry updated

### Troubleshooting Performance
```bash
# Check system resources
skills-cli dashboard system --json

# Monitor latency
time skills-cli skills check "test query" --threshold 0.6

# Check KPI trends
skills-cli kpi --days 1
```

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```bash
# Skill Fabric configuration
SF_ENDPOINT=http://127.0.0.1:7727
SF_STORAGE_L0=.sf
SF_STORAGE_L1=.sf/cache

# Performance tuning
SKILL_ACTIVATION_THRESHOLD=0.6
SKILLS_PLANNING_MODE=false
```

### Planning Mode
```bash
# Enable planning mode
export SKILLS_PLANNING_MODE=true

# Create plan before execution
skills-cli plan create "your task" --v2

# Approve and save plan
skills-cli plan save <plan-id> --approve
```

## 🚨 Common Issues & Solutions

### Issue: Skills not activating
```bash
# Check skill registry
skills-cli skills index ./skills --out ./registry/index.json

# Verify skill content
skills-cli skills lint ./skills --strict

# Check activation threshold
skills-cli skills check "task" --threshold 0.3
```

### Issue: Performance slow
```bash
# Check system health
skills-cli dashboard health

# Clear cache if needed
rm -rf .sf/cache

# Restart daemon services
pm2 restart all
```

### Issue: Planning mode blocks
```bash
# Check if planning mode is enabled
echo $SKILLS_PLANNING_MODE

# Create required plan
skills-cli plan create "your task" --v2

# Or disable planning mode
export SKILLS_PLANNING_MODE=false
```

## 📚 Next Steps

1. **Read the full documentation**: `docs/cli/README.md`
2. **Explore all commands**: `skills-cli --help`
3. **Check out the implementation guide**: `docs/cli/IMPLEMENTATION-SUMMARY.md`
4. **Review the changelog**: `docs/cli/CHANGELOG.md`

## 🆘 Getting Help

```bash
# General help
skills-cli --help

# Command-specific help
skills-cli skills --help
skills-cli dashboard --help
skills-cli plan --help

# Check system status
skills-cli dashboard system
```

---

*Ready to build amazing things with Skills Fabric CLI! 🎉*