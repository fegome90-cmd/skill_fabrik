# Slash Commands - Usage Examples

This document provides practical examples of using slash commands in common development workflows.

## Complete Development Workflow Example

### 1. Start a New Feature

```bash
# Generate strategic plan for user authentication
skills-cli / dev-docs "implement OAuth2 authentication with Google and GitHub"

# Expected output includes:
# - CLOOP-based phases (Clarify, Layout, Operate, Observe, Reflect)
# - Identified risks and mitigation strategies
# - Success metrics and KPIs
# - Technology recommendations
```

### 2. Materialize the Plan

```bash
# Create structured documentation files
skills-cli / create-dev-docs "oauth2-auth" --snapshot --include-context

# Creates:
# dev/active/oauth2-auth/
# ├── plan.md              # Detailed CLOOP plan
# ├── context.md           # Project context and environment
# ├── tasks.md             # Task breakdown and progress
# ├── README.md            # Quick reference and status
# └── workspace-snapshot.json  # Workspace state
```

### 3. Execute Implementation

```bash
# Work through tasks systematically
cd dev/active/oauth2-auth

# Check current status
cat tasks.md  # See current phase and tasks

# Mark progress as you work
skills-cli / dev-docs-update "oauth2-auth" --progress --finding "OAuth provider research completed"
```

### 4. Quality Assurance

```bash
# Run quality checks automatically
skills-cli / build-and-fix --fix-errors --max-errors 5

# If errors found, they're automatically fixed when possible
# Non-fixable errors get suggestions and block further progress
```

### 5. Code Review

```bash
# Perform architectural review
skills-cli / code-review --strict --focus security,performance

# Review covers:
# - Architecture patterns
# - Security vulnerabilities
# - Performance issues
# - Code quality metrics
```

## API Development Example

### Planning Phase

```bash
# Generate comprehensive API plan
skills-cli / dev-docs "create REST API for user management with CRUD operations" --template cloop

# Plan includes:
# - API design principles
# - Database schema considerations
# - Security requirements
# - Testing strategy
# - Performance considerations
```

### Implementation Phase

```bash
# Create API development structure
skills-cli / create-dev-docs "user-management-api" --snapshot

# Work through phases:
# 1. Clarify: Define API specifications
# 2. Layout: Design database schema and endpoints
# 3. Operate: Implement endpoints
# 4. Observe: Test and validate
# 5. Reflect: Review and optimize
```

### Testing Phase

```bash
# Discover routes that need testing
skills-cli / route-research-for-testing --changed-files src/api/ --coverage

# Test specific routes with authentication
skills-cli / test-route GET /api/users --auth admin
skills-cli / test-route POST /api/users --auth admin --fixture user-data.json
skills-cli / test-route PUT /api/users/123 --auth user --fixture update-data.json
```

## Bug Fix Example

### Issue Investigation

```bash
# Plan bug fix approach
skills-cli / dev-docs "fix user authentication bug in production" --verbose

# Plan includes:
# - Bug analysis approach
# - Root cause investigation steps
# - Fix implementation strategy
# - Testing and validation plan
# - Rollback considerations
```

### Fix Implementation

```bash
# Create bug fix documentation
skills-cli / create-dev-docs "auth-bug-fix" --force

# Track progress
skills-cli / dev-docs-update "auth-bug-fix" --finding "Root cause identified in session middleware"
skills-cli / dev-docs-update "auth-bug-fix" --decision "Implement additional validation in token verification"
```

### Validation

```bash
# Run comprehensive checks
skills-cli / build-and-fix --fix-errors
skills-cli / code-review --focus security

# Test affected routes
skills-cli / route-research-for-testing --changed-files src/auth/
skills-cli / test-route POST /api/auth/login --auth user --fixture login-test.json
```

## Migration Example

### Planning Database Migration

```bash
# Generate migration strategy
skills-cli / dev-docs "migrate user authentication from JWT to OAuth2" --template waterfall

# Strategy includes:
# - Migration phases and timeline
# - Data consistency considerations
# - Rollback procedures
# - Zero-downtime approach
# - Communication plan
```

### Execution

```bash
# Create migration documentation
skills-cli / create-dev-docs "auth-migration" --snapshot --include-context

# Execute migration phases
skills-cli / dev-docs-update "auth-migration" --progress --finding "Database backup completed successfully"
skills-cli / dev-docs-update "auth-migration" --decision "Proceed with phase 2: OAuth provider integration"
```

## Long-Running Project Example

### Managing Context Over Time

```bash
# Start project
skills-cli / dev-docs "implement comprehensive e-commerce platform"

# Create persistent documentation
skills-cli / create-dev-docs "ecommerce-platform" --snapshot

# Work over multiple days/weeks
# Each day, continue with context restored
skills-cli / dev-docs-update "ecommerce-platform" --progress --finding "Payment gateway integration completed"

# When conversation gets long, compact it
skills-cli / compact --save-summary --preserve-decisions

# Continue with preserved context
skills-cli / dev-docs-update "ecommerce-platform" --progress
```

### Context Management

```bash
# Check current context status
skills-cli slash stats

# View active contexts
skills-cli slash list --category dev-docs

# Clean up expired contexts
# (Automatic cleanup happens, but manual cleanup available)
```

## Team Collaboration Example

### Setting Up Team Project

```bash
# Technical lead creates initial plan
skills-cli / dev-docs "implement microservices architecture for SaaS platform" --template cloop

# Create team documentation
skills-cli / create-dev-docs "microservices-saas" --snapshot --include-context

# Share plan with team (files in dev/active/microservices-saas/)
# Team members can update progress and findings
```

### Team Progress Tracking

```bash
# Developer updates progress
skills-cli / dev-docs-update "microservices-saas" --progress --finding "User service API completed"

# Another developer adds findings
skills-cli / dev-docs-update "microservices-saas" --finding "Service discovery integration working"

# Tech lead reviews progress
skills-cli / code-review --focus architecture
```

## Advanced Usage Examples

### Custom Workflow Integration

```bash
# Custom template for security-focused development
skills-cli / dev-docs "implement secure payment processing" --template security-focused

# Integration with existing CI/CD
skills-cli / build-and-fix --fix-errors --pipeline-integration

# Custom testing profiles
skills-cli / test-route POST /api/payments --auth merchant --pci-compliance
```

### Performance Optimization

```bash
# Performance analysis plan
skills-cli / dev-docs "optimize API response times by 50%" --verbose

# Targeted performance testing
skills-cli / route-research-for-testing --focus performance --baseline ./performance-baseline.json
skills-cli / test-route GET /api/expensive-endpoint --load-test --users 1000
```

### Security Hardening

```bash
# Security audit plan
skills-cli / dev-docs "conduct security audit and hardening" --template security-focused

# Security-focused code review
skills-cli / code-review --strict --focus security --vulnerability-scan

# Security testing
skills-cli / route-research-for-testing --security-scan --owasp-top-10
skills-cli / test-route POST /api/admin --auth admin --security-tests
```

## Troubleshooting Examples

### Command Issues

```bash
# Command not found
skills-cli slash list  # Check available commands

# Get help for specific command
skills-cli / dev-docs --help

# Check registry integrity
skills-cli slash validate
```

### Context Issues

```bash
# Lost context, start fresh
skills-cli / dev-docs "task description" --new-session

# Check context status
skills-cli slash stats

# Manual cleanup if needed
# (Contexts auto-expire after 24h by default)
```

### Build Issues

```bash
# Build failing, get detailed error info
skills-cli / build-and-fix --verbose --no-fix

# Check what changed since last successful build
skills-cli / route-research-for-testing --since-last-success

# Undo problematic changes
skills-cli / undo --last-patch --dry-run
skills-cli / undo --last-patch --confirm
```

## Best Practices

### Workflow Patterns

1. **Always start with `/dev-docs`** for planning
2. **Use `/create-dev-docs`** to persist work
3. **Run `/build-and-fix`** before commits
4. **Use `/dev-docs-update`** to track progress
5. **Compact with `/compact`** when conversations get long
6. **Review with `/code-review`** before merging

### Context Management

1. **Use descriptive task names** for easy identification
2. **Enable snapshots** for important work
3. **Update progress regularly** to maintain context
4. **Use `--finding`** to record important discoveries
5. **Use `--decision`** to document key decisions

### Quality Assurance

1. **Run `/build-and-fix`** with `--fix-errors` enabled
2. **Use `/code-review`** with `--strict` for critical code
3. **Test with `/test-route`** before deployment
4. **Use `/route-research-for-testing`** after changes
5. **Review KPIs** to track quality trends

These examples demonstrate the flexibility and power of the slash commands system for managing complex development workflows with persistent context and quality automation.