# /undo

[K:OPERATION-SAFETY] [C:CHANGE-MANAGEMENT] [U:DEVELOPER-WORKFLOW]

Safely rollback recent changes and operations. Provides intelligent undo functionality with validation and safety checks.

## Usage

```bash
/undo [options] [target]
```

## Options

- `--last` - Undo the most recent operation
- `--all` - Undo all recent changes in current session
- `--scope=<path>` - Limit undo to specific directory or file
- `--confirm` - Show changes before applying undo
- `--force` - Skip safety validations

## Examples

```bash
# Undo last operation
/undo --last

# Undo all recent changes
/undo --all

# Preview changes before undo
/undo --confirm

# Undo changes in specific directory
/undo --scope=./src/components
```

## Implementation

This command uses the Skills Fabric slash commands system for safe change management:

1. **Change Detection** - Identifies recent modifications and operations
2. **Safety Validation** - Ensures undo operations won't break functionality
3. **Smart Rollback** - Applies changes in reverse order of execution
4. **Dependency Analysis** - Checks for impacted files and operations
5. **State Restoration** - Returns workspace to previous stable state

## Undo Operations

### 🔄 Operation Rollback
- Build operation reversals
- File modification restoration
- Configuration reversion
- Dependency changes rollback

### 📁 File System Changes
- Created file removal
- Modified file restoration
- Deleted file recovery
- Directory structure restoration

### 🔧 Configuration Updates
- Build configuration reversion
- Dependency package rollback
- Environment variable restoration
- Tool configuration reset

### 🗂️ Workspace State
- Working directory cleanup
- Cache state restoration
- Build artifact management
- Development environment reset

## Safety Features

- **Change Validation** - Ensures undo operations are safe
- **Dependency Checking** - Validates impacted files and operations
- **Backup Protection** - Maintains restore points
- **Confirmation Prompts** - Requires approval for major changes

## Output

The command provides detailed feedback including:
- Operations to be undone
- Files that will be affected
- Safety validation results
- Applied changes summary
- Recommendations for further actions

## Command Execution

```bash
node packages/skills-cli/dist/index.js / undo {{args}}
```

Or if installed globally:

```bash
skills-cli / undo {{args}}
```

---

[EVIDENCIA]
- Intelligent change detection algorithms
- Multi-layer safety validation framework
- Dependency impact analysis
- Comprehensive rollback capabilities
- State restoration validation

[PROPUESTA]
- Integrar con más sistemas de control de versiones
- Agregar modos de undo personalizados
- Implementar undo programado con temporizador
- Crear dashboard de historial de operaciones
- Integrar con sistemas de backup externos