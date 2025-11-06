# Slash Commands System

A powerful slash command system for Skills Fabric that provides persistent context, Dev-Docs management, and quality automation beyond the limitations of chat windows.

## Overview

The slash commands system enables:
- **Persistent Context**: Store and retrieve context beyond chat window limits using MemTech L1
- **Dev-Docs Management**: Generate strategic plans and materialize structured documentation
- **Quality Automation**: Zero-errors-left-behind enforcement with build/test automation
- **Plan-Persist-Execute-Audit**: Formalized workflow with comprehensive tracking

## Quick Start

### Installation

The slash commands system is included in the Skills Fabric monorepo. Build it with:

```bash
pnpm build
```

### Basic Usage

```bash
# Generate strategic guidance for a task
skills-cli / dev-docs "implement user authentication system"

# Materialize the plan into structured files
skills-cli / create-dev-docs "user-auth" --snapshot

# Execute quality checks
skills-cli / build-and-fix --fix-errors

# Get help for any command
skills-cli / dev-docs --help
```

## Available Commands

### 📋 Dev-Docs Commands

#### `/dev-docs` - Generate Strategic Guidance
Creates CLOOP-based strategic plans without writing files.

```bash
skills-cli / dev-docs "implement user authentication" --template cloop --verbose
```

**Options:**
- `--template <template>`: Plan template (cloop, agile, waterfall, custom)
- `--verbose`: Include detailed analysis
- `--context <file>`: Load context from file

**Examples:**
```bash
/dev-docs "create REST API with OAuth2" --template cloop
/dev-docs "migrate database schema" --verbose
/dev-docs "implement real-time notifications" --context ./project-context.json
```

#### `/create-dev-docs` - Materialize Structured Documentation
Creates `dev/active/<task>/` structure with comprehensive documentation.

```bash
skills-cli / create-dev-docs "user-auth" --plan-from-context --snapshot --force
```

**Files Created:**
- `plan.md` - Detailed project plan with phases and tasks
- `context.md` - Project context and environment information
- `tasks.md` - Task breakdown and progress tracking
- `README.md` - Quick reference and status overview
- `workspace-snapshot.json` - Workspace state (if --snapshot)

**Options:**
- `--plan <source>`: Plan source (file, JSON, or context)
- `--force`: Overwrite existing directory
- `--snapshot`: Create MemTech L1 snapshot
- `--include-context`: Include detailed context information

#### `/dev-docs-update` - Track Progress and Findings
Update existing dev docs with progress, findings, and conversation compaction.

```bash
skills-cli / dev-docs-update "user-auth" --progress --finding "Database connection optimized"
```

**Options:**
- `--progress`: Mark task progress
- `--finding <text>`: Add a new finding
- `--decision <text>`: Record a decision
- `--compact`: Compact conversation history
- `--save`: Save updates to context

### 🔧 Quality Commands

#### `/build-and-fix` - Zero-Errors-Left-Behind Enforcement
Execute prettier, TypeScript compilation, and tests with automatic fixing.

```bash
skills-cli / build-and-fix --fix-errors --max-errors 5 --verbose
```

**Pipeline:**
1. Prettier formatting
2. TypeScript compilation (`tsc --noEmit`)
3. Test execution
4. Error analysis and suggestions
5. Auto-fix (if enabled)

**Options:**
- `--fix-errors`: Automatically fix fixable errors
- `--max-errors <n>`: Maximum errors before blocking
- `--no-fix`: Run checks only, no fixing
- `--prettier-only`: Run only prettier formatting

#### `/code-review` - Architectural Quality Review
Perform comprehensive code review with guardrails and quality suggestions.

```bash
skills-cli / code-review --strict --focus security,performance --format json
```

**Review Areas:**
- Architecture patterns
- Security vulnerabilities
- Performance issues
- Code quality metrics
- Guardrails compliance

**Options:**
- `--strict`: Apply stricter review criteria
- `--focus <areas>`: Focus on specific areas (comma-separated)
- `--format <format>`: Output format (text, json, markdown)
- `--output <file>`: Save review to file

### 🧪 Testing Commands

#### `/route-research-for-testing` - Test Discovery
Discover affected routes and generate relevant test recommendations.

```bash
skills-cli / route-research-for-testing --changed-files src/api/ --coverage --format json
```

**Analysis:**
- Route impact analysis based on file changes
- Test coverage gaps identification
- Integration test recommendations
- Performance test suggestions

**Options:**
- `--changed-files <path>`: Analyze specific file changes
- `--coverage`: Include coverage analysis
- `--include-integration`: Include integration test recommendations
- `--format <format>`: Output format (text, json)

#### `/test-route` - Route Testing
Test specific routes with authentication profiles and comprehensive validation.

```bash
skills-cli / test-route POST /api/auth/login --auth admin --fixture login-data.json --verbose
```

**Test Types:**
- Authentication and authorization
- Request/response validation
- Error handling
- Performance benchmarks
- Security checks

**Options:**
- `--auth <profile>`: Authentication profile to use
- `--fixture <file>`: Test data fixture file
- `--method <method>`: HTTP method (if not first argument)
- `--verbose`: Detailed test output

### 🔧 Utility Commands

#### `/compact` - Context Compaction
Summarize conversation history and restart with high-fidelity context preservation.

```bash
skills-cli / compact --save-summary --max-items 50 --format markdown
```

**Features:**
- Intelligent conversation summarization
- Critical detail preservation
- Context continuity maintenance
- Memory usage optimization

**Options:**
- `--save-summary`: Save summary to file
- `--max-items <n>`: Maximum items to preserve
- `--format <format>`: Summary format (text, markdown)
- `--preserve-decisions`: Prioritize preserving decisions

#### `/undo` - Safe Patch Reversion
Revert last patch at local patch set level with safety validation.

```bash
skills-cli / undo --last-patch --confirm --dry-run
```

**Safety Features:**
- Git status validation
- Uncommitted changes detection
- Backup creation before revert
- Confirmation prompts

**Options:**
- `--last-patch`: Revert only the last patch
- `--confirm`: Show confirmation prompt
- `--dry-run`: Show what would be reverted
- `--backup <path>`: Create backup at specified path

#### `/plugin` - Plugin Management
Register and manage plugins/skill packs in the local marketplace.

```bash
skills-cli / plugin list
skills-cli / plugin install @skills-fabrik/security-pack
skills-cli / plugin search testing
```

**Plugin Operations:**
- List installed plugins
- Install new plugins
- Search for plugins
- Remove plugins
- Update plugins

**Subcommands:**
- `list`: Show installed plugins
- `install <package>`: Install a plugin package
- `remove <package>`: Remove an installed plugin
- `search <query>`: Search for available plugins
- `update [package]`: Update plugins

## Integration with Existing Systems

### Editor Integration
Slash commands are automatically detected in editor pre-invoke hooks:

```
⚡ SLASH COMMAND DETECTED: /dev-docs

This slash command will be processed by the slash commands system.

Available slash commands: /dev-docs, /create-dev-docs, /dev-docs-update, /build-and-fix, /code-review, /route-research-for-testing, /test-route, /compact, /undo, /plugin

Use "skills-cli / <command>" to execute, or add "--help" for usage
```

### MemTech Integration
Commands automatically persist context to MemTech L1 for long-running sessions:

- **Session Context**: Maintain state across command executions
- **Workspace Snapshots**: Capture and restore workspace state
- **Conversation History**: Preserve important context beyond chat limits
- **Auto-Compaction**: Manage memory usage intelligently

### CLOOP Methodology Integration
Slash commands follow CLOOP phases automatically:

1. **Clarify**: Command validation and requirement analysis
2. **Layout**: Plan generation and resource preparation
3. **Operate**: Command execution with progress tracking
4. **Observe**: Result analysis and metric collection
5. **Reflect**: Context updates and lesson capture

## Configuration

### Registry Configuration
Slash commands are registered in `configs/slash-commands.json`:

```json
{
  "version": "1.0.0",
  "commands": {
    "dev-docs": {
      "name": "dev-docs",
      "description": "Generate strategic CLOOP-based guidance",
      "category": "dev-docs",
      "handler": "dev-docs.ts",
      "requiresAuth": false,
      "persistenceLevel": "session"
    }
  }
}
```

### Environment Variables
```bash
# Slash Commands Configuration
SLASH_COMMANDS_REGISTRY_PATH=./configs/slash-commands.json
SLASH_COMMANDS_MEMTECH_PATH=./.sf/cache/slash-contexts
SLASH_COMMANDS_LOG_LEVEL=info
```

## Advanced Usage

### Command Chaining
```bash
# Complete development workflow
skills-cli / dev-docs "implement OAuth2"
skills-cli / create-dev-docs "oauth-integration" --snapshot
skills-cli / build-and-fix --fix-errors
skills-cli / code-review --strict
```

### Context Persistence
```bash
# Start work session
skills-cli / dev-docs "user authentication" --save-session

# Continue later (context automatically restored)
skills-cli / dev-docs-update "user-auth" --progress
```

### Custom Templates
Create custom plan templates in `templates/slash-commands/`:

```markdown
# custom-template.md
## Objectives
{{objectives}}

## Phases
{{phases}}

## Timeline
{{timeline}}
```

## Troubleshooting

### Common Issues

**Command not found:**
```bash
skills-cli slash list  # Check available commands
```

**Context not found:**
```bash
skills-cli / dev-docs "task name"  # Create new context
```

**Permission denied:**
```bash
# Check command requires authentication
skills-cli slash stats  # Show command details
```

### Debug Mode
Enable verbose logging for troubleshooting:

```bash
SLASH_COMMANDS_LOG_LEVEL=debug skills-cli / dev-docs "test" --verbose
```

## API Reference

### Programmatic Usage

```typescript
import { SlashCommandParser, SlashCommandRegistryManager } from '@skills-fabrik/slash-commands';

// Parse command
const parsed = SlashCommandParser.parse('/dev-docs user auth');

// Get command registry
const registry = SlashCommandRegistryManager.getInstance();
const command = registry.getCommand('dev-docs');

// Execute command
const handler = new DevDocsHandler(command);
const result = await handler.execute(parsed);
```

### Extending the System

Create custom handlers by extending `SlashCommandHandler`:

```typescript
export class CustomHandler extends SlashCommandHandler {
  protected async handle(parsedCommand, context) {
    // Custom implementation
    return this.createSuccessResult('Custom command executed');
  }
}
```

## Contributing

When adding new slash commands:

1. Create handler class extending `SlashCommandHandler`
2. Add command to `configs/slash-commands.json`
3. Implement comprehensive tests
4. Update documentation
5. Follow CLOOP methodology in implementation

## License

Part of Skills Fabric - see project license for details.