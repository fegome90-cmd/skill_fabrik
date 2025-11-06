# Usage Examples - MCP Prompt Builder v2

This document provides comprehensive examples of using the MCP Prompt Builder v2 server.

## Basic Usage

### Example 1: Simple Task Optimization

**Input:**
```typescript
{
  "tool": "optimize_prompt",
  "arguments": {
    "taskDescription": "Create a user login form"
  }
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "optimizedPrompt": "C1: CSE_Completo ✅\nCreate user login form with email/password validation...\n\nC2: TAGs_Cobertura ✅ (3 tags)\n\n🔗 Relevant files to open/edit:\n- frontend/src/components/LoginForm.tsx\n- frontend/src/hooks/useAuth.ts\n- frontend/src/utils/validation.ts\n\nTemplate v1.1.0 applied (8/8 components)",
    "expectedScore": 0.86,
    "activatedSkills": [
      {
        "skillId": "frontend-dev-guidelines",
        "score": 0.86,
        "reasons": ["frontend patterns matched", "component keywords found"]
      }
    ],
    "tagsCoverage": 0.60,
    "templateScore": 1.0,
    "contextualTags": [
      "[K:COMPONENT-LIBRARIES]",
      "[C:UI-DEVELOPMENT]",
      "[U:DEVELOPER-WORKFLOW]"
    ],
    "relevantFiles": [
      "frontend/src/components/LoginForm.tsx",
      "frontend/src/hooks/useAuth.ts",
      "frontend/src/utils/validation.ts"
    ],
    "recommendations": [
      "High confidence prompt - ready to use",
      "Use TypeScript for type safety",
      "Include accessibility attributes (aria-label, etc.)"
    ]
  }
}
```

---

### Example 2: Backend API with Specific Skill

**Input:**
```typescript
{
  "tool": "optimize_prompt",
  "arguments": {
    "taskDescription": "Create user registration endpoint",
    "skillId": "backend-architecture-patterns",
    "includeFiles": true,
    "includeTags": true,
    "includeTemplate": true,
    "complexity": "medium"
  }
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "optimizedPrompt": "C1: CSE_Completo ✅\nCreate user registration endpoint with email validation, password hashing, and database storage...\n\nC2: TAGs_Cobertura ✅ (4 tags)\n\n🔗 Relevant files to open/edit:\n- backend/src/controllers/UserController.ts\n- backend/src/services/UserService.ts\n- backend/src/models/User.ts\n- backend/src/middleware/validation.middleware.ts\n\nTemplate v1.1.0 applied (8/8 components)",
    "expectedScore": 0.89,
    "activatedSkills": [
      {
        "skillId": "backend-architecture-patterns",
        "score": 0.89,
        "reasons": ["backend patterns matched", "API keywords found"]
      }
    ],
    "tagsCoverage": 0.80,
    "templateScore": 1.0,
    "contextualTags": [
      "[K:BACKEND-ARCHITECTURE]",
      "[C:API-DEVELOPMENT]",
      "[U:DEVELOPER-WORKFLOW]",
      "[C:VALIDATION-PATTERNS]"
    ],
    "relevantFiles": [
      "backend/src/controllers/UserController.ts",
      "backend/src/services/UserService.ts",
      "backend/src/models/User.ts"
    ],
    "recommendations": [
      "High confidence prompt - ready to use",
      "Include password hashing library (bcrypt/argon2)",
      "Add email verification flow",
      "Implement rate limiting to prevent spam"
    ]
  }
}
```

---

### Example 3: Multi-Skill Complex Task

**Input:**
```typescript
{
  "tool": "optimize_prompt",
  "arguments": {
    "taskDescription": "Build a complete authentication system with JWT, refresh tokens, and database",
    "skillIds": [
      "backend-architecture-patterns",
      "security-patterns",
      "database-verification"
    ],
    "complexity": "high",
    "includeFiles": true,
    "includeTags": true,
    "includeTemplate": true
  }
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "optimizedPrompt": "C1: CSE_Completo ✅\nBuild complete authentication system with JWT access tokens, refresh token rotation, secure password hashing, and database integration...\n\nC2: TAGs_Cobertura ✅ (6 tags)\n\n🔗 Relevant files to open/edit:\n- backend/src/auth/AuthController.ts\n- backend/src/auth/JwtService.ts\n- backend/src/auth/RefreshTokenService.ts\n- backend/src/middleware/auth.middleware.ts\n- backend/src/models/User.ts\n- backend/src/repositories/UserRepository.ts\n\nTemplate v1.1.0 applied (8/8 components)",
    "expectedScore": 0.95,
    "activatedSkills": [
      {
        "skillId": "backend-architecture-patterns",
        "score": 0.95,
        "reasons": ["backend patterns matched", "architecture keywords found"]
      },
      {
        "skillId": "security-patterns",
        "score": 0.88,
        "reasons": ["JWT authentication", "security keywords found"]
      },
      {
        "skillId": "database-verification",
        "score": 0.82,
        "reasons": ["database integration", "persistence patterns"]
      }
    ],
    "tagsCoverage": 0.90,
    "templateScore": 1.0,
    "contextualTags": [
      "[K:SECURITY-PATTERNS]",
      "[C:CONFIGURATION-MANAGEMENT]",
      "[U:DEVELOPER-WORKFLOW]",
      "[K:DATABASE-OPERATIONS]",
      "[C:AUTHENTICATION-SYSTEM]",
      "[C:TOKEN-MANAGEMENT]"
    ],
    "relevantFiles": [
      "backend/src/auth/AuthController.ts",
      "backend/src/auth/JwtService.ts",
      "backend/src/auth/RefreshTokenService.ts"
    ],
    "recommendations": [
      "High confidence prompt - ready to use",
      "Include authentication middleware for production",
      "Use connection pooling for database operations",
      "Implement JWT with short-lived access tokens",
      "Store refresh tokens securely in database",
      "Add rate limiting to prevent brute force attacks",
      "Implement refresh token rotation for security",
      "Include audit logging for authentication events"
    ]
  }
}
```

---

### Example 4: Database Optimization Task

**Input:**
```typescript
{
  "tool": "optimize_prompt",
  "arguments": {
    "taskDescription": "Optimize PostgreSQL queries for a reporting dashboard",
    "skillId": "database-verification",
    "complexity": "high"
  }
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "optimizedPrompt": "C1: CSE_Completo ✅\nOptimize PostgreSQL queries for reporting dashboard with proper indexing, query caching, and performance monitoring...\n\nC2: TAGs_Cobertura ✅ (5 tags)\n\n🔗 Relevant files to open/edit:\n- backend/src/repositories/ReportRepository.ts\n- backend/src/services/ReportService.ts\n- database/migrations/AddReportIndexes.sql\n- backend/src/utils/QueryOptimizer.ts\n\nTemplate v1.1.0 applied (8/8 components)",
    "expectedScore": 0.92,
    "activatedSkills": [
      {
        "skillId": "database-verification",
        "score": 0.92,
        "reasons": ["database patterns matched", "optimization keywords found"]
      }
    ],
    "tagsCoverage": 0.85,
    "templateScore": 1.0,
    "contextualTags": [
      "[K:DATABASE-OPERATIONS]",
      "[C:PERFORMANCE-OPTIMIZATION]",
      "[U:DEVELOPER-WORKFLOW]",
      "[K:QUERY-OPTIMIZATION]",
      "[C:INDEXING-STRATEGIES]"
    ],
    "relevantFiles": [
      "backend/src/repositories/ReportRepository.ts",
      "database/migrations/AddReportIndexes.sql"
    ],
    "recommendations": [
      "High confidence prompt - ready to use",
      "Use connection pooling for database operations",
      "Create appropriate indexes on frequently queried columns",
      "Use EXPLAIN ANALYZE to identify slow queries",
      "Implement query result caching (Redis)",
      "Consider materialized views for complex aggregations",
      "Monitor query performance with pg_stat_statements",
      "Partition large tables if needed for performance"
    ]
  }
}
```

---

## Performance Monitoring Examples

### Example 5: Get Performance Report

**Input:**
```typescript
{
  "tool": "get_performance_metrics",
  "arguments": {
    "format": "report"
  }
}
```

**Output:**
```
📊 PERFORMANCE METRICS DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Uptime: 15.32 minutes
🔄 Operations: 47
📦 Cache Hit Rate: 94.2%
⏲️  Avg Latency: 12.5ms
💾 Memory: 14.2MB
🖥️  CPU: 4.1%
⚡ Parallel Efficiency: 78.3%
👷 Worker Utilization: 72.0%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Operation Breakdown:
  • findRealFiles: 32x calls, avg 8.3ms
  • buildOptimizedPromptV2: 15x calls, avg 15.2ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Example 6: Get JSON Metrics

**Input:**
```typescript
{
  "tool": "get_performance_metrics",
  "arguments": {
    "format": "json"
  }
}
```

**Output:**
```json
{
  "summary": {
    "totalMetrics": 47,
    "cacheHitRate": 94.2,
    "averageLatency": 12.5,
    "uptime": 919200,
    "memoryUsage": 14.2,
    "cpuUsage": 4.1,
    "parallelEfficiency": 78.3,
    "workerUtilization": 72.0
  },
  "metrics": [
    {
      "timestamp": 1701234567890,
      "operation": "findRealFiles",
      "duration": 8.3,
      "cacheHitRate": 94.2,
      "memoryUsage": 14.2,
      "cpuUsage": 4.1,
      "parallelEfficiency": 78.3,
      "workerUtilization": 72.0
    }
  ],
  "operationCounts": {
    "findRealFiles": 32,
    "buildOptimizedPromptV2": 15
  }
}
```

---

## System Health Examples

### Example 7: System Health Check (Healthy)

**Input:**
```typescript
{
  "tool": "system_health_check",
  "arguments": {}
}
```

**Output:**
```json
{
  "success": true,
  "healthy": true,
  "metrics": {
    "averageLatency": 12.5,
    "memoryUsage": 14.2,
    "cacheHitRate": 94.2,
    "totalOperations": 47
  },
  "timestamp": "2025-11-03T23:51:00.000Z"
}
```

---

### Example 8: System Health Check (Degraded)

**Input:**
```typescript
{
  "tool": "system_health_check",
  "arguments": {}
}
```

**Output:**
```json
{
  "success": true,
  "healthy": false,
  "metrics": {
    "averageLatency": 145.3,
    "memoryUsage": 22.8,
    "cacheHitRate": 65.4,
    "totalOperations": 47
  },
  "warnings": [
    "Average latency (145.3ms) exceeds threshold (100ms)",
    "Memory usage (22.8MB) exceeds threshold (18MB)",
    "Cache hit rate (65.4%) below recommended (85%)"
  ],
  "timestamp": "2025-11-03T23:51:00.000Z"
}
```

---

## List Skills Example

### Example 9: List Available Skills

**Input:**
```typescript
{
  "tool": "list_available_skills",
  "arguments": {}
}
```

**Output:**
```json
{
  "success": true,
  "skills": [
    {
      "id": "backend-architecture-patterns",
      "name": "Backend Architecture Patterns",
      "index": 1
    },
    {
      "id": "api-design-and-testing",
      "name": "Api Design And Testing",
      "index": 2
    },
    {
      "id": "database-verification",
      "name": "Database Verification",
      "index": 3
    },
    {
      "id": "performance-optimization",
      "name": "Performance Optimization",
      "index": 4
    },
    {
      "id": "frontend-dev-guidelines",
      "name": "Frontend Dev Guidelines",
      "index": 5
    },
    {
      "id": "security-patterns",
      "name": "Security Patterns",
      "index": 6
    },
    {
      "id": "error-pattern-standardization",
      "Name": "Error Pattern Standardization",
      "index": 7
    },
    {
      "id": "test-driven-development",
      "name": "Test Driven Development",
      "index": 8
    }
  ]
}
```

---

## Complex Real-World Examples

### Example 10: Full-Stack Feature

**User Request:**
```
"I need to build a complete e-commerce product listing page with search, filter, pagination, and add-to-cart functionality"
```

**MCP Call:**
```typescript
{
  "tool": "optimize_prompt",
  "arguments": {
    "taskDescription": "Build complete e-commerce product listing page with search, filter, pagination, and add-to-cart",
    "skillIds": ["frontend-dev-guidelines", "api-design-and-testing", "performance-optimization"],
    "complexity": "very-high",
    "includeFiles": true,
    "includeTags": true,
    "includeTemplate": true
  }
}
```

**Output:** (abbreviated for brevity)
```json
{
  "success": true,
  "data": {
    "optimizedPrompt": "C1: CSE_Completo ✅\nBuild complete e-commerce product listing page...\n[Full Template v1.1.0 with C1-C8]",
    "expectedScore": 0.94,
    "activatedSkills": [
      {"skillId": "frontend-dev-guidelines", "score": 0.94},
      {"skillId": "api-design-and-testing", "score": 0.87},
      {"skillId": "performance-optimization", "score": 0.83}
    ],
    "contextualTags": [
      "[K:COMPONENT-LIBRARIES]",
      "[C:UI-DEVELOPMENT]",
      "[K:API-DESIGN]",
      "[C:TESTING-STRATEGIES]",
      "[K:PERFORMANCE-OPTIMIZATION]"
    ],
    "recommendations": [
      "Use React.memo for product cards",
      "Implement virtual scrolling for large lists",
      "Add debounced search input",
      "Use React Query for API caching",
      "Include unit and integration tests",
      "Add loading skeletons",
      "Implement error boundaries",
      "Use TypeScript for type safety",
      "Add accessibility features (ARIA labels)",
      "Include performance monitoring"
    ]
  }
}
```

---

## Error Handling Examples

### Example 11: Skill Not Found

**Input:**
```typescript
{
  "tool": "optimize_prompt",
  "arguments": {
    "taskDescription": "Create a test",
    "skillId": "non-existent-skill"
  }
}
```

**Output:**
```json
{
  "success": false,
  "error": "Skill 'non-existent-skill' not found in skill-rules.json"
}
```

---

### Example 12: Missing Required Parameter

**Input:**
```typescript
{
  "tool": "optimize_prompt",
  "arguments": {
    "skillId": "backend-architecture-patterns"
    // Missing taskDescription
  }
}
```

**Output:**
```json
{
  "success": false,
  "error": "Invalid arguments: taskDescription is required"
}
```

---

## Best Practices

### 1. Use Multiple Skills for Complex Tasks

```typescript
{
  "taskDescription": "Complex task description",
  "skillIds": ["skill1", "skill2", "skill3"],
  "complexity": "high"
}
```

### 2. Always Include Template v1.1.0

```typescript
{
  "taskDescription": "Any task",
  "includeTemplate": true  // Ensures C1-C8 structure
}
```

### 3. Enable TAGs for Context

```typescript
{
  "taskDescription": "Any task",
  "includeTags": true  // Generates [K:C:U:] TAGs
}
```

### 4. Check System Health Regularly

```typescript
// Use before intensive operations
{
  "tool": "system_health_check",
  "arguments": {}
}
```

### 5. Monitor Performance

```typescript
// Check metrics periodically
{
  "tool": "get_performance_metrics",
  "arguments": {
    "format": "report"
  }
}
```

---

## Summary

These examples show:
- ✅ Basic to advanced prompt optimization
- ✅ Single and multi-skill activation
- ✅ Performance monitoring
- ✅ Health checks
- ✅ Error handling
- ✅ Real-world use cases

**Key Takeaways:**
1. Use `optimize_prompt` for all prompt generation
2. Combine multiple skills for comprehensive coverage
3. Always enable Template v1.1.0 and TAGs
4. Monitor performance with `get_performance_metrics`
5. Check health with `system_health_check`
6. List skills with `list_available_skills`
