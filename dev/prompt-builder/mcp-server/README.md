# MCP Server: Prompt Builder v2

**Expose Prompt Builder v2 as native tools for Claude Code via MCP (Model Context Protocol)**

## Overview

This MCP Server exposes Prompt Builder v2 functionality as native tools that Claude Code can use directly, without needing prompt engineering or sub-agents.

## Features

✅ **Native Tools** - Use PBv2 directly in Claude Code
✅ **Type Safety** - Full TypeScript support with Zod schemas
✅ **Performance Monitoring** - Built-in metrics and health checks
✅ **Template v1.1.0** - Automatic application of structured templates
✅ **TAGs System** - Contextual TAGs generation
✅ **Multi-Skill Support** - Activate multiple skills simultaneously

## Available Tools

### 1. `optimize_prompt`

Transform a user task into an optimized prompt using PBv2.

**Parameters:**
```typescript
{
  taskDescription: string;           // Required: Natural language task
  skillId?: string;                  // Optional: Single skill ID
  skillIds?: string[];               // Optional: Multiple skill IDs
  includeFiles?: boolean;            // Default: true
  includeTags?: boolean;             // Default: true
  includeTemplate?: boolean;         // Default: true (Template v1.1.0)
  complexity?: 'low'|'medium'|'high'|'very-high';  // Default: medium
  cwd?: string;                      // Optional: Working directory
}
```

**Example Usage:**
```typescript
// Basic task
{
  "taskDescription": "Create a REST API with authentication"
}

// Multi-skill task
{
  "taskDescription": "Build complete authentication system",
  "skillIds": ["backend-architecture-patterns", "security-patterns"],
  "includeTemplate": true,
  "includeTags": true
}

// High complexity task
{
  "taskDescription": "Design scalable microservices architecture",
  "complexity": "very-high",
  "includeFiles": true
}
```

### 2. `get_performance_metrics`

Get performance metrics from Prompt Builder v2.

**Parameters:**
```typescript
{
  format?: 'report' | 'json';  // Default: 'report'
}
```

**Example Usage:**
```typescript
// Get formatted report
{
  "format": "report"
}

// Get JSON metrics
{
  "format": "json"
}
```

### 3. `system_health_check`

Check if Prompt Builder v2 system is healthy.

**Parameters:**
```typescript
{}
```

**Response:**
```json
{
  "success": true,
  "healthy": true,
  "metrics": {
    "averageLatency": 45.2,
    "memoryUsage": 14.5,
    "cacheHitRate": 94.2,
    "totalOperations": 47
  }
}
```

### 4. `list_available_skills`

List all available skills in the system.

**Parameters:**
```typescript
{}
```

**Response:**
```json
{
  "success": true,
  "skills": [
    {"id": "backend-architecture-patterns", "name": "Backend Architecture Patterns"},
    {"id": "api-design-and-testing", "name": "Api Design And Testing"},
    {"id": "database-verification", "name": "Database Verification"}
  ]
}
```

## Installation

### 1. Clone and Build

```bash
# Clone the repository
git clone <repository-url>
cd mcp-prompt-builder

# Install dependencies
npm install

# Build the server
npm run build
```

### 2. Configure Claude Code

Add to your Claude Code MCP configuration:

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

Or use with the MCP CLI:

```bash
# Add the server
claude mcp add prompt-builder node /path/to/mcp-prompt-builder/dist/index.js

# List tools
claude mcp tools prompt-builder

# Test a tool
claude mcp run prompt-builder optimize_prompt \
  --taskDescription "Create a REST API" \
  --includeTemplate true \
  --includeTags true
```

## Usage in Claude Code

Once configured, you can use the tools directly:

### Example 1: Basic Optimization

```
User: Optimize this task: "Create user authentication with JWT"

Claude Code: I'll use the optimize_prompt tool to transform your task.

[Uses optimize_prompt tool with taskDescription="Create user authentication with JWT"]

Result:
{
  "optimizedPrompt": "C1: CSE_Completo ✅\nCreate user authentication system with JWT...",
  "expectedScore": 0.89,
  "activatedSkills": [
    {"skillId": "backend-dev-guidelines", "score": 0.89},
    {"skillId": "security-patterns", "score": 0.76}
  ],
  "contextualTags": ["[K:SECURITY-PATTERNS]"],
  "recommendations": ["Include password hashing library"]
}
```

### Example 2: Multi-Skill Task

```
User: I need to build a complete API with database and tests

Claude Code: I'll optimize this with multiple skills for comprehensive coverage.

[Uses optimize_prompt with skillIds=["backend-architecture-patterns", "database-verification"]]

Result:
{
  "optimizedPrompt": "[Optimized with multiple skills]",
  "expectedScore": 0.92,
  "activatedSkills": [...],
  "recommendations": [...]
}
```

### Example 3: Performance Check

```
User: Check PBv2 performance

Claude Code: Let me check the system health.

[Uses system_health_check tool]

Result:
{
  "healthy": true,
  "metrics": {
    "averageLatency": 45.2,
    "memoryUsage": 14.5,
    "cacheHitRate": 94.2
  }
}
```

## Architecture

```
User Task → Claude Code → MCP Server → Prompt Builder v2 → Optimized Result
                                    ↓
                              [Native Tool Call]
```

### Benefits of MCP Approach:

1. **No Prompt Engineering** - Use native tools instead of complex prompts
2. **Type Safety** - Full TypeScript support
3. **Error Handling** - Structured error responses
4. **Performance** - Direct API calls, no prompt parsing
5. **Extensibility** - Easy to add new tools
6. **Maintainability** - Standard MCP protocol

## Integration with PBv2

The MCP server directly calls PBv2 APIs:

```typescript
import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';
import { getPerformanceReport, exportMetrics } from '@skills-fabrik/skills-cli';
```

All PBv2 features are exposed:
- ✅ Template v1.1.0 (C1-C8 structure)
- ✅ TAGs system ([K:C:U:EVIDENCIA:PROPUESTA])
- ✅ Multi-skill activation
- ✅ Performance optimization (cache, workers, parallel search)
- ✅ Real-time metrics
- ✅ Health monitoring

## Development

### Run in Development Mode

```bash
npm run dev
```

This enables watch mode for hot reloading.

### Testing Tools

```bash
# List all tools
claude mcp tools prompt-builder

# Test optimize_prompt
claude mcp run prompt-builder optimize_prompt \
  --taskDescription "Create a login form" \
  --includeTemplate true

# Test performance metrics
claude mcp run prompt-builder get_performance_metrics \
  --format "report"

# Test health check
claude mcp run prompt-builder system_health_check
```

## Configuration

### Environment Variables

```bash
# PBv2 Cache Configuration
export SKILLS_PB_CACHE_TTL=1800000        # 30 minutes
export SKILLS_PB_MAX_CACHE_SIZE=50        # Max entries
export SKILLS_PB_MAX_WORKERS=4            # Worker threads
export SKILLS_PB_ENABLE_PARALLEL=true     # Enable parallel search

# MCP Server Configuration
export MCP_LOG_LEVEL=info                 # Logging level
export MCP_PORT=3000                      # Port (if using HTTP transport)
```

### Custom Skills

To add custom skills, update the skill list in `src/index.ts`:

```typescript
const skills = [
  'your-custom-skill',
  'another-skill',
  // ... add your skills
];
```

## Troubleshooting

### Tool Not Found
```bash
# Ensure server is running
claude mcp tools prompt-builder

# Restart the server
claude mcp remove prompt-builder
claude mcp add prompt-builder node /path/to/dist/index.js
```

### Connection Issues
```bash
# Check logs
# The server logs to stderr

# Test connectivity
node dist/index.js --test
```

### PBv2 Not Available
```bash
# Ensure @skills-fabrik/skills-cli is installed
npm list @skills-fabrik/skills-cli

# Rebuild if needed
npm run build
```

## Example Response

### Successful Optimization

```json
{
  "success": true,
  "data": {
    "optimizedPrompt": "C1: CSE_Completo ✅\nCreate user authentication system with JWT...",
    "expectedScore": 0.89,
    "activatedSkills": [
      {
        "skillId": "backend-dev-guidelines",
        "score": 0.89,
        "reasons": ["backend patterns matched", "authentication keywords found"]
      }
    ],
    "tagsCoverage": 0.75,
    "templateScore": 1.0,
    "contextualTags": [
      "[K:SECURITY-PATTERNS]",
      "[C:CONFIGURATION-MANAGEMENT]"
    ],
    "relevantFiles": [
      "backend/src/auth/user.controller.ts",
      "backend/src/auth/jwt.service.ts"
    ],
    "recommendations": [
      "Include password hashing library (bcrypt/argon2)",
      "Add rate limiting to prevent brute force attacks",
      "Implement refresh token rotation"
    ]
  }
}
```

## License

MIT

## Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Performance**: Use `get_performance_metrics` tool
