# /code-review

[K:CODE-QUALITY] [C:SECURITY-ANALYSIS] [U:DEVELOPER-WORKFLOW]

Comprehensive code quality analysis and review. Performs automated security analysis, quality checks, and best practices validation across your codebase.

## Usage

```bash
/code-review [options]
```

## Options

- `--strict` - Apply stricter quality standards
- `--scope=<path>` - Limit review to specific directory or file
- `--format=<type>` - Output format (text|json|markdown)

## Examples

```bash
# Standard code review
/code-review

# Strict review for production code
/code-review --strict

# Review specific component
/code-review --scope=./src/components/UserProfile.tsx

# JSON output for automation
/code-review --format=json
```

## Implementation

This command leverages the Skills Fabric slash commands system to provide comprehensive code analysis:

1. **Security Analysis** - Detects common vulnerabilities and security patterns
2. **Quality Assessment** - Evaluates code maintainability and best practices
3. **Performance Review** - Identifies potential performance bottlenecks
4. **Standards Compliance** - Checks adherence to coding standards
5. **Documentation Validation** - Ensures proper documentation coverage

## Review Categories

### 🔒 Security Analysis
- Input validation and sanitization
- Authentication and authorization patterns
- Data exposure risks
- Common vulnerability patterns (OWASP Top 10)

### 📊 Quality Metrics
- Code complexity and maintainability
- Test coverage analysis
- Error handling patterns
- Code duplication detection

### ⚡ Performance Review
- Algorithmic efficiency
- Memory usage patterns
- Database query optimization
- Async/await best practices

### 📋 Standards Compliance
- TypeScript usage patterns
- ESLint rule adherence
- Project-specific conventions
- Industry best practices

## Output Format

The command provides structured output including:
- Overall quality score (0-10)
- Category-specific scores
- Detailed findings with severity levels
- Actionable recommendations
- Line-by-line issues when applicable

## Command Execution

```bash
node packages/skills-cli/dist/index.js / code-review {{args}}
```

Or if installed globally:

```bash
skills-cli / code-review {{args}}
```

---

[EVIDENCIA]
- Integration with security analysis patterns
- Multi-dimensional quality assessment
- Industry standard compliance checking
- Performance bottleneck detection
- Structured reporting with actionable insights

[PROPUESTA]
- Integrar con más herramientas de análisis estático
- Agregar reglas personalizables por proyecto
- Implementar modo de revisión incremental
- Crear dashboard de métricas de calidad
- Integrar con CI/CD pipelines