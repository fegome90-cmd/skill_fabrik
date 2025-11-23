# Repository Structure - Skills Fabrik

> **Last Updated**: 2025-11-06T15:20:00Z
> **Purpose**: Maintain clean, organized repository structure
> **Philosophy**: "Menos (y Mejor) es Más" - Avoid noise, maximize clarity

---

## 📁 **Current Structure (Organized)**

```
skills-fabrik/
├── 📦 packages/              # Core monorepo packages (pnpm workspaces)
│   ├── skills-cli/           # CLI application (@skills-fabrik/skills-cli)
│   ├── router/               # Router service with hooks (@skills-fabrik/router)
│   ├── daemon/               # Core daemon service (@skills-fabrik/daemon)
│   ├── shared/               # Shared utilities & service discovery
│   ├── kpi/                  # KPI aggregation & metrics
│   ├── slash-commands/       # Slash command system
│   └── mcp-adapters/         # MCP (Model Context Protocol) adapters
│
├── 🎯 skills/                # Skill definitions (33 indexed)
│   ├── guidelines/           # Development guidelines (backend-dev, frontend-dev)
│   ├── guardrails/           # Safety checks (database-verification, secrets-config)
│   ├── workflows/            # CLOOP automation workflows
│   ├── generators/           # Plan and test generators
│   ├── test/                 # Testing skills (cli-integration, visual-regression)
│   ├── quality/              # Code quality skills
│   ├── security/             # Security testing skills
│   ├── performance/          # Performance optimization skills
│   └── data/                 # Database management skills
│
├── 📚 docs/                  # All documentation (centralized)
│   ├── dev-docs/             # ✨ Professional dev-docs templates
│   │   ├── context.md        # Technical architecture & context (880 lines)
│   │   ├── plan.md           # Strategic planning & roadmap (729 lines)
│   │   └── tasks.md          # Task tracking & sprint management (813 lines)
│   │
│   ├── architecture/         # Architecture decision records
│   │   ├── activation-core.md
│   │   └── memtech-integration.md
│   │
│   ├── deployment/           # Deployment guides
│   │   ├── oracle-setup.md   # (To be created - Fase 2)
│   │   ├── nginx-config.md   # (To be created - Fase 3)
│   │   └── remote-usage.md   # (To be created - Fase 5)
│   │
│   ├── planning/             # Sprint/project planning docs
│   │   └── (future planning docs)
│   │
│   ├── analysis/             # Analysis & research documents
│   │   └── (analysis artifacts)
│   │
│   └── archive/              # Old/deprecated documentation
│       └── (archived docs)
│
├── 🔧 scripts/               # Automation scripts
│   ├── pm2/                  # PM2 ecosystem configuration
│   │   └── ecosystem.config.cjs
│   ├── deployment/           # Deployment scripts
│   └── utilities/            # Helper scripts
│
├── ⚙️ configs/               # Configuration files
│   ├── skill-rules.json      # Skill activation rules & thresholds
│   ├── SKILL.template.md     # Template for new skills
│   └── (other configs)
│
├── 📊 registry/              # Skill registry
│   └── index.json            # Compiled skill metadata (33 skills)
│
├── 🧪 test/                  # Global test utilities
│   └── (shared test helpers)
│
├── 📈 obs/                   # Observability & metrics
│   └── kpi/                  # KPI data & events
│       └── events.jsonl      # Event log
│
├── 🗄️ db/                    # Database scripts
│   └── (migrations, seeds)
│
├── 📐 schemas/               # JSON schemas
│   └── (validation schemas)
│
├── 🔐 policies/              # Security & access policies
│   └── (policy definitions)
│
├── .github/                  # GitHub configuration
│   └── (workflows, templates)
│
├── .cursor/                  # Cursor IDE integration
│   └── hooks/                # PBv2 hooks configuration
│       └── hooks-config.json
│
├── .husky/                   # Git hooks (pre-commit, commit-msg)
│
├── 📄 Root Files
│   ├── CLAUDE.md             # ⭐ Main AI assistant guide
│   ├── README.md             # Project overview
│   ├── package.json          # Root package.json (workspace)
│   ├── pnpm-workspace.yaml   # pnpm workspace config
│   ├── pnpm-lock.yaml        # Lockfile
│   ├── .gitignore            # Git ignore rules
│   ├── .eslintrc.json        # ESLint configuration
│   ├── .prettierrc.json      # Prettier configuration
│   └── jest.config.js        # Jest configuration
│
└── 🗑️ To Archive/Cleanup    # Items to move or delete
    ├── *.log files           # Build/daemon logs (should be in logs/ or gitignored)
    ├── test*.js/ts files     # Ad-hoc test files (move to test/ or delete)
    ├── *.mjs scripts         # Ad-hoc scripts (move to scripts/ or delete)
    └── Multiple MD files     # Analysis docs (move to docs/analysis/ or docs/archive/)
```

---

## 🎯 **Organization Principles**

### **1. Clear Separation of Concerns**
- **Code**: `packages/` (runtime)
- **Skills**: `skills/` (activation definitions)
- **Docs**: `docs/` (all documentation)
- **Config**: `configs/` (configuration files)
- **Scripts**: `scripts/` (automation)

### **2. Documentation Hierarchy**
```
docs/
├── dev-docs/           # Living docs (updated frequently)
├── architecture/       # ADRs (updated on major changes)
├── deployment/         # Ops guides (updated per deployment)
├── planning/           # Sprint/project plans (per sprint)
├── analysis/           # Research & analysis (as needed)
└── archive/            # Old docs (rarely accessed)
```

### **3. No Noise in Root**
Root directory should contain **ONLY**:
- Essential config files (package.json, .gitignore, etc.)
- Key documentation (README.md, CLAUDE.md)
- Workspace configuration (pnpm-workspace.yaml)

**Everything else goes in subdirectories.**

---

## 🧹 **Cleanup Actions Needed**

### **Priority 1: Move Log Files**
```bash
# These should be in packages/*/logs/ or gitignored
rm -f daemon*.log build*.log cli-analysis-v2.md
# OR move to obs/logs/ if needed for analysis
mv *.log obs/logs/
```

### **Priority 2: Consolidate Analysis Docs**
```bash
# Move analysis docs to docs/analysis/
mv ANALISIS-DETALLADO-PROBLEMAS-ADICIONALES.md docs/analysis/
mv EJEMPLOS-CODIGO-CORRECCIONES.md docs/analysis/
mv INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md docs/analysis/
mv README-ANALISIS.md docs/analysis/
mv RESUMEN-EJECUTIVO-METRICAS.md docs/analysis/
mv MEMTECH-INTEGRATION-SUMMARY.md docs/architecture/
mv PROMPT-BUILDER-V2-GUIA-COMPLETA.md docs/architecture/
```

### **Priority 3: Organize Test Files**
```bash
# Move ad-hoc test files
mv test*.js test*.ts test*.md test/ad-hoc/
# OR delete if no longer needed
rm -f test1.js test2.ts test3.md realtime-test.ts
```

### **Priority 4: Clean Script Files**
```bash
# Move utility scripts
mv *.mjs scripts/utilities/
mv open-claude-code.sh scripts/utilities/
# Examples:
mv analyze-cli-with-prompt-builder.mjs scripts/utilities/
mv create-cli-interaction-plan.mjs scripts/utilities/
mv monitoring-system.mjs scripts/monitoring/
mv performance-baseline-test.mjs scripts/performance/
```

### **Priority 5: Archive Old Docs**
```bash
# Move old/deprecated docs to archive
mv AGENTS.md docs/archive/
mv GEMINI.md docs/archive/
mv README_LOCAL_DEPLOYMENT.md docs/archive/
# Keep CHANGELOG.md in root (standard practice)
```

---

## 📋 **Cleanup Script**

Create and run this script to organize the repository:

```bash
#!/bin/bash
# cleanup-repo.sh - Organize Skills Fabrik repository

echo "🧹 Cleaning up Skills Fabrik repository..."

# Create missing directories
mkdir -p docs/{deployment,planning,analysis,archive}
mkdir -p obs/logs
mkdir -p test/ad-hoc
mkdir -p scripts/{utilities,monitoring,performance}

# Move log files
echo "📝 Moving log files..."
mv *.log obs/logs/ 2>/dev/null || true

# Move analysis docs
echo "📊 Organizing analysis docs..."
mv ANALISIS-DETALLADO-PROBLEMAS-ADICIONALES.md docs/analysis/ 2>/dev/null || true
mv EJEMPLOS-CODIGO-CORRECCIONES.md docs/analysis/ 2>/dev/null || true
mv INFORME-ANALISIS-ROUTER-DAEMON-FILEWATCHER.md docs/analysis/ 2>/dev/null || true
mv README-ANALISIS.md docs/analysis/ 2>/dev/null || true
mv RESUMEN-EJECUTIVO-METRICAS.md docs/analysis/ 2>/dev/null || true

# Move architecture docs
echo "🏗️ Organizing architecture docs..."
mv MEMTECH-INTEGRATION-SUMMARY.md docs/architecture/ 2>/dev/null || true
mv PROMPT-BUILDER-V2-GUIA-COMPLETA.md docs/architecture/ 2>/dev/null || true

# Move ad-hoc test files
echo "🧪 Organizing test files..."
mv test1.js test2.ts test3.md realtime-test.ts test/ad-hoc/ 2>/dev/null || true
mv test-*.js test-*.ts test/ad-hoc/ 2>/dev/null || true

# Move utility scripts
echo "🔧 Organizing scripts..."
mv analyze-cli-with-prompt-builder.mjs scripts/utilities/ 2>/dev/null || true
mv create-cli-interaction-plan.mjs scripts/utilities/ 2>/dev/null || true
mv monitoring-system.mjs scripts/monitoring/ 2>/dev/null || true
mv performance-baseline-test.mjs scripts/performance/ 2>/dev/null || true
mv open-claude-code.sh scripts/utilities/ 2>/dev/null || true
mv test-*.mjs scripts/utilities/ 2>/dev/null || true

# Move old docs to archive
echo "📦 Archiving old docs..."
mv AGENTS.md docs/archive/ 2>/dev/null || true
mv GEMINI.md docs/archive/ 2>/dev/null || true
mv README_LOCAL_DEPLOYMENT.md docs/archive/ 2>/dev/null || true

# Clean empty directories (optional)
echo "🗑️ Removing empty directories..."
find . -type d -empty -not -path "./.git/*" -delete 2>/dev/null || true

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "   - Logs moved to: obs/logs/"
echo "   - Analysis docs in: docs/analysis/"
echo "   - Architecture docs in: docs/architecture/"
echo "   - Ad-hoc tests in: test/ad-hoc/"
echo "   - Scripts organized in: scripts/*/"
echo "   - Old docs archived in: docs/archive/"
echo ""
echo "Next steps:"
echo "1. Review moved files"
echo "2. Update .gitignore for *.log files"
echo "3. Commit changes: git add . && git commit -m 'chore: organize repository structure'"
```

---

## 🔒 **.gitignore Recommendations**

Add these entries to `.gitignore`:

```gitignore
# Logs (should not be in repo)
*.log
logs/
obs/logs/*.log

# Ad-hoc test files
test*.js
test*.ts
test*.md
!test/  # But keep test directory

# Ad-hoc scripts
*.mjs
!scripts/**/*.mjs  # But keep scripts in scripts/

# Build artifacts
dist/
build/
.cache/

# Environment files (except examples)
.env
.env.*
!.env.example
!.env.*.example

# Temporary files
*.tmp
*.temp
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# Credentials
docs/deployment/oracle-credentials.md
*.pem
*.key
!**/*.pub

# Performance test results
performance-baseline-results/
benchmark-results.log
```

---

## 📊 **Directory Size Guidelines**

Keep directories focused and manageable:

| Directory | Target Size | Max Files | Purpose |
|-----------|-------------|-----------|---------|
| `packages/` | 10-20 packages | N/A | Core runtime packages |
| `skills/` | 30-50 skills | ~150 | Skill definitions |
| `docs/dev-docs/` | 3-5 files | 5 | Living documentation |
| `docs/architecture/` | 5-10 files | 15 | ADRs and architecture docs |
| `docs/deployment/` | 5-10 files | 10 | Deployment guides |
| `scripts/` | 10-20 scripts | 30 | Automation scripts |
| `configs/` | 5-10 files | 15 | Configuration files |

**Guideline**: If a directory has >20 files, consider subcategories.

---

## 🚀 **Quick Reference**

### **Where to Put New Files**

| File Type | Destination | Example |
|-----------|-------------|---------|
| New skill | `skills/<category>/` | `skills/security/sql-injection-detector/` |
| Architecture doc | `docs/architecture/` | `docs/architecture/new-feature-adr.md` |
| Deployment guide | `docs/deployment/` | `docs/deployment/kubernetes-setup.md` |
| Analysis document | `docs/analysis/` | `docs/analysis/performance-investigation.md` |
| Sprint plan | `docs/planning/` | `docs/planning/sprint-42-plan.md` |
| Utility script | `scripts/utilities/` | `scripts/utilities/backup-db.sh` |
| Test helper | `test/` | `test/helpers/mock-data.ts` |
| Config file | `configs/` | `configs/custom-rules.json` |
| Log file | `obs/logs/` (gitignored) | `obs/logs/daemon-2025-11-06.log` |

### **Where NOT to Put Files**

❌ **Root directory** - Only essential config/docs
❌ **packages/skills-cli/dist/** - Build artifacts (gitignored)
❌ **Anywhere with unclear name** - Use semantic directory names

---

## 📝 **Maintenance Schedule**

### **Weekly**
- [ ] Review root directory for new files
- [ ] Move ad-hoc test files to `test/ad-hoc/` or delete
- [ ] Clean up log files in `obs/logs/`

### **Monthly**
- [ ] Archive old sprint plans to `docs/archive/`
- [ ] Review `docs/analysis/` for outdated reports
- [ ] Update this document if structure changes

### **Quarterly**
- [ ] Full repository cleanup with script
- [ ] Update `.gitignore` based on patterns
- [ ] Review directory sizes vs guidelines

---

## 🔗 **Related Documentation**

- **CLAUDE.md** - Main project guide (includes common commands)
- **docs/dev-docs/context.md** - Technical architecture
- **docs/dev-docs/plan.md** - Strategic planning
- **docs/dev-docs/tasks.md** - Task tracking

---

**Last Cleanup**: 2025-11-06T15:20:00Z (Initial organization)
**Next Cleanup**: 2025-11-13 (Weekly maintenance)
**Maintained By**: DevOps Team

---

*Following "Menos (y Mejor) es Más": Keep only what adds value, organize the rest, archive what's needed for history, delete what's truly obsolete.*