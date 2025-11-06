# 🚀 Quick Start Guide - MCP Prompt Builder v2

## What is this?

An MCP Server that exposes **Prompt Builder v2** as native tools for Claude Code. No more prompt engineering - use PBv2 directly!

## ⚡ 30-Second Setup

### Step 1: Build the Server

```bash
cd /Users/felipe/Developer/skills-fabrik/mcp-prompt-builder
npm install
npm run build
```

### Step 2: Configure Claude Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "prompt-builder": {
      "command": "node",
      "args": ["/Users/felipe/Developer/skills-fabrik/mcp-prompt-builder/dist/index.js"]
    }
  }
}
```

### Step 3: Use in Claude Code

```
User: "Optimize this task: Create a REST API with authentication"

Claude Code: [Uses optimize_prompt tool]
→ Returns optimized prompt with Template v1.1.0, TAGs, and metrics
```

## 🎯 Available Tools

### 1. `optimize_prompt`

**Usage:**
```typescript
{
  "taskDescription": "Create user authentication with JWT",
  "includeTemplate": true,
  "includeTags": true,
  "complexity": "medium"
}
```

**Returns:**
- ✅ Optimized prompt (Template v1.1.0)
- 📊 Expected score
- 🎯 Activated skills
- 🏷️ Contextual TAGs
- 💡 Recommendations

### 2. `get_performance_metrics`

**Usage:**
```typescript
{
  "format": "report"  // or "json"
}
```

**Returns:**
- ⏱️ Latency metrics
- 💾 Memory usage
- 📦 Cache hit rate
- 🔄 Operation counts

### 3. `system_health_check`

**Usage:**
```typescript
{}
```

**Returns:**
- ✅ System health status
- 📊 Key metrics
- 🔍 Performance data

### 4. `list_available_skills`

**Usage:**
```typescript
{}
```

**Returns:**
- 📋 List of available skills
- 🏷️ Skill names and IDs

## 💡 Example Conversations

### Example 1: Basic Task

```
User: I need to create a PostgreSQL database connection

Claude Code: I'll optimize this with database-specific skills.

Tool: optimize_prompt
Args: {
  "taskDescription": "Create a PostgreSQL database connection",
  "skillId": "database-verification"
}

Response:
{
  "optimizedPrompt": "C1: CSE_Completo ✅\nCreate PostgreSQL database connection...",
  "expectedScore": 0.92,
  "activatedSkills": [{"skillId": "database-verification", "score": 0.92}],
  "contextualTags": ["[K:DATABASE-CONNECTION]"],
  "recommendations": ["Use connection pooling", "Include pg library"]
}
```

### Example 2: Multi-Skill Task

```
User: Build a complete authentication system with JWT and database

Claude Code: I'll activate multiple skills for comprehensive coverage.

Tool: optimize_prompt
Args: {
  "taskDescription": "Build complete authentication system with JWT and database",
  "skillIds": ["backend-architecture-patterns", "security-patterns", "database-verification"],
  "complexity": "high",
  "includeTemplate": true,
  "includeTags": true
}

Response:
{
  "optimizedPrompt": "[Optimized with all 3 skills]",
  "expectedScore": 0.95,
  "activatedSkills": [
    {"skillId": "backend-architecture-patterns", "score": 0.95},
    {"skillId": "security-patterns", "score": 0.88},
    {"skillId": "database-verification", "score": 0.82}
  ],
  "recommendations": [
    "Implement JWT with refresh tokens",
    "Use bcrypt for password hashing",
    "Add rate limiting middleware",
    "Set up connection pooling",
    "Include audit logging"
  ]
}
```

### Example 3: Performance Check

```
User: Check if PBv2 is performing well

Claude Code: Let me check the system health and metrics.

Tool: system_health_check
Args: {}

Response:
{
  "healthy": true,
  "metrics": {
    "averageLatency": 45.2,
    "memoryUsage": 14.5,
    "cacheHitRate": 94.2,
    "totalOperations": 47
  },
  "timestamp": "2025-11-03T23:51:00.000Z"
}

Tool: get_performance_metrics
Args: {"format": "report"}

Response:
📊 PERFORMANCE METRICS DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Uptime: 15.32 minutes
🔄 Operations: 47
📦 Cache Hit Rate: 94.2%
⏲️  Avg Latency: 12.5ms
💾 Memory: 14.2MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🎨 Template v1.1.0

All optimized prompts include the 8-component structure:

```
C1: CSE_Completo (Context, Scope, Environment)
C2: TAGs_Cobertura (Contextual markers)
C3: Boundary_Markers (Clear sections)
C4: Frontmatter_YAML (Metadata)
C5: Anti_Drift (Stability measures)
C6: Objetivos_SMART (Specific, Measurable, Achievable, etc.)
C7: Tests_Ejecutables (Executable validation)
C8: Separacion_EVIDENCIA_vs_PROPUESTA (Evidence vs Proposal)
```

## 🏷️ TAGs System

Contextual TAGs are automatically generated:

- `[K:]` Knowledge tags (K:DATABASE-OPERATIONS)
- `[C:]` Context tags (C:API-DEVELOPMENT)
- `[U:]` Usage tags (U:DEVELOPER-WORKFLOW)
- `[EVIDENCIA:]` Evidence markers
- `[PROPUESTA:]` Proposal markers

## ⚙️ Configuration

### Environment Variables

```bash
# Cache settings
SKILLS_PB_CACHE_TTL=1800000          # 30 minutes
SKILLS_PB_MAX_CACHE_SIZE=50          # Max entries
SKILLS_PB_MAX_WORKERS=4              # Worker threads
SKILLS_PB_ENABLE_PARALLEL=true       # Parallel search

# Debug mode
DEBUG=skills-cli:prompt-builder
```

### MCP Configuration

```json
{
  "mcpServers": {
    "prompt-builder": {
      "command": "node",
      "args": ["/path/to/mcp-prompt-builder/dist/index.js"],
      "env": {
        "SKILLS_PB_CACHE_TTL": "1800000",
        "SKILLS_PB_MAX_WORKERS": "4"
      }
    }
  }
}
```

## 🧪 Testing

### Test Individual Tools

```bash
# Test optimize_prompt
claude mcp run prompt-builder optimize_prompt \
  --taskDescription "Create a login form" \
  --includeTemplate true

# Test performance metrics
claude mcp run prompt-builder get_performance_metrics \
  --format "report"

# Test health check
claude mcp run prompt-builder system_health_check

# List available skills
claude mcp run prompt-builder list_available_skills
```

### List All Tools

```bash
claude mcp tools prompt-builder
```

Expected output:
```
Available tools:
  - optimize_prompt
  - get_performance_metrics
  - system_health_check
  - list_available_skills
```

## 📊 What You Get

### Without MCP (Prompt Engineering)
- ❌ Complex prompts
- ❌ Unreliable results
- ❌ Manual formatting
- ❌ No type safety
- ❌ No error handling

### With MCP (Native Tools)
- ✅ Simple tool calls
- ✅ Consistent results
- ✅ Automatic formatting (Template v1.1.0)
- ✅ Full TypeScript support
- ✅ Structured error handling
- ✅ Performance monitoring
- ✅ Health checks

## 🚀 Benefits

1. **No Prompt Engineering** - Use tools instead of prompts
2. **Type Safety** - Full TypeScript + Zod validation
3. **Better Results** - PBv2 optimization
4. **Performance** - Direct API calls
5. **Monitoring** - Built-in metrics and health checks
6. **Template v1.1.0** - Automatic 8-component structure
7. **TAGs System** - Contextual TAGs generation
8. **Multi-Skill** - Activate multiple skills

## ❓ Common Issues

### Q: Tool not found
A: Ensure server is running: `claude mcp tools prompt-builder`

### Q: Connection error
A: Check path in configuration and rebuild: `npm run build`

### Q: Low score
A: Use more specific task descriptions or add skill IDs

### Q: Want to add custom skills
A: Edit `src/index.ts` and rebuild

## 🎯 Next Steps

1. ✅ Build the server: `npm run build`
2. ✅ Configure Claude Code (see README.md)
3. ✅ Test tools: `claude mcp tools prompt-builder`
4. ✅ Use in conversations!

## 📚 Full Documentation

See `README.md` for:
- Complete API reference
- Architecture details
- Development guide
- Troubleshooting

## 🆘 Need Help?

- Check performance: Use `get_performance_metrics`
- Check health: Use `system_health_check`
- List skills: Use `list_available_skills`
- See full docs: Read `README.md`

---

**Status**: ✅ Ready to Use
**Version**: 1.0.0
**Date**: 2025-11-03
