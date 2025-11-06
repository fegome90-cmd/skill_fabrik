# /compact

[K:WORKSPACE-OPTIMIZATION] [C:CLEANUP-AUTOMATION] [U:DEVELOPER-WORKFLOW]

Optimize workspace by cleaning cache, removing artifacts, and organizing project structure. Improves performance and frees up disk space.

## Usage

```bash
/compact [options]
```

## Options

- `--verbose` - Show detailed cleanup process
- `--dry-run` - Show what would be cleaned without executing
- `--cache-only` - Only clean cache files
- `--force` - Skip confirmation prompts

## Examples

```bash
# Standard workspace optimization
/compact

# Show detailed cleanup process
/compact --verbose

# Preview what would be cleaned
/compact --dry-run

# Clean only cache files
/compact --cache-only
```

## Implementation

This command uses the Skills Fabric slash commands system to perform intelligent workspace optimization:

1. **Cache Cleaning** - Removes build artifacts, node_modules cache, and temporary files
2. **Dependency Optimization** - Identifies unused dependencies and large packages
3. **File Organization** - Suggests improvements to project structure
4. **Space Analysis** - Provides detailed disk usage breakdown
5. **Performance Metrics** - Reports optimization impact

## Cleanup Categories

### 🗂️ Cache Files
- Build artifacts and compilation outputs
- Node modules cache and package locks
- IDE and editor temporary files
- Browser development cache

### 📦 Dependency Management
- Unused package detection
- Large package analysis
- Duplicate dependency identification
- Outdated package suggestions

### 📁 File Organization
- Temporary and backup file cleanup
- Log file rotation and management
- Development artifact organization
- Project structure optimization

### 🚀 Performance Enhancement
- Startup time optimization
- Memory usage improvement
- Build time reduction
- IDE performance boost

## Safety Features

- **Selective Cleaning** - Only removes safe-to-delete files
- **Backup Creation** - Creates restore points before major changes
- **Confirmation Prompts** - Requires approval for destructive operations
- **Rollback Capability** - Can undo changes if needed

## Output

The command provides comprehensive reporting including:
- Files and directories cleaned
- Disk space recovered
- Performance improvements achieved
- Recommendations for further optimization
- Before/after workspace metrics

## Command Execution

```bash
node packages/skills-cli/dist/index.js / compact {{args}}
```

Or if installed globally:

```bash
skills-cli / compact {{args}}
```

---

[EVIDENCIA]
- Intelligent cache detection algorithms
- Safe deletion with validation checks
- Performance impact measurement
- Detailed disk usage analysis
- Workspace organization suggestions

[PROPUESTA]
- Integrar con más herramientas de optimización
- Agregar perfiles de limpieza personalizables
- Implementar modo de optimización programada
- Crear dashboard de métricas de workspace
- Integrar con CI/CD cleanup pipelines