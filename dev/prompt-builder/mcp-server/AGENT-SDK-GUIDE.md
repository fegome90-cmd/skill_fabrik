# 🤖 Claude Agent SDK + Prompt Builder v2 Guide

**Create custom AI agents using the Claude Agent SDK with Prompt Builder v2**

## Overview

This guide shows how to build custom AI agents using the **Claude Agent SDK** that integrate with **Prompt Builder v2** for prompt optimization.

## What is the Claude Agent SDK?

The Claude Agent SDK allows you to:
- ✅ Build custom AI agents with specific roles and capabilities
- ✅ Define custom tools and handlers
- ✅ Control agent permissions and behavior
- ✅ Integrate external services and APIs
- ✅ Manage context and state

## Installation

```bash
npm install @anthropic-ai/claude-agent-sdk
npm install @skills-fabrik/skills-cli
```

## Quick Start (3 Steps)

### Step 1: Create Agent

```typescript
import { createAgent } from '@anthropic-ai/claude-agent-sdk';
import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';

const agent = createAgent({
  name: 'Prompt Optimizer',
  description: 'Optimizes prompts using PBv2',
  systemPrompt: 'You optimize prompts using Prompt Builder v2...',
  tools: [/* your tools */],
  toolHandlers: { /* handlers */ },
});
```

### Step 2: Use Agent

```typescript
const response = await agent.send({
  message: 'Create a REST API with authentication',
});

console.log(response.content);
```

### Step 3: Get Results

```
✅ Optimized prompt with Template v1.1.0
📊 Score: 0.89
🎯 Skills: backend-dev-guidelines (89%)
🏷️ TAGs: [K:BACKEND-ARCHITECTURE]
💡 Recommendations: [...]
```

## Complete Example

```typescript
import {
  Agent,
  createAgent,
} from '@anthropic-ai/claude-agent-sdk';
import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';

// Define optimize_prompt tool
const optimizePromptTool = {
  name: 'optimize_prompt',
  description: 'Optimize a task using PBv2',
  input_schema: {
    type: 'object',
    properties: {
      taskDescription: { type: 'string' },
      skillId: { type: 'string' },
      includeTemplate: { type: 'boolean', default: true },
    },
    required: ['taskDescription'],
  },
};

// Create agent
const agent = createAgent({
  name: 'Prompt Builder v2 Agent',
  description: 'Specialized in prompt optimization',

  systemPrompt: `
    You are a Prompt Builder v2 Agent. Help users transform
    their tasks into optimized prompts using PBv2.
  `,

  tools: [optimizePromptTool],

  toolHandlers: {
    optimize_prompt: async (args) => {
      const result = await buildOptimizedPromptV2({
        description: args.taskDescription,
        skillId: args.skillId,
        includeTemplate: args.includeTemplate,
        includeTags: true,
        includeFiles: true,
      });

      return {
        type: 'tool_result',
        content: JSON.stringify({
          optimizedPrompt: result.prompt,
          expectedScore: result.expectedScore,
          activatedSkills: result.skillActivation,
          contextualTags: result.signals.tags,
        }, null, 2),
      };
    },
  },
});

// Use the agent
const response = await agent.send({
  message: 'Optimize: Create user authentication with JWT',
});

console.log(response.content);
```

## Available Tools

### 1. `optimize_prompt`

**Purpose:** Transform tasks into optimized prompts

**Parameters:**
```typescript
{
  taskDescription: string;           // Required
  skillId?: string;                  // Optional
  skillIds?: string[];               // Optional
  includeFiles?: boolean;            // Default: true
  includeTags?: boolean;             // Default: true
  includeTemplate?: boolean;         // Default: true
  complexity?: 'low'|'medium'|'high'|'very-high';  // Default: medium
}
```

**Returns:**
- Optimized prompt (Template v1.1.0)
- Expected score (0-1)
- Activated skills
- Contextual TAGs
- Recommendations

### 2. `get_performance_metrics`

**Purpose:** Monitor PBv2 performance

**Parameters:**
```typescript
{
  format?: 'report' | 'json';  // Default: report
}
```

### 3. `system_health_check`

**Purpose:** Check system health

**Parameters:**
```typescript
{}
```

### 4. `list_available_skills`

**Purpose:** List available skills

**Parameters:**
```typescript
{}
```

## Example Conversations

### Example 1: Basic Task

```
User: Create a login form

Agent: I'll optimize this task using Prompt Builder v2.

[Uses optimize_prompt tool]

Optimized Prompt:
C1: CSE_Completo ✅
Create user login form with email/password validation...

📊 Expected Score: 0.86
🎯 Activated Skills: frontend-dev-guidelines (86%)
🏷️ TAGs: [K:COMPONENT-LIBRARIES], [C:UI-DEVELOPMENT]
💡 Recommendations:
  - Use TypeScript for type safety
  - Include accessibility attributes
  - Add form validation
```

### Example 2: Multi-Skill Task

```
User: Build complete authentication system

Agent: I'll use multiple skills for comprehensive coverage.

[Uses optimize_prompt with skillIds=['backend-architecture-patterns', 'security-patterns']]

Optimized Prompt:
[Multi-skill optimized prompt]

📊 Expected Score: 0.95
🎯 Activated Skills:
  - backend-architecture-patterns (95%)
  - security-patterns (88%)
  - database-verification (82%)
💡 Recommendations:
  - Implement JWT with refresh tokens
  - Use bcrypt for password hashing
  - Add rate limiting
  - Set up connection pooling
```

### Example 3: Performance Check

```
User: Check PBv2 performance

Agent: Let me check the system metrics.

[Uses get_performance_metrics tool]

📊 PERFORMANCE METRICS DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Uptime: 15.32 minutes
🔄 Operations: 47
📦 Cache Hit Rate: 94.2%
⏲️  Avg Latency: 12.5ms
💾 Memory: 14.2MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Agent Configuration

### System Prompt

Define your agent's role:

```typescript
const agent = createAgent({
  systemPrompt: `
    You are a Prompt Builder v2 Agent. Your expertise includes:
    - Transforming natural language tasks into optimized prompts
    - Applying Template v1.1.0 structure
    - Generating contextual TAGs
    - Activating appropriate skills
    - Providing actionable recommendations

    When users give you tasks, use the optimize_prompt tool
    to generate optimized prompts with analysis and guidance.
  `,
});
```

### Tool Permissions

Control which tools the agent can use:

```typescript
const agent = createAgent({
  // Only allow specific tools
  allowedTools: ['optimize_prompt', 'get_performance_metrics'],

  // Or block specific tools
  disallowedTools: ['file_write'],

  // Permission mode
  permissionMode: 'auto',  // 'auto' | 'manual' | 'toolBased'
});
```

### Custom Tools

Add your own tools:

```typescript
const customTool = {
  name: 'my_custom_tool',
  description: 'Custom functionality',
  input_schema: {
    type: 'object',
    properties: {
      param: { type: 'string' },
    },
    required: ['param'],
  },
};

const agent = createAgent({
  tools: [optimizePromptTool, customTool],
  toolHandlers: {
    my_custom_tool: async (args) => {
      // Custom logic
      return { type: 'tool_result', content: '...' };
    },
  },
});
```

## Best Practices

### 1. Clear System Prompt

```typescript
const agent = createAgent({
  systemPrompt: `
    You are a specialized agent with a specific role.

    Your capabilities:
    - What you can do
    - How you do it
    - What to expect

    Guidelines:
    - Be concise
    - Be accurate
    - Be helpful
  `,
});
```

### 2. Handle Errors Gracefully

```typescript
toolHandlers: {
  optimize_prompt: async (args) => {
    try {
      const result = await buildOptimizedPromptV2(args);
      return { type: 'tool_result', content: JSON.stringify(result) };
    } catch (error) {
      return {
        type: 'tool_result',
        content: JSON.stringify({ error: error.message }),
        is_error: true,
      };
    }
  },
}
```

### 3. Provide Rich Responses

```typescript
toolHandlers: {
  optimize_prompt: async (args) => {
    const result = await buildOptimizedPromptV2(args);

    const response = {
      optimizedPrompt: result.prompt,
      analysis: {
        score: result.expectedScore,
        skills: result.skillActivation,
        tags: result.signals.tags,
        coverage: result.tagsCoverage,
      },
      recommendations: generateRecommendations(result),
    };

    return {
      type: 'tool_result',
      content: JSON.stringify(response, null, 2),
    };
  },
}
```

### 4. Use Multiple Skills for Complex Tasks

```typescript
const response = await agent.send({
  message: `
    Optimize this complex task:

    Task: Build e-commerce platform with React frontend and Node.js backend
    Skills: frontend-dev-guidelines, backend-architecture-patterns, database-verification
    Complexity: very-high
  `,
});
```

## Integration Examples

### Web Application

```typescript
// Express.js server
import express from 'express';
import { promptBuilderAgent } from './agent';

const app = express();

app.post('/optimize', async (req, res) => {
  const agent = await promptBuilderAgent.create();

  const response = await agent.send({
    message: req.body.task,
  });

  res.json(JSON.parse(response.content));
});

app.listen(3000);
```

### CLI Tool

```typescript
#!/usr/bin/env node
import { promptBuilderAgent } from './agent';

async function main() {
  const task = process.argv.slice(2).join(' ');

  const agent = await promptBuilderAgent.create();
  const response = await agent.send({ message: task });

  console.log(response.content);
}

main();
```

### Integration with Other Tools

```typescript
import { promptBuilderAgent } from './agent';
import { fileSystemTools } from '@anthropic-ai/claude-agent-sdk';

const agent = await promptBuilderAgent.create({
  tools: [
    optimizePromptTool,
    ...fileSystemTools,  // Add file operations
  ],
});
```

## Full Agent Implementation

See `agent-sdk-example.ts` for a complete implementation with:
- All 4 tools (optimize_prompt, get_performance_metrics, system_health_check, list_available_skills)
- Error handling
- Recommendations engine
- Multiple usage examples

## Testing Your Agent

### Unit Tests

```typescript
import { promptBuilderAgent } from './agent';

test('optimize_prompt tool works', async () => {
  const agent = await promptBuilderAgent.create();
  const response = await agent.send({
    message: 'Create a REST API',
  });

  const result = JSON.parse(response.content);
  expect(result.success).toBe(true);
  expect(result.optimizedPrompt).toContain('C1:');
  expect(result.expectedScore).toBeGreaterThan(0);
});
```

### Manual Testing

```typescript
// Test individual tools
const agent = await promptBuilderAgent.create();

// Test optimize_prompt
let response = await agent.send({
  message: 'optimize_prompt: Create a login form',
});

// Test performance metrics
response = await agent.send({
  message: 'get_performance_metrics: format=report',
});

// Test health check
response = await agent.send({
  message: 'system_health_check',
});
```

## Deployment

### Environment Variables

```bash
export ANTHROPIC_API_KEY=your_api_key
export SKILLS_PB_CACHE_TTL=1800000
export SKILLS_PB_MAX_WORKERS=4
```

### Docker

```dockerfile
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["node", "dist/agent.js"]
```

## Troubleshooting

### Agent Not Responding

```typescript
// Check agent creation
const agent = await promptBuilderAgent.create();
console.log('Agent created:', agent);

// Check tool registration
console.log('Available tools:', agent.tools);
```

### Tool Errors

```typescript
// Enable debug mode
DEBUG=claude-agent-sdk:* node your-agent.js

// Check tool handlers
console.log('Tool handlers:', agent.toolHandlers);
```

### PBv2 Integration Issues

```typescript
// Test PBv2 directly
import { buildOptimizedPromptV2 } from '@skills-fabrik/skills-cli';

const result = await buildOptimizedPromptV2({
  description: 'Test task',
  includeTemplate: true,
  includeTags: true,
});

console.log(result);
```

## Advanced Features

### Context Management

```typescript
const agent = await promptBuilderAgent.create({
  // Enable project-level settings
  settingSources: ['project'],

  // Auto-load CLAUDE.md
  loadProjectContext: true,

  // Custom context
  context: {
    projectType: 'web-application',
    technologies: ['React', 'Node.js', 'PostgreSQL'],
  },
});
```

### Session Management

```typescript
// Create agent with session
const session = await agent.createSession({
  id: 'user-session-123',
  metadata: { userId: '123' },
});

const response = await session.send({
  message: 'Create a REST API',
});
```

### Plugin System

```typescript
import { loadPlugin } from '@anthropic-ai/claude-agent-sdk';

const plugin = await loadPlugin('./my-plugin.js');

const agent = await promptBuilderAgent.create({
  plugins: [plugin],
});
```

## Summary

The Claude Agent SDK provides:
- ✅ Custom agent creation
- ✅ Tool definitions and handlers
- ✅ Permission control
- ✅ Context management
- ✅ Session support
- ✅ Plugin extensibility

Combined with Prompt Builder v2, you can create powerful agents that:
- Transform tasks into optimized prompts
- Apply Template v1.1.0 automatically
- Generate contextual TAGs
- Provide performance monitoring
- Deliver actionable recommendations

**Status**: Production Ready ✅
**SDK**: Claude Agent SDK
**Integration**: Prompt Builder v2
**Version**: 1.0.0
