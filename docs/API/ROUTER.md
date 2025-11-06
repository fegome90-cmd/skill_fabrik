# Router API Documentation (Port 3000)

## Overview

The Skills Fabric Router provides HTTP endpoints for skill activation, quality enforcement, and editor integration. The router runs on port 3000 and serves as the central hub for pre-invoke and post-response hooks, ensuring consistent skill activation and quality enforcement across all editors and CLI tools.

## Base URL

```
http://127.0.0.1:3000
```

## Core Architecture

The router implements a **hook-based architecture** that integrates with any editor supporting webhooks:

```
Editor/CLI → Router → Daemon → Execution
     ↓           ↓         ↓
Pre-invoke → Skills → Quality → Stop Hook
```

### Key Components

1. **Pre-invoke Hook**: Analyzes prompts and activates relevant skills
2. **Stop Hook**: Enforces quality gates post-response
3. **Skill Detector**: Matches content against skill rules
4. **Guardrails**: Multi-level security and policy enforcement
5. **Health Monitoring**: System health and performance tracking

## API Endpoints

### 1. Health Check

#### `GET /health`

Check the health status of the router service.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-02T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "service": "router"
}
```

### 2. Pre-invoke Hook

#### `POST /pre-invoke`

Analyze user prompts and activate relevant skills before processing.

**Request Body:**
```json
{
  "prompt": "implement user authentication with JWT",
  "openFiles": ["src/auth/login.ts", "src/auth/register.ts"],
  "activeFile": "src/auth/login.ts",
  "activeFileContent": "export function login() { ... }",
  "cwd": "/workspace",
  "editor": "cursor"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "injectedNote": "📋 ACTIVE PLAN: plan-123 (implement auth)\n\n✅ Found 2 matching skill(s):\n✓ backend-dev-guidelines (85.0%)\n✓ database-verification (72.0%)",
    "activated": ["backend-dev-guidelines", "database-verification"],
    "metadata": {
      "scores": {
        "backend-dev-guidelines": 0.85,
        "database-verification": 0.72
      },
      "reasons": {
        "backend-dev-guidelines": "daemon-match",
        "database-verification": "daemon-match"
      },
      "daemon": {
        "success": true,
        "results": 2,
        "latency": 45,
        "url": "http://127.0.0.1:7727"
      }
    },
    "blocked": false
  }
}
```

**Blocked Response (Planning Mode):**
```json
{
  "success": true,
  "result": {
    "injectedNote": undefined,
    "activated": [],
    "metadata": { "scores": {}, "reasons": {} },
    "blocked": true,
    "blockReason": "🚫 PLANNING MODE GATE: No approved plan found.\n\nTo proceed:\n  1. Create plan: skills plan create \"<task description>\"\n  2. Approve plan: skills plan approve <plan-id>\n  3. Save workflow: skills plan save <plan-id> --approve\n\nOr disable planning mode: SKILLS_PLANNING_MODE=false"
  }
}
```

**Slash Command Response:**
```json
{
  "success": true,
  "result": {
    "injectedNote": "⚡ SLASH COMMAND DETECTED: /dev-docs\n\nThis slash command will be processed by the slash commands system.\n\nAvailable slash commands: /dev-docs, /create-dev-docs, /dev-docs-update, /build-and-fix, /code-review, /route-research-for-testing, /test-route, /compact, /undo, /plugin\n\nUse \"skills-cli / dev-docs\" to execute, or add \"--help\" for usage: /dev-docs --help",
    "activated": [],
    "metadata": {
      "scores": {},
      "reasons": {},
      "slashCommand": {
        "detected": true,
        "command": "dev-docs",
        "args": ["feature-name"],
        "flags": {},
        "options": {}
      }
    },
    "blocked": false
  }
}
```

### 3. Stop Hook

#### `POST /stop`

Execute post-response quality checks and formatting.

**Request Body:**
```json
{
  "editLog": [
    {
      "file": "src/index.ts",
      "addedLines": 5,
      "removedLines": 2,
      "changeType": "modified"
    }
  ],
  "reposChanged": ["frontend"],
  "cwd": "/workspace"
}
```

**Successful Response:**
```json
{
  "success": true,
  "result": {
    "formatted": ["src/index.ts"],
    "typecheck": [
      {
        "repo": "frontend",
        "errors": 0,
        "output": ""
      }
    ],
    "autoResolved": false,
    "kpiEvent": {
      "ts": "2025-01-02T10:30:00.000Z",
      "repo": "frontend",
      "skills": ["backend-dev-guidelines"],
      "errors_ts": 0,
      "auto_resolver_used": false,
      "latency_ms": 1250,
      "zero_errors_left_behind": true,
      "activated_by": {
        "keywords": true,
        "intent_regex": false,
        "path_globs": false,
        "content_patterns": false
      },
      "adherence": true,
      "progressive_disclosure": {
        "metadata_loaded": true,
        "skill_md_loaded": true,
        "resources_loaded": 2
      }
    }
  }
}
```

**Guardrail Blocked Response:**
```json
{
  "success": true,
  "result": {
    "formatted": [],
    "typecheck": [],
    "hints": [
      "🚫 database-verification: Dangerous SQL pattern detected\n   → src/db/migration.sql:15"
    ],
    "autoResolved": false,
    "kpiEvent": {
      "ts": "2025-01-02T10:30:00.000Z",
      "repo": "backend",
      "skills": ["database-verification"],
      "errors_ts": 0,
      "auto_resolver_used": false,
      "latency_ms": 0,
      "zero_errors_left_behind": false,
      "activated_by": {
        "keywords": false,
        "intent_regex": false,
        "path_globs": false,
        "content_patterns": false
      },
      "adherence": false,
      "progressive_disclosure": {
        "metadata_loaded": false,
        "skill_md_loaded": false,
        "resources_loaded": 0
      }
    }
  }
}
```

### 4. Skill Rules

#### `GET /rules`

Load all skill rules for activation matching.

**Response:**
```json
{
  "success": true,
  "rules": {
    "backend-dev-guidelines": {
      "promptTriggers": {
        "keywords": ["backend", "api", "server"],
        "intentPatterns": ["implement.*api", "create.*server"],
        "severity": "suggest"
      },
      "fileTriggers": {
        "pathPatterns": ["src/server/**", "backend/**"],
        "contentPatterns": ["express\\.", "fastify\\.", "koa\\."]
      },
      "metadata": {
        "category": "guidelines",
        "description": "Backend development best practices"
      }
    },
    "database-verification": {
      "promptTriggers": {
        "keywords": ["database", "migration", "sql"],
        "severity": "warn"
      },
      "fileTriggers": {
        "pathPatterns": ["migrations/**", "**/*.sql"],
        "contentPatterns": ["CREATE TABLE", "ALTER TABLE", "DROP TABLE"]
      }
    }
  }
}
```

### 5. Match Rules

#### `POST /match-rules`

Match input content against skill rules.

**Request Body:**
```json
{
  "input": "implement user authentication with JWT tokens",
  "threshold": 0.6
}
```

**Response:**
```json
{
  "success": true,
  "matches": {
    "activated": ["backend-dev-guidelines", "database-verification"],
    "metadata": {
      "scores": {
        "backend-dev-guidelines": 0.85,
        "database-verification": 0.72
      },
      "reasons": {
        "backend-dev-guidelines": "matched keywords: backend, authentication",
        "database-verification": "matched keywords: authentication"
      }
    },
    "blocked": false
  }
}
```

### 6. Guardrails Check

#### `POST /guardrails`

Check content against security and quality guardrails.

**Request Body:**
```json
{
  "editLog": [
    {
      "file": "src/db/query.ts",
      "addedLines": 3,
      "content": "await db.deleteMany(); // Dangerous!"
    }
  ],
  "cwd": "/workspace"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "blocked": true,
    "violations": [
      {
        "skillId": "database-verification",
        "severity": "block",
        "message": "Dangerous SQL operation detected: deleteMany() without WHERE clause",
        "file": "src/db/query.ts",
        "line": 15,
        "suggestion": "Add WHERE clause to prevent accidental data deletion"
      }
    ],
    "warnings": [
      {
        "skillId": "secrets-and-config",
        "severity": "warn",
        "message": "Potential hardcoded secret detected",
        "file": "src/config/auth.ts",
        "line": 8,
        "suggestion": "Use environment variables for sensitive configuration"
      }
    ],
    "suggestions": [
      {
        "skillId": "backend-dev-guidelines",
        "severity": "suggest",
        "message": "Consider adding input validation for authentication endpoints",
        "file": "src/auth/login.ts"
      }
    ]
  }
}
```

## Quality Pipeline

### Stop Hook Pipeline Process

The stop hook executes a comprehensive quality pipeline:

```
Edit Log → Guardrails → Prettier → TypeCheck → Error Handling → KPI Emission
     ↓           ↓          ↓         ↓           ↓           ↓
Security → Formatting → Compilation → Auto-resolve → Metrics → Notifications
```

#### 1. Guardrails Check (Multi-level Enforcement)

**SUGGEST** → Best practice recommendations
**WARN** → Security and quality warnings
**BLOCK** → Critical security violations (stops execution)

#### 2. Prettier Formatting
- Auto-format edited files
- Consistent code style
- Configurable rules

#### 3. TypeScript Compilation
- Per-repository type checking
- Error detection and reporting
- Cross-repository validation

#### 4. Error Resolution
- **1-4 errors**: Generate helpful hints
- **≥5 errors**: Auto-resolve common issues
- Re-check after auto-resolution

#### 5. KPI Emission
- Performance metrics tracking
- Quality adherence monitoring
- Event logging to `obs/kpi/events.jsonl`

#### 6. Notifications
- Success/error notifications
- Configurable notification channels
- Cross-platform support

## Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
HOST=127.0.0.1

# Skill Activation
SKILL_ACTIVATION_THRESHOLD=0.6
SKILLS_DAEMON_ENHANCED=true
DAEMON_URL=http://127.0.0.1:7727
SF_API_KEY=your-api-key

# Cache Configuration
DAEMON_CACHE_TTL=60000
DAEMON_CACHE_MAX_SIZE=100

# Daemon Integration
DAEMON_MAX_RETRIES=2
DAEMON_RETRY_DELAY=500
DAEMON_TIMEOUT=3000

# Service Discovery
ROUTER_DISCOVERY=1
DISCOVERY_URL=http://127.0.0.1:8877
ROUTER_STICKY=1

# Planning Mode
SKILLS_PLANNING_MODE=false

# Debug
SKILLS_DAEMON_DEBUG=false
```

### Editor Integration

The router supports integration with any editor via webhooks:

#### Cursor IDE Integration
```json
{
  "userPromptSubmit": {
    "url": "http://127.0.0.1:3000/pre-invoke",
    "method": "POST"
  },
  "stop": {
    "url": "http://127.0.0.1:3000/stop",
    "method": "POST"
  }
}
```

#### VS Code Extension (Future)
```json
{
  "onBeforeCommand": {
    "url": "http://127.0.0.1:3000/pre-invoke"
  },
  "onAfterSave": {
    "url": "http://127.0.0.1:3000/stop"
  }
}
```

## Advanced Features

### 1. Enhanced Daemon Integration

- **Caching**: In-memory cache for daemon responses
- **Retry Logic**: Automatic retry with exponential backoff
- **Service Discovery**: Dynamic daemon endpoint resolution
- **Signal Processing**: Enhanced confidence scoring

### 2. Planning Mode Integration

- **Plan Verification**: Check for approved plans before execution
- **Gate Enforcement**: Block execution without proper planning
- **Workflow Integration**: Seamless plan-to-execution flow

### 3. Slash Command Support

- **Command Detection**: Identify slash commands in prompts
- **Parser Integration**: Parse command arguments and flags
- **Execution Routing**: Route to appropriate handlers

### 4. Multi-Repository Support

- **Repository Detection**: Identify changed repositories
- **Parallel Processing**: Concurrent type checking across repos
- **Dependency Management**: Handle inter-repository dependencies

### 5. Performance Optimization

- **Concurrent Operations**: Parallel execution where possible
- **Smart Caching**: Cache results to avoid redundant processing
- **Circuit Breakers**: Fail fast when services are unavailable

## Monitoring and Observability

### Health Checks

```bash
curl http://127.0.0.1:3000/health
```

### Performance Metrics

The router tracks various metrics:

- **Activation Latency**: Time for skill activation
- **Guardrail Performance**: Security check execution time
- **Quality Pipeline**: End-to-end quality check duration
- **Cache Hit Rate**: Daemon response cache effectiveness

### KPI Events

KPI events are emitted to `obs/kpi/events.jsonl`:

```json
{
  "ts": "2025-01-02T10:30:00.000Z",
  "repo": "frontend",
  "skills": ["backend-dev-guidelines"],
  "errors_ts": 0,
  "auto_resolver_used": false,
  "latency_ms": 1250,
  "zero_errors_left_behind": true,
  "activated_by": {
    "keywords": true,
    "intent_regex": false,
    "path_globs": false,
    "content_patterns": false
  },
  "adherence": true,
  "progressive_disclosure": {
    "metadata_loaded": true,
    "skill_md_loaded": true,
    "resources_loaded": 2
  }
}
```

## Error Handling

### Common Error Scenarios

1. **Daemon Unavailable**
   - Graceful degradation to local rule matching
   - Cache utilization for recent requests
   - Retry logic with exponential backoff

2. **Guardrail Violations**
   - Multi-level enforcement (SUGGEST → WARN → BLOCK)
   - Clear error messages with suggestions
   - Context-aware violation reporting

3. **Planning Mode Gates**
   - Clear instructions for plan creation
   - Workflow guidance
   - Bypass options for emergency situations

4. **TypeScript Compilation Errors**
   - Parsed error reporting
   - Auto-resolution for common issues
   - Manual resolution hints

## Integration Examples

### CLI Integration

```bash
# Check skill activation
curl -X POST http://127.0.0.1:3000/pre-invoke \
  -H "Content-Type: application/json" \
  -d '{"prompt": "create REST API", "cwd": "/workspace"}'

# Quality check
curl -X POST http://127.0.0.1:3000/stop \
  -H "Content-Type: application/json" \
  -d '{"editLog": [{"file": "src/index.ts"}], "cwd": "/workspace"}'
```

### Editor Webhook Configuration

```javascript
// Cursor IDE (.cursor/hooks/hooks-config.json)
{
  "userPromptSubmit": {
    "url": "http://127.0.0.1:3000/pre-invoke",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "stop": {
    "url": "http://127.0.0.1:3000/stop",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    }
  }
}
```

This router API documentation provides comprehensive information for integrating with the Skills Fabric activation and quality enforcement system.