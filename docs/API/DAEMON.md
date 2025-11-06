# Daemon API Documentation (Port 7727)

## Overview

The Skills Fabric Daemon provides a comprehensive REST API for skill activation, execution, monitoring, and management. The daemon runs on port 7727 and serves as the core execution engine for the Skills Fabric system.

## Base URL

```
http://127.0.0.1:7727
```

## Authentication

The daemon supports optional authentication via API keys or JWT tokens:

### API Key Authentication
```bash
curl -H "X-API-Key: your-api-key" http://127.0.0.1:7727/activate
```

### JWT Bearer Authentication
```bash
curl -H "Authorization: Bearer your-jwt-token" http://127.0.0.1:7727/activate
```

**Note**: Authentication is optional and only enforced when `DAEMON_API_KEY` or `DAEMON_JWT_SECRET` environment variables are configured.

## Core API Endpoints

### 1. Health Check

#### `GET /health`

Check the health status of the daemon and all connected services.

**Response:**
```json
{
  "status": "healthy|degraded|critical",
  "timestamp": "2025-01-02T10:30:00.000Z",
  "uptime": 3600,
  "healthIssues": ["High memory usage"],
  "services": {
    "database": {
      "status": "healthy|not_configured|unhealthy",
      "url": "postgresql://localhost:5432",
      "error": "Connection failed"
    },
    "cache": {
      "status": "healthy|warning|critical",
      "size": 150,
      "maxSize": 1000,
      "hits": 850,
      "misses": 150,
      "evictions": 5,
      "hitRate": "85.0%",
      "memoryUsage": 52428800,
      "memoryUsagePercent": 65.2,
      "ttl": 60000
    },
    "signals": {
      "weights": {
        "keywords": 0.25,
        "intent": 0.25,
        "path": 0.25,
        "content": 0.25
      },
      "defaultThreshold": 0.6
    },
    "rules": {
      "usingSharedLoader": true,
      "cache": {
        "path": "/path/to/skill-rules.json",
        "mtimeMs": 1641024000000
      }
    },
    "schemas": {
      "status": "healthy",
      "loaded": 4
    }
  },
  "metrics": {
    "totalActivations": 1250,
    "averageLatency": 125,
    "cacheSize": 150,
    "requestsProcessed": 1250
  },
  "system": {
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "development",
    "memoryUsage": {
      "rss": 67108864,
      "heapTotal": 52428800,
      "heapUsed": 34078720,
      "external": 2097152
    },
    "cpuUsage": {
      "user": 1234567,
      "system": 567890
    },
    "nodeVersion": "v18.19.0",
    "pid": 12345
  },
  "endpoints": {
    "health": "/health",
    "list": "/list",
    "activate": "/activate",
    "execute": "/execute",
    "metrics": "/metrics",
    "validate": "/validate"
  }
}
```

### 2. Skill List

#### `POST /list`

List all available skills in the system.

**Response:**
```json
{
  "skills": [
    "backend-dev-guidelines",
    "frontend-dev-guidelines",
    "database-verification",
    "repo-auditor",
    "secrets-and-config"
  ]
}
```

### 3. Skill Activation

#### `POST /activate`

Activate skills based on user intent and context.

**Request Body:**
```json
{
  "intent": "implement user authentication",
  "context": {
    "activeFile": "src/auth/login.ts",
    "activeFileContent": "export function login() { ... }",
    "files": ["src/auth/login.ts", "src/auth/register.ts"]
  },
  "options": {
    "threshold": 0.6,
    "maxResults": 5,
    "includeMetadata": true,
    "signalWeights": {
      "keywords": 0.3,
      "intent": 0.2,
      "path": 0.3,
      "content": 0.2
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-01-02T10:30:00.000Z",
  "results": [
    {
      "skillId": "backend-dev-guidelines",
      "confidence": 0.85,
      "reason": "matched keywords: authentication, backend",
      "metadata": {
        "name": "backend-dev-guidelines",
        "description": "Backend development best practices",
        "category": "guidelines",
        "tags": ["backend", "api", "security"]
      }
    },
    {
      "skillId": "database-verification",
      "confidence": 0.72,
      "reason": "matched keywords: authentication, security",
      "metadata": {
        "name": "database-verification",
        "description": "Database security verification",
        "category": "guardrails",
        "tags": ["database", "security"]
      }
    }
  ],
  "metrics": {
    "processingTime": 45,
    "cacheHit": false,
    "candidatesEvaluated": 15,
    "weights": {
      "keywords": 0.3,
      "intent": 0.2,
      "path": 0.3,
      "content": 0.2
    }
  }
}
```

### 4. Skill Execution

#### `POST /execute`

Execute a skill with specific arguments and policy enforcement.

**Request Body:**
```json
{
  "skill_id": "repo-auditor",
  "args": {
    "path": "./src",
    "severity": "warning"
  },
  "dry_run": false,
  "cwd": "/workspace",
  "needs": ["fs.read", "fs.write"],
  "challenge_id": "challenge-123",
  "confirm_token": "token-456"
}
```

**Successful Response:**
```json
{
  "stdout": "{\"results\": [{\"file\": \"src/index.ts\", \"issues\": []}]}",
  "artifacts": [],
  "changes": [
    {
      "path": "src/index.ts",
      "diff": "Added import statements"
    }
  ],
  "run_latency_ms": 1250,
  "evidence_id": "uuid-v4-evidence-id"
}
```

**Challenge Required Response (S1 Policy):**
```json
{
  "error": "challenge_required",
  "requireConfirm": true,
  "challenge_id": "challenge-123",
  "write_plan": {
    "files": [
      {
        "path": "src/new-file.ts",
        "content": "// Generated content"
      }
    ]
  },
  "policy_level": "S1",
  "ttl_ms": 300000,
  "denied": []
}
```

**Operation Denied Response:**
```json
{
  "error": "operation_denied",
  "message": "Skill requested operations outside allowed tools",
  "policy_level": "S2",
  "needs": ["fs.write", "network.request"],
  "denied": ["network.request"]
}
```

### 5. Metrics

#### `GET /metrics`

Get Prometheus-formatted metrics for monitoring.

**Response (text/plain):**
```
# HELP sf_daemon_activation_total Total number of skill activations
# TYPE sf_daemon_activation_total counter
sf_daemon_activation_total 1250

# HELP sf_daemon_activation_latency_seconds Skill activation latency
# TYPE sf_daemon_activation_latency_seconds histogram
sf_daemon_activation_latency_seconds_bucket{le="0.1"} 100
sf_daemon_activation_latency_seconds_bucket{le="0.5"} 800
sf_daemon_activation_latency_seconds_bucket{le="1.0"} 1100
sf_daemon_activation_latency_seconds_bucket{le="5.0"} 1240
sf_daemon_activation_latency_seconds_bucket{le="+Inf"} 1250

# HELP sf_daemon_cache_hit_rate Cache hit rate percentage
# TYPE sf_daemon_cache_hit_rate gauge
sf_daemon_cache_hit_rate 85.0
```

### 6. Validation

#### `POST /validate`

Validate API request/response schemas.

**Response:**
```json
{
  "status": "ok"
}
```

## Dashboard API Endpoints

### 7. Skills Overview

#### `GET /api/skills`

Get overview of all skills with health metrics.

**Response:**
```json
[
  {
    "name": "Policy S1",
    "healthScore": 85,
    "activations": 12,
    "issues": 1,
    "warnings": 2,
    "lastActivated": "2025-01-02T10:25:00.000Z"
  },
  {
    "name": "Code Analyzer",
    "healthScore": 92,
    "activations": 8,
    "issues": 0,
    "warnings": 1,
    "lastActivated": "2025-01-02T10:20:00.000Z"
  }
]
```

### 8. System Health

#### `GET /api/system-health`

Get comprehensive system health information.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "used": 256,
    "total": 512
  },
  "connectedServices": 3,
  "healthScore": 85,
  "summary": {
    "totalSkills": 4,
    "healthySkills": 3,
    "overallHealth": 85,
    "skillsNeedingAttention": 1,
    "criticalIssues": 0,
    "avgActivationRate": 85
  },
  "metrics": {
    "totalActivations": 41,
    "avgAccuracy": 92,
    "totalTokensUsed": 125000,
    "avgTokensPerActivation": 3048
  }
}
```

### 9. Real-time Metrics

#### `GET /api/realtime-metrics`

Get real-time performance metrics.

**Response:**
```json
{
  "cpu": 25,
  "memory": 45,
  "activeUsers": 15,
  "requestsPerSecond": 35,
  "timestamp": "2025-01-02T10:30:00.000Z",
  "activationsToday": 127,
  "liveActivations": 8,
  "activationHistory": [
    {
      "time": "2025-01-02T09:00:00.000Z",
      "activations": 5
    },
    {
      "time": "2025-01-02T10:00:00.000Z",
      "activations": 12
    }
  ]
}
```

## Quality Assurance API

### 10. User Prompt Submit Hook

#### `POST /api/hooks/user-prompt-submit`

Analyze user prompts for skill activation (Cursor IDE integration).

**Request Body:**
```json
{
  "prompt": "Create a REST API with authentication",
  "filePath": "src/api/auth.ts",
  "fileContent": "export class AuthController { ... }"
}
```

**Response:**
```json
{
  "activatedSkills": [
    "backend-dev-guidelines",
    "database-verification"
  ],
  "analysis": {
    "prompt": "Create a REST API with authentication",
    "matchesCount": 2,
    "hasFileContext": true
  }
}
```

### 11. Command Execution

#### `POST /api/commands/execute`

Execute CLI commands through the daemon.

**Request Body:**
```json
{
  "command": "skills:lint",
  "args": ["--fix"],
  "cwd": "/workspace"
}
```

**Response:**
```json
{
  "success": true,
  "output": "Command 'skills:lint' executed successfully",
  "executionTime": 1250,
  "timestamp": "2025-01-02T10:30:00.000Z"
}
```

### 12. File Formatting

#### `POST /api/qa/format-files`

Format files using Prettier.

**Request Body:**
```json
{
  "files": ["src/index.ts", "src/utils.ts"],
  "options": {
    "tabWidth": 2,
    "semi": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "formatted": 2,
  "failed": 0,
  "details": {
    "formatted": ["src/index.ts", "src/utils.ts"],
    "errors": []
  }
}
```

### 13. Build Check

#### `POST /api/qa/check-build`

Check build status and compile code.

**Request Body:**
```json
{
  "project": "frontend",
  "options": {
    "strict": true,
    "noEmit": false
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Build completed successfully",
  "details": {
    "buildTime": 2340,
    "typeScriptVersion": "5.3.3",
    "projects": "frontend",
    "filesProcessed": 25,
    "warnings": 2,
    "errors": 0
  },
  "timestamp": "2025-01-02T10:30:00.000Z"
}
```

## File Watching API

### 14. File Watcher Stats

#### `GET /api/file-watcher/stats`

Get file watching service statistics.

**Response:**
```json
{
  "isWatching": true,
  "watchedFiles": 150,
  "totalChanges": 25,
  "lastChange": "2025-01-02T10:25:00.000Z",
  "qualityChecks": 20,
  "qualityIssues": 2
}
```

### 15. File Watcher History

#### `GET /api/file-watcher/history`

Get recent file changes history.

**Query Parameters:**
- `limit` (optional): Number of entries to return (default: 50)

**Response:**
```json
[
  {
    "timestamp": "2025-01-02T10:25:00.000Z",
    "file": "src/index.ts",
    "type": "modified",
    "quality": {
      "status": "passed",
      "issues": 0
    }
  }
]
```

### 16. Quality Configuration

#### `GET /api/file-watcher/quality-config`

Get current quality configuration.

**Response:**
```json
{
  "enabled": true,
  "lintOnSave": true,
  "formatOnSave": true,
  "rules": {
    "maxFileLines": 400,
    "maxFunctionLines": 50
  }
}
```

#### `POST /api/file-watcher/quality-config`

Update quality configuration.

**Request Body:**
```json
{
  "enabled": true,
  "lintOnSave": true,
  "formatOnSave": false,
  "rules": {
    "maxFileLines": 500,
    "maxFunctionLines": 60
  }
}
```

### 17. Manual Quality Check

#### `POST /api/file-watcher/quality-check`

Trigger manual quality check for specific files.

**Request Body:**
```json
{
  "files": ["src/index.ts", "src/utils.ts"]
}
```

**Response:**
```json
{
  "results": [
    {
      "file": "src/index.ts",
      "status": "passed",
      "issues": [],
      "warnings": ["Unused import"]
    }
  ]
}
```

## Quality Service API

### 18. Lint Files

#### `POST /api/quality/lint`

Run ESLint on specified files.

**Request Body:**
```json
{
  "files": ["src/index.ts", "src/utils.ts"],
  "fix": false
}
```

**Response:**
```json
{
  "success": true,
  "tool": "eslint",
  "message": "Lint check completed",
  "details": {
    "totalFiles": 2,
    "errors": 0,
    "warnings": 3,
    "fixable": 2,
    "files": [
      {
        "path": "src/index.ts",
        "errors": 0,
        "warnings": 2,
        "fixable": 1
      }
    ]
  }
}
```

### 19. Quality Stats

#### `GET /api/quality/stats`

Get comprehensive quality statistics.

**Response:**
```json
{
  "quality": {
    "totalFiles": 150,
    "lintedFiles": 148,
    "formattedFiles": 145,
    "errorCount": 2,
    "warningCount": 15,
    "fixableIssues": 8
  },
  "fileWatching": {
    "isWatching": true,
    "watchedFiles": 150,
    "totalChanges": 25
  },
  "lastUpdate": "2025-01-02T10:30:00.000Z"
}
```

### 20. Setup Quality Config

#### `POST /api/quality/setup-config`

Create quality configuration files.

**Response:**
```json
{
  "success": true,
  "message": "Configuration files created successfully",
  "details": {
    "prettierConfig": ".prettierrc",
    "eslintConfig": ".eslintrc.json"
  },
  "timestamp": "2025-01-02T10:30:00.000Z"
}
```

## Cache Management API

### 21. Cache Statistics

#### `GET /api/cache/stats`

Get cache performance statistics.

**Response:**
```json
{
  "size": 150,
  "hits": 850,
  "misses": 150,
  "evictions": 5,
  "hitRate": 85.0
}
```

### 22. Clear Cache

#### `POST /api/cache/clear`

Clear the activation cache.

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "entriesCleared": 150
}
```

## Error Monitoring API

### 23. Error Statistics

#### `GET /api/errors/stats`

Get error tracking statistics.

**Response:**
```json
{
  "uptime": 3600,
  "memoryUsage": {
    "rss": 67108864,
    "heapTotal": 52428800,
    "heapUsed": 34078720,
    "external": 2097152
  },
  "cacheHitRate": 85.0,
  "timestamp": "2025-01-02T10:30:00.000Z"
}
```

### 24. Recent Errors

#### `GET /api/errors/recent`

Get recent errors and diagnostics.

**Response:**
```json
{
  "uptime": 3600,
  "memoryUsage": {
    "rss": 67108864,
    "heapTotal": 52428800,
    "heapUsed": 34078720,
    "external": 2097152
  },
  "cacheStats": {
    "size": 150,
    "hitRate": 85.0
  },
  "timestamp": "2025-01-02T10:30:00.000Z",
  "message": "Error tracking not fully implemented - showing system diagnostics"
}
```

## Authentication API

### 25. JWT Token

#### `POST /api/v1/auth/token`

Get JWT authentication token (only when `DAEMON_JWT_SECRET` is configured).

**Request Body:**
```json
{
  "sub": "cli-user",
  "expiresIn": 900
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

## Debug API

### 26. Debug Signals

#### `GET /debug/signals`

Debug signal computation for skill activation (opt-in endpoint).

**Query Parameters:**
- `intent` (required): Intent to analyze
- `useShared` (optional): Use shared signals computation (1/0)

**Response:**
```json
{
  "intentLength": 25,
  "weights": {
    "keywords": 0.25,
    "intent": 0.25,
    "path": 0.25,
    "content": 0.25
  },
  "local": {
    "keywords": 0.8,
    "intent": 0.6,
    "path": 0.4,
    "content": 0.2,
    "matched": ["authentication", "api", "backend"]
  },
  "shared": {
    "keywords": 0.85,
    "intent": 0.65,
    "path": 0.45,
    "content": 0.25
  },
  "using": {
    "sharedRules": true,
    "sharedSignals": true
  }
}
```

## Policy Levels

The daemon enforces security policies at different levels:

- **S0**: Safe operations (read-only, basic analysis)
- **S1**: Dangerous operations requiring confirmation (file writes, system changes)
- **S2**: High-risk operations (network requests, system commands)
- **NET**: Network operations (external API calls, downloads)

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "error_type",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error context"
  }
}
```

### Common Error Types

- `bad_request`: Invalid request format or missing required fields
- `unauthorized`: Authentication required or failed
- `operation_denied`: Policy violation or insufficient permissions
- `challenge_required`: S1 policy requires user confirmation
- `challenge_expired`: Confirmation challenge has expired
- `invalid_confirm_token`: Confirmation token is invalid
- `sandbox_escape`: Attempted operation outside sandbox bounds
- `schema_mismatch`: Response validation failed

## Rate Limiting

The daemon implements circuit breaker patterns and rate limiting:

- **Activation Cache**: 60-second TTL with configurable size limits
- **Circuit Breakers**: Automatic failover for external dependencies
- **Retry Logic**: Configurable retry attempts with exponential backoff

## WebSocket Support

The daemon supports WebSocket connections for real-time updates:

```javascript
const ws = new WebSocket('ws://127.0.0.1:7727/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

## Monitoring and Observability

### Health Checks

- **Service Health**: `/health` endpoint provides comprehensive health status
- **Dependency Health**: Database, cache, and external service health
- **Performance Metrics**: Latency, throughput, and error rates

### Metrics Collection

- **Prometheus Format**: `/metrics` endpoint for monitoring systems
- **Custom Metrics**: Activation counts, cache performance, policy decisions
- **System Metrics**: Memory usage, CPU utilization, process information

### Distributed Tracing

- **OpenTelemetry**: Optional distributed tracing support
- **Request Correlation**: Trace IDs for request flow tracking
- **Performance Analysis**: Latency breakdown across components

## Configuration

The daemon behavior can be configured via environment variables:

```bash
# Server Configuration
SF_HOST=127.0.0.1
SF_PORT=7727

# Cache Configuration
SF_CACHE_TTL=60000
SF_CACHE_MAX_SIZE=1000
SF_CACHE_CLEANUP_INTERVAL=30000

# Activation Configuration
SF_ACTIVATION_THRESHOLD=0.6
SF_W_KEYWORDS=0.25
SF_W_INTENT=0.25
SF_W_PATH=0.25
SF_W_CONTENT=0.25

# Authentication
DAEMON_API_KEY=your-api-key
DAEMON_JWT_SECRET=your-jwt-secret
CONFIRM_SECRET=your-confirm-secret

# Integration
SF_USE_SHARED_RULES=1
SF_USE_SHARED_SIGNALS=1
SF_DISCOVERY=1
DISCOVERY_URL=http://127.0.0.1:8877
```

This comprehensive API documentation provides all the information needed to integrate with and monitor the Skills Fabric Daemon service.