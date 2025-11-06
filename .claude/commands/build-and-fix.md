# /build-and-fix

[K:CODE-QUALITY] [C:AUTOMATION] [U:DEVELOPER-WORKFLOW]

Automated build, lint, and fix operations for your project. Integrates with prettier, TypeScript compiler, and testing frameworks to automatically detect and fix common code issues.

## Usage

```bash
/build-and-fix [options]
```

## Options

- `--fix` - Automatically apply fixes when possible
- `--scope=<path>` - Limit operation to specific directory or file
- `--verbose` - Show detailed output and progress

## Examples

```bash
# Basic build and check
/build-and-fix

# Build with auto-fix enabled
/build-and-fix --fix

# Check specific directory
/build-and-fix --scope=./src

# Verbose output for debugging
/build-and-fix --verbose
```

## Implementation

This command uses the Skills Fabric slash commands system with full feature parity to CLI execution. It will:

1. **Analyze** your project structure and dependencies
2. **Detect** common code issues and problems
3. **Apply** automatic fixes where possible
4. **Validate** the results
5. **Provide** detailed feedback and next steps

## Features

- **Smart Detection**: Identifies TypeScript errors, ESLint issues, and formatting problems
- **Auto-Fix**: Automatically applies safe fixes for common issues
- **Scoped Analysis**: Focus on specific directories or files
- **Detailed Reporting**: Comprehensive feedback on issues found and fixes applied
- **Safe Operations**: All fixes are validated before application

## Output

The command provides detailed output including:
- Files analyzed and issues found
- Fixes applied automatically
- Remaining manual fixes required
- Recommendations for next steps
- Performance metrics

Execute this command to maintain code quality and automatically resolve common development issues.

---

## Command Execution

```bash
node packages/skills-cli/dist/index.js / build-and-fix {{args}}
```

Or if installed globally:

```bash
skills-cli / build-and-fix {{args}}
```

---

[EVIDENCIA]
- Integration con @skills-fabrik/slash-commands package
- Full feature parity con CLI execution
- MemTech L1 context persistence
- Safe operation validation
- Performance metrics tracking

[PROPUESTA]
- Extender con más formatos de fixing
- Integrar con más linters específicos
- Agregar reglas personalizables
- Implementar modo interactivo