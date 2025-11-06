# /dev-docs-update

[K:DOCUMENTATION-MANAGEMENT] [C:DEV-DOCS-SYSTEM] [U:DEVELOPER-WORKFLOW]

Update existing development documentation with new content, context, and status changes. Maintains synchronization between code changes and documentation.

## Usage

```bash
/dev-docs-update <doc-id> [options]
```

## Options

- `--type=<type>` - Type of update (status|content|context|complete)
- `--status=<status>` - New status (planning|in-progress|completed|blocked|cancelled)
- `--force` - Skip confirmation prompts
- `--template=<template>` - Use specific template format

## Examples

```bash
# Update task status
/dev-docs-update test --type status --status completed

# Update with new content
/dev-docs-update authentication --type content --force

# Complete update with new context
/dev-docs-update api-integration --type complete

# Quick status update
/dev-docs-update feature-x --status in-progress
```

## Implementation

This command leverages the Skills Fabric slash commands system for intelligent documentation management:

1. **Document Detection** - Finds relevant dev-doc files based on context
2. **Content Analysis** - Analyzes current documentation structure
3. **Smart Updates** - Applies changes while maintaining format consistency
4. **Context Integration** - Updates related documentation sections
5. **Validation** - Ensures documentation completeness and accuracy

## Update Types

### 📊 Status Updates
- Task progress tracking
- Milestone achievement updates
- Blocker status changes
- Completion notifications

### 📝 Content Updates
- Technical specification updates
- API documentation changes
- Implementation details
- Code example updates

### 🔄 Context Updates
- Dependency relationship changes
- Related task updates
- Cross-reference updates
- Timeline adjustments

### ✨ Complete Updates
- Comprehensive documentation refresh
- Multi-section updates
- Format standardization
- Quality validation

## Document Structure Support

### Dev-Docs Format
- Frontmatter metadata management
- Sectional content updates
- Task relationship mapping
- Progress tracking integration

### Template Integration
- Consistent formatting application
- Standard structure maintenance
- Custom template support
- Brand guideline compliance

## Safety Features

- **Backup Creation** - Automatic backup before major changes
- **Validation Checks** - Ensures documentation completeness
- **Consistency Verification** - Maintains format standards
- **Rollback Capability** - Revert changes if needed

## Output

The command provides comprehensive feedback including:
- Documents updated successfully
- Changes applied summary
- Related documentation affected
- Validation results
- Recommendations for further updates

## Command Execution

```bash
node packages/skills-cli/dist/index.js / dev-docs-update {{args}}
```

Or if installed globally:

```bash
skills-cli / dev-docs-update {{args}}
```

---

[EVIDENCIA]
- Intelligent document detection algorithms
- Multi-format template support
- Context-aware update logic
- Consistency validation framework
- Comprehensive change tracking

[PROPUESTA]
- Integrar con más sistemas de documentación
- Agregar plantillas personalizables por proyecto
- Implementar modo de actualización automática
- Crear dashboard de métricas de documentación
- Integrar con CI/CD documentation pipelines