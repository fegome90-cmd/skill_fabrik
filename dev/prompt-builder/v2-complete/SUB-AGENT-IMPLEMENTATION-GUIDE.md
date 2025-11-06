# 🤖 Sub-Agent: Prompt Builder v2 Assistant - Implementation Guide

## Quick Start

### 1. Activate the Sub-Agent

Simply provide the sub-agent prompt to your AI system (Claude, GPT, etc.):

```
[Insert the contents of SUB-AGENT-PROMPT-BUILDER-V2.txt here]
```

### 2. Use It

Once activated, give it tasks:

**Input:**
```
Create optimized prompt for: "Build a PostgreSQL database with connection pooling"
```

**Output:**
```
📋 OPTIMIZED PROMPT
[C1-C8 Template structure with TAGs]

📊 METRICS & ANALYSIS
Score: 0.XX/1.0
Skills: X activated
...

💡 RECOMMENDATIONS
[Actionable tips]
```

---

## Integration Examples

### Example 1: Basic Task

```bash
User → "I need to create a REST API endpoint"
Sub-Agent → Returns PBv2-optimized prompt with:
  • Template v1.1.0 applied (C1-C8)
  • Contextual TAGs generated
  • Score and confidence metrics
  • Relevant file suggestions
  • Usage recommendations
```

### Example 2: Multi-Skill Task

```bash
User → "Build a complete authentication system with JWT and refresh tokens"
Sub-Agent → Activates multiple skills:
  • backend-architecture-patterns
  • security-patterns
  • database-verification
  Returns combined optimization with highest-scoring skills
```

### Example 3: Technical Task

```bash
User → "Optimize React component for performance with React.memo and useMemo"
Sub-Agent → Returns:
  • frontend-dev-guidelines applied
  • Component optimization patterns
  • Performance-specific TAGs
  • Code examples
```

---

## API Reference

### Input Format

The sub-agent accepts:

```typescript
interface TaskInput {
  description: string;           // Natural language task
  skillId?: string;              // Specific skill (optional)
  skillIds?: string[];           // Multiple skills (optional)
  includeFiles?: boolean;        // Auto-detect files (default: true)
  includeTags?: boolean;         // Generate TAGs (default: true)
  includeTemplate?: boolean;     // Apply v1.1.0 (default: true)
  complexity?: 'low'|'medium'|'high'|'very-high';
  cwd?: string;                  // Working directory
}
```

### Output Format

```typescript
interface OptimizedOutput {
  optimizedPrompt: string;       // The curated prompt
  expectedScore: number;         // 0-1 confidence score
  activatedSkills: Array<{       // Skills that matched
    skillId: string;
    score: number;
    reasons: string[];
  }>;
  tagsCoverage?: number;         // 0-1 TAGs coverage
  templateScore?: number;        // 0-1 Template completeness
  metrics: {
    cacheHit?: boolean;
    memoryMB?: number;
    parallelEfficiency?: number;
  };
}
```

---

## Common Use Cases

### 1. API Development

**User Input:**
```
"Create a user registration endpoint with validation"
```

**Sub-Agent Output:**
```
📋 OPTIMIZED PROMPT
C1: CSE_Completo ✅
C2: TAGs_Cobertura ✅
[Full template with backend patterns]

📊 METRICS
Score: 0.89/1.0
Skills: backend-dev-guidelines (89%), api-design (85%)
TAGs: [K:BACKEND-ARCHITECTURE], [C:API-DEVELOPMENT]

💡 RECOMMENDATIONS
• Include input validation middleware
• Add password hashing (bcrypt)
• Implement rate limiting
```

### 2. Database Tasks

**User Input:**
```
"Set up PostgreSQL with connection pooling using pg"
```

**Sub-Agent Output:**
```
📋 OPTIMIZED PROMPT
[Database setup with pg pool]

📊 METRICS
Score: 0.92/1.0
Skills: database-management (92%)
TAGs: [K:DATABASE-CONNECTION], [C:INFRASTRUCTURE-SETUP]

💡 RECOMMENDATIONS
• Use environment variables for connection strings
• Implement connection leak detection
• Add retry logic with exponential backoff
```

### 3. Frontend Development

**User Input:**
```
"Create a reusable Button component with variants"
```

**Sub-Agent Output:**
```
📋 OPTIMIZED PROMPT
[React component with variants]

📊 METRICS
Score: 0.86/1.0
Skills: frontend-dev-guidelines (86%)
TAGs: [K:COMPONENT-LIBRARIES], [C:UI-DEVELOPMENT]

💡 RECOMMENDATIONS
• Use TypeScript for type safety
• Implement storybook for component docs
• Add unit tests with Jest/React Testing Library
```

---

## Advanced Features

### Performance Monitoring

You can access PBv2's performance metrics:

```typescript
import { getPerformanceReport, exportMetrics } from '@skills-fabrik/skills-cli';

// In your agent, you can show:
console.log(getPerformanceReport());
/*
📊 PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Uptime: 15.32 minutes
🔄 Operations: 47
📦 Cache Hit Rate: 94.2%
⏲️  Avg Latency: 12.5ms
💾 Memory: 14.2MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
```

### Custom Skill Activation

```typescript
// For specific domain tasks
const result = await buildOptimizedPromptV2({
  skillIds: [
    'backend-architecture-patterns',
    'api-design-and-testing',
    'database-verification',
    'performance-optimization'
  ],
  description: userTask,
  multipleSkills: true,
  includeFiles: true,
  includeContent: true,
  includeTemplate: true,
  includeTags: true
});
```

### Error Recovery

The sub-agent should handle:

1. **Skill not found**
   ```typescript
   // Suggest similar skills
   "Skill 'invalid-skill' not found. Did you mean:
    • backend-architecture-patterns
    • frontend-dev-guidelines
    • database-verification"
   ```

2. **Low score output**
   ```typescript
   // Provide improvement suggestions
   "Score: 0.45/1.0 (45% confidence)

   ⚠️ This prompt may not strongly activate skills.
   Consider:
   • Opening relevant files in your editor
   • Adding more specific keywords
   • Using multiple skills"
   ```

3. **Performance issues**
   ```typescript
   // Suggest optimization
   "⚠️ High latency detected (150ms)
   💡 Try: projectIndexManager.regenerate(cwd)"
   ```

---

## Best Practices

### 1. Always Apply Template v1.1.0

```typescript
includeTemplate: true  // Ensures C1-C8 structure
```

### 2. Generate Contextual TAGs

```typescript
includeTags: true  // Adds [K:], [C:], [U:] markers
```

### 3. Detect Relevant Files

```typescript
includeFiles: true  // Suggests files to open/edit
```

### 4. Provide Content Snippets

```typescript
includeContent: true  // Includes code examples
```

### 5. Monitor Performance

```typescript
// Add to your agent's response
"📈 Performance: {latency}ms (cache hit)"
```

---

## Customization Options

### Environment Variables

```bash
# Cache configuration
export SKILLS_PB_CACHE_TTL=1800000  # 30 minutes
export SKILLS_PB_MAX_CACHE_SIZE=50

# Performance tuning
export SKILLS_PB_MAX_WORKERS=4
export SKILLS_PB_ENABLE_PARALLEL=true
export SKILLS_PB_USE_WORKERS_THRESHOLD=1000

# Debug mode
export DEBUG=skills-cli:prompt-builder
```

### Agent Behavior

You can customize:

```typescript
const DEFAULT_OPTIONS = {
  includeFiles: true,        // Auto-detect files
  includeTags: true,         // Generate TAGs
  includeTemplate: true,     // Apply v1.1.0
  includeContent: true,      // Include snippets
  complexity: 'medium',      // Default complexity
  enableValidation: true     // Validate output
};
```

---

## Testing Your Sub-Agent

### Test 1: Basic Functionality

```
Input: "Create a login form"
Expected: Optimized prompt with Template v1.1.0 + TAGs
```

### Test 2: Multi-Skill

```
Input: "Build complete user management system"
Expected: Multiple skills activated, combined optimization
```

### Test 3: Error Handling

```
Input: "invalid-skill-name"
Expected: Suggestion of similar skills
```

### Test 4: Performance

```
Input: "Any task"
Expected: <100ms response time (after cache warmup)
```

---

## Integration Checklist

- [ ] PBv2 package installed (`@skills-fabrik/skills-cli`)
- [ ] Sub-agent prompt configured
- [ ] Input/output formats defined
- [ ] Error handling implemented
- [ ] Performance monitoring enabled
- [ ] Template v1.1.0 applied
- [ ] TAGs system activated
- [ ] Metrics display configured
- [ ] Testing completed

---

## Support Resources

- **PBv2 API Docs**: `api-reference/PROMPT-BUILDER-V2-API.md`
- **Implementation**: `implementation-reports/`
- **Source Code**: `source-code/`
- **Performance Report**: Use `getPerformanceReport()`

---

## Example Session

```bash
🤖 Sub-Agent: Ready to optimize prompts with PBv2

👤 User: "Create a Redis caching layer"

🤖 Sub-Agent:
┌─────────────────────────────────────────────────────────────┐
│ 📋 OPTIMIZED PROMPT                                         │
├─────────────────────────────────────────────────────────────┤
│ C1: CSE_Completo ✅                                         │
│ Implement Redis caching layer with connection management    │
│                                                             │
│ 🏷️ TAGs applied:                                           │
│   [K:MEMORY-SYSTEM]                                         │
│   [C:MEMORY-MANAGEMENT]                                     │
│                                                             │
│ 🔗 Relevant files:                                         │
│   - backend/src/cache/redis.service.ts                     │
│   - backend/src/cache/cache.middleware.ts                  │
│                                                             │
│ Template v1.1.0 applied (8/8 components)                   │
└─────────────────────────────────────────────────────────────┘

📊 METRICS & ANALYSIS
Score: 0.88/1.0 (88% confidence)
Skills Activated: 2 skills
  • performance-optimization: 88%
  • backend-dev-guidelines: 76%
TAGs Coverage: 60%
Template: ✅ v1.1.0 (8/8 components)

🏷️ CONTEXTUAL TAGS
[K:MEMORY-SYSTEM], [C:MEMORY-MANAGEMENT]

💡 USAGE RECOMMENDATIONS
1. Include ioredis or redis-client library
2. Implement cache invalidation strategy
3. Add monitoring for hit/miss ratio

📈 Performance: 45ms (cache hit)
```

---

**Ready to deploy!** This sub-agent will provide PBv2-powered prompt optimization for any task.
