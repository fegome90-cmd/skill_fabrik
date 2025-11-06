# 🔧 Slash Commands User Manual

**Version**: 1.2.0
**Last Updated**: 2025-11-01
**Target Audience**: Claude Code Users and Developers

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Command Categories](#command-categories)
4. [Command Reference](#command-reference)
5. [Advanced Usage](#advanced-usage)
6. [KPI and Analytics](#kpi-and-analytics)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## 🚀 Introduction

### What are Slash Commands?

Slash Commands are a powerful, modular command system integrated into Claude Code that provide instant access to common development workflows, quality assurance tools, and analytics. Think of them as your personal development assistant, always ready to help with just a single command.

### Key Benefits

- **⚡ Instant Execution**: Most commands complete in under 100ms
- **🎯 Precision Tools**: Each command serves a specific development need
- **📊 Built-in Analytics**: Track your productivity and system performance
- **🔒 Safe Operations**: All commands include validation and safety checks
- **📝 Rich Feedback**: Detailed output with actionable insights

### Getting Started

All slash commands start with `/` and can be used directly in your Claude Code conversations. The system automatically detects and processes slash commands, providing immediate feedback and results.

---

## ⚡ Quick Start

### Your First Commands

Try these essential commands to get started:

```bash
# Check system health and get an overview
/kpi-advanced

# Fix and optimize your code
/build-and-fix --fix

# Review your code quality
/code-review

# Clean up your workspace
/compact
```

### Basic Command Structure

```
/command [arguments] [--flags] [--option=value]
```

- **`/command`**: The command name (required)
- **`[arguments]`**: Positional parameters for the command
- **`[--flags]`**: Boolean switches that modify behavior
- **`[--option=value]`**: Named parameters with values

### Getting Help

Each command supports help flags:

```bash
/command --help          # Show command help
/command --examples      # Show usage examples
```

---

## 📂 Command Categories

### 🔧 Foundation Layer
Essential commands for daily development workflow.

### 📝 Documentation Layer
Commands for managing project documentation.

### 🧪 Testing Layer
Advanced testing and validation tools.

### 📊 Analytics Layer
Performance monitoring and insights.

---

## 📖 Command Reference

## 🔧 Foundation Layer Commands

### `/build-and-fix`
Automated build, lint, and fix operations for your codebase.

**Purpose**: Build, validate, and automatically fix common code issues
**Performance**: ~120ms execution time
**Category**: Quality

#### Syntax
```bash
/build-and-fix [--fix] [--scope=<path>] [--verbose]
```

#### Options
- `--fix`: Automatically apply fixes when possible
- `--scope=<path>`: Limit operation to specific directory or file
- `--verbose`: Show detailed output and progress

#### Examples
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

#### Output
```
🔧 Build and Fix Analysis
=========================
📦 Scanning: ./src (45 files)
🔍 Issues Found: 3
⚡ Auto-fixing: 2 issues
✅ Fixes Applied:
  - Fixed trailing whitespace in 2 files
  - Added missing semicolon in component.ts
⚠️ Manual Fix Required: 1 issue
  - Import order in utils.js (line 15)
📊 Summary: 2 auto-fixed, 1 manual fix needed
```

---

### `/code-review`
Comprehensive code quality analysis and review.

**Purpose**: Analyze code quality, security, and best practices
**Performance**: ~85ms execution time
**Category**: Quality

#### Syntax
```bash
/code-review [--strict] [--scope=<path>] [--format=<type>]
```

#### Options
- `--strict`: Apply stricter quality standards
- `--scope=<path>`: Limit review to specific directory
- `--format=<type>`: Output format (text|json|markdown)

#### Examples
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

#### Output
```
📊 Code Review Results
=====================
📁 Analyzed: ./src (42 files)
⭐ Overall Score: 8.7/10

🎯 Quality Breakdown:
   ✅ Security: 9.5/10 - No critical vulnerabilities
   ✅ Performance: 8.2/10 - Good optimization
   ⚠️ Maintainability: 8.5/10 - Some complex functions
   ✅ Best Practices: 9.0/10 - Follows conventions

📝 Key Findings:
   ✅ Excellent error handling patterns
   ⚠️ Consider simplifying complex regex in parser.ts:142
   ✅ Good use of TypeScript types
   ⚠️ Some functions could benefit from memoization

💡 Recommendations:
   - Break down complex validation logic
   - Add JSDoc comments for utility functions
   - Consider implementing lazy loading for heavy modules
```

---

### `/compact`
Workspace cleanup and optimization.

**Purpose**: Clean temporary files, optimize cache, and organize workspace
**Performance**: ~45ms execution time
**Category**: Utilities

#### Syntax
```bash
/compact [--dry-run] [--aggressive] [--preserve=<pattern>]
```

#### Options
- `--dry-run`: Show what would be deleted without actually deleting
- `--aggressive`: More thorough cleanup (includes more file types)
- `--preserve=<pattern>`: Pattern of files/directories to preserve

#### Examples
```bash
# Safe cleanup (dry run first)
/compact --dry-run

# Standard cleanup
/compact

# Aggressive cleanup
/compact --aggressive

# Preserve node_modules while cleaning
/compact --preserve=node_modules
```

#### Output
```
🧹 Workspace Cleanup
===================
📊 Space Analysis:
   🗂️  Temporary files: 15.2 MB
   🗂️  Cache files: 8.7 MB
   🗂️  Build artifacts: 23.1 MB
   🗂️  Log files: 2.3 MB
   📊 Total cleanup potential: 49.3 MB

🗑️  Files to Remove:
   ✅ ./dist/* (12.3 MB)
   ✅ ./.cache/* (8.7 MB)
   ✅ ./logs/*.log (2.3 MB)
   ✅ ./temp/* (15.2 MB)
   ✅ ./coverage/* (10.8 MB)

⚡ Optimization:
   🔄 Reorganizing imports...
   ✅ Optimized 8 imports
   🔄 Cleaning cache...
   ✅ Cleared 23 cache entries
   🔄 Updating registry...
   ✅ Registry optimized

📈 Results:
   💾 Space freed: 49.3 MB
   ⚡ Performance improvement: +12%
   ✅ Workspace optimized successfully
```

---

### `/undo`
Safe workspace rollback and change management.

**Purpose**: Revert changes and manage workspace state
**Performance**: ~35ms execution time
**Category**: Utilities

#### Syntax
```bash
/undo [--confirm] [--steps=<number>] [--scope=<path>]
```

#### Options
- `--confirm`: Require confirmation before applying changes
- `--steps=<number>`: Number of changes to undo (default: 1)
- `--scope=<path>`: Limit undo operation to specific path

#### Examples
```bash
# Undo last change
/undo

# Undo last 3 changes
/undo --steps=3

# Undo with confirmation
/undo --confirm

# Undo changes in specific directory
/undo --scope=./src/components
```

#### Output
```
↩️  Undo Operation
================
📋 Changes to Revert: 3

🔍 Change Analysis:
   1. Modified: ./src/components/UserForm.tsx (+15 lines, -3 lines)
      📝 Added validation logic
      🗑️  Removed unused imports

   2. Created: ./src/utils/validation.ts (+42 lines)
      📝 New validation utilities
      ✅ Well-structured functions

   3. Modified: package.json (+1 line)
      📝 Added new dependency: zod@3.22.0

⚠️  Impact Assessment:
   🔄 Dependent files: 2 components use UserForm
   🔗 Import relationships: 3 files import validation
   ⚡ Performance impact: Minimal

🎯 Rollback Plan:
   🗑️  Remove ./src/utils/validation.ts
   📝 Restore ./src/components/UserForm.tsx to previous state
   📝 Restore package.json to previous state

✅ Changes reverted successfully
📊 Workspace restored to previous state
```

---

## 📝 Intermediate Layer Commands

### `/dev-docs-update`
Dynamic documentation management and updates.

**Purpose**: Update and manage project documentation automatically
**Performance**: ~95ms execution time
**Category**: Documentation

#### Syntax
```bash
/dev-docs-update [--type=<type>] [--scope=<path>] [--format=<output>]
```

#### Options
- `--type=<type>`: Type of update (progress|api|readme|changelog)
- `--scope=<path>`: Specific component or module to document
- `--format=<output>`: Output format (markdown|html|pdf)

#### Examples
```bash
# Update all documentation
/dev-docs-update

# Update progress documentation
/dev-docs-update --type=progress

# Document specific component
/dev-docs-update --scope=./src/components/UserProfile --type=api

# Generate HTML documentation
/dev-docs-update --format=html
```

#### Output
```
📚 Documentation Update
======================
📊 Documentation Status:
   📝 API docs: 87% complete
   📖 README: Updated 2 hours ago
   📋 Progress: On track
   📑 Changelog: 5 entries behind

🔄 Update Types:
   ✅ API Documentation: Updated 12 function signatures
   ✅ Component Docs: Added 3 new component examples
   ✅ Progress Tracking: Updated sprint progress
   ⚠️ README: Minor updates needed

📄 Files Updated:
   ✅ ./docs/api/components.md
   ✅ ./docs/progress/sprint-12.md
   ✅ ./README.md (minor updates)
   ✅ ./CHANGELOG.md (added 3 entries)

💡 Suggestions:
   - Update installation guide with new dependencies
   - Add troubleshooting section to README
   - Document new validation utilities
```

---

## 🧪 Advanced Layer Commands

### `/route-research-for-testing`
Route analysis and test discovery for web applications.

**Purpose**: Analyze API routes and identify testing gaps
**Performance**: ~180ms execution time
**Category**: Testing

#### Syntax
```bash
/route-research-for-testing <path> [--depth=<number>] [--format=<type>]
```

#### Options
- `--depth=<number>`: Analysis depth level (default: 3)
- `--format=<type>`: Output format (table|json|markdown)

#### Examples
```bash
# Analyze routes in src directory
/route-research-for-testing ./src

# Deep analysis
/route-research-for-testing ./src --depth=5

# JSON output for automation
/route-research-for-testing ./src --format=json
```

#### Output
```
🔍 Route Research for Testing
============================
📁 Analyzed: ./src/routes (23 routes)
⏱️  Analysis time: 180ms

📊 Route Coverage Analysis:
   ✅ Fully Tested: 15 routes (65%)
   ⚠️ Partially Tested: 5 routes (22%)
   🚨 Not Tested: 3 routes (13%)

🔍 Route Categories:
   📝 CRUD Operations: 12 routes
   🔐 Authentication: 3 routes
   📊 Analytics: 4 routes
   🔧 Admin: 4 routes

📋 Testing Gaps Identified:
   🚨 /api/admin/delete-user - No tests found
   🚨 /api/analytics/export - No tests found
   🚨 /api/auth/refresh-token - Edge case tests missing

💡 Test Suggestions:
   - Add integration tests for admin operations
   - Test analytics export with large datasets
   - Verify token refresh with expired tokens
   - Add performance tests for analytics endpoints

📈 Complexity Analysis:
   🟢 Simple routes: 8 (1-2 parameters)
   🟡 Medium routes: 10 (3-5 parameters)
   🔴 Complex routes: 5 (6+ parameters, nested logic)
```

---

### `/test-route`
Automated route testing and validation.

**Purpose**: Execute comprehensive tests on API routes
**Performance**: ~200ms execution time
**Category**: Testing

#### Syntax
```bash
/test-route <route> [--method=<method>] [--data=<file>] [--performance]
```

#### Options
- `--method=<method>`: HTTP method to test (GET|POST|PUT|DELETE)
- `--data=<file>`: JSON file with test data
- `--performance`: Include performance benchmarks

#### Examples
```bash
# Test GET route
/test-route /api/users

# Test POST with data
/test-route /api/users --method=POST --data=test-user.json

# Performance testing
/test-route /api/analytics --performance
```

#### Output
```
🧪 Route Testing Results
========================
🎯 Target: GET /api/users
⏱️  Execution time: 200ms

📊 Test Results Summary:
   ✅ Passed: 8/10 tests (80%)
   ❌ Failed: 2/10 tests (20%)
   ⚠️ Warnings: 1 test

🔍 Test Cases:
   ✅ Valid request - 200 OK (45ms)
   ✅ Empty query params - 200 OK (38ms)
   ✅ Pagination - 200 OK (52ms)
   ✅ Filtering - 200 OK (41ms)
   ✅ Sorting - 200 OK (39ms)
   ❌ Invalid filter - 400 Expected, got 500 (67ms)
   ❌ Large page size - 400 Expected, got 200 (89ms)
   ✅ Authenticated request - 200 OK (48ms)
   ✅ Unauthorized - 401 OK (35ms)
   ⚠️ Slow query warning - 1200ms (performance issue)

🚨 Issues Found:
   1. Error handling: Server returns 500 instead of 400 for invalid filters
   2. Validation: Large page sizes not properly validated
   3. Performance: Query with joins taking >1s

💡 Recommendations:
   - Add input validation middleware
   - Implement query parameter validation
   - Optimize database queries with proper indexing
   - Add query caching for frequently accessed data
```

---

### `/plugin`
Package management and plugin installation.

**Purpose**: Install, update, and manage project plugins and dependencies
**Performance**: ~150ms execution time
**Category**: Utilities

#### Syntax
```bash
/plugin <action> <package> [--version=<version>] [--dev] [--force]
```

#### Options
- `--version=<version>`: Specific version to install
- `--dev`: Install as development dependency
- `--force`: Force reinstall even if already installed

#### Examples
```bash
# Install a plugin
/plugin install eslint

# Install specific version
/plugin install @types/node --version=20.0.0

# Install dev dependency
/plugin install jest --dev

# Update plugin
/plugin update eslint

# Remove plugin
/plugin remove lodash

# List installed plugins
/plugin list
```

#### Output
```
🔌 Plugin Management
==================
📦 Action: install eslint
🎯 Target: development dependencies

📋 Package Analysis:
   📦 eslint: v8.45.0 (latest: v8.57.0)
   📊 Size: 2.3 MB (unpacked)
   📝 Dependencies: 15 direct, 45 total
   🔍 Security: No known vulnerabilities

🔄 Installation Process:
   📥 Downloading eslint@8.57.0...
   ✅ Download complete (2.3 MB)
   📦 Extracting package...
   ✅ Extraction complete
   🔗 Resolving dependencies...
   ✅ All dependencies resolved
   📝 Updating package.json...
   ✅ package.json updated

📊 Installation Summary:
   ✅ eslint@8.57.0 installed successfully
   📦 45 dependencies added
   📄 package.json updated
   🔒 Security scan passed

💡 Next Steps:
   - Configure eslint in .eslintrc.js
   - Add eslint scripts to package.json
   - Run eslint on your codebase
   - Consider adding eslint plugins for your framework
```

---

## 📊 Analytics Layer Commands

### `/kpi-advanced`
Advanced analytics, reporting, and performance monitoring.

**Purpose**: Generate comprehensive reports and analyze system performance
**Performance**: ~95ms execution time
**Category**: Utilities

#### Syntax
```bash
/kpi-advanced [--format=<type>] [--report=<type>] [--export=<path>]
```

#### Options
- `--format=<type>`: Output format (markdown|json|dashboard)
- `--report=<type>`: Report type (summary|detailed|performance|usage|errors)
- `--export=<path>`: Export report to file

#### Examples
```bash
# Standard dashboard
/kpi-advanced

# Detailed performance report
/kpi-advanced --report=performance --detailed

# JSON export for automation
/kpi-advanced --format=json --export=./reports/kpi-report.json

# Error analysis
/kpi-advanced --report=errors --detailed
```

#### Output
```
🎯 Slash Commands KPI Dashboard
===============================

**Generated**: 2025-11-01T10:30:00.000Z
**Time Range**: Last 7 days

## 🎯 Executive Summary

- **Total Commands**: 156
- **Success Rate**: 98.7% ✅
- **Average Execution Time**: 109.00ms
- **Error Rate**: 1.3%
- **Active Integrations**: 1

## ⚡ Command Performance

| Command | Usage | Success Rate | Avg Time | Status |
|---------|-------|--------------|----------|--------|
| /build-and-fix | 45 (28.8%) | 100.0% | 120ms | ✅ |
| /code-review | 32 (20.5%) | 96.9% | 85ms | ✅ |
| /compact | 28 (17.9%) | 100.0% | 45ms | ✅ |
| /kpi-advanced | 25 (16.0%) | 100.0% | 95ms | ✅ |
| /plugin | 15 (9.6%) | 93.3% | 150ms | 🟡 |
| /undo | 8 (5.1%) | 100.0% | 35ms | ✅ |
| /dev-docs-update | 3 (1.9%) | 100.0% | 95ms | ✅ |

## 📈 Performance Metrics

- **Fastest Command**: /undo (35ms)
- **Slowest Command**: /test-route (200ms)
- **P95 Execution Time**: 180ms
- **P99 Execution Time**: 200ms

## 🕐 Usage Patterns

- **Peak Hour**: 14:00
- **Peak Day**: Monday
- **Most Active Workspaces**:
  - **main**: 89 commands
  - **feature-auth**: 45 commands
  - **bug-fixes**: 22 commands

## 🚨 Error Analysis

- **execution**: 1 occurrence (0.6%)
- **validation**: 1 occurrence (0.6%)

## 💡 Insights & Recommendations

✅ **Excellent Performance**: Success rate is above 95%
⚡ **Excellent Speed**: Average execution time is under 100ms

- **Most Used**: /build-and-fix (45 times)
- **Recommendation**: All metrics within acceptable ranges
```

---

## 🎛️ Advanced Usage

### Command Chaining

Some commands can be combined for powerful workflows:

```bash
# Complete code quality workflow
/build-and-fix --fix
/code-review --strict
/compact
```

### Conditional Execution

Use flags to modify behavior based on conditions:

```bash
# Only fix if issues are found
/build-and-fix --fix --auto

# Strict review for production branches
/code-review --strict --scope=./src/production
```

### Batch Operations

Process multiple targets efficiently:

```bash
# Analyze multiple components
/route-research-for-testing ./src/components ./src/utils
/test-route /api/users --performance
```

### Integration with External Tools

```bash
# Export KPI data for external analysis
/kpi-advanced --format=json --export=./analytics/kpi-data.json

# Generate documentation for CI/CD
/dev-docs-update --format=html --export=./docs/build/
```

---

## 📊 KPI and Analytics

### Real-time Monitoring

The system tracks all command executions automatically:

- **Execution Time**: How long each command takes
- **Success Rate**: Percentage of successful executions
- **Usage Patterns**: When and how commands are used
- **Error Tracking**: Types and frequency of errors

### Performance Benchmarks

| Command | Fastest | Average | P95 | P99 |
|---------|---------|---------|-----|-----|
| /undo | 25ms | 35ms | 45ms | 55ms |
| /compact | 35ms | 45ms | 65ms | 85ms |
| /kpi-advanced | 75ms | 95ms | 120ms | 150ms |
| /code-review | 65ms | 85ms | 110ms | 140ms |
| /build-and-fix | 95ms | 120ms | 180ms | 250ms |
| /plugin | 120ms | 150ms | 220ms | 300ms |
| /dev-docs-update | 70ms | 95ms | 130ms | 180ms |
| /test-route | 150ms | 200ms | 300ms | 450ms |

### Custom Analytics

Generate custom reports based on your needs:

```bash
# Performance-focused report
/kpi-advanced --report=performance --detailed

# Usage analysis
/kpi-advanced --report=usage --start=2025-10-01 --end=2025-10-31

# Error analysis
/kpi-advanced --report=errors --export=./errors-analysis.md
```

---

## 🔧 Troubleshooting

### Common Issues

#### Command Not Found
```
❌ Error: Command '/invalid-command' not found
```

**Solution**: Check available commands with `/kpi-advanced` or use `/command --help`

#### Permission Denied
```
❌ Error: Insufficient permissions for this operation
```

**Solution**: Check if command requires authentication or different user privileges

#### Execution Timeout
```
❌ Error: Command execution timed out after 30 seconds
```

**Solution**: Command may be processing large datasets, try with smaller scope

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid command syntax` | Incorrect flag/option usage | Check command help with `--help` |
| `File not found` | Specified path doesn't exist | Verify file paths and permissions |
| `Build failed` | Compilation or linting errors | Run `/build-and-fix --fix` to auto-resolve |
| `Test failed` | Test suite failures | Check test output for specific issues |

### Debug Mode

Enable verbose output for debugging:

```bash
/command --verbose --debug
```

### Getting Help

- **Command Help**: `/command --help`
- **Examples**: `/command --examples`
- **System Status**: `/kpi-advanced --report=summary`
- **Full Documentation**: Available in `/docs/` directory

---

## 💡 Best Practices

### Performance Optimization

1. **Use Appropriate Scopes**: Limit operations to relevant directories
2. **Batch Operations**: Combine related commands when possible
3. **Cache Results**: Use dry-run first for potentially expensive operations
4. **Monitor Performance**: Regularly check `/kpi-advanced` for insights

### Code Quality

1. **Regular Reviews**: Use `/code-review` frequently during development
2. **Automated Fixes**: Enable `--fix` flags for automatic improvements
3. **Comprehensive Testing**: Use `/test-route` before deploying changes
4. **Documentation**: Keep docs updated with `/dev-docs-update`

### Workspace Management

1. **Regular Cleanup**: Use `/compact` to maintain clean workspace
2. **Version Control**: Use `/undo` carefully and understand impacts
3. **Plugin Management**: Keep dependencies updated with `/plugin`
4. **Backup Strategy**: Understand rollback capabilities before major changes

### Security

1. **Validation**: Always validate inputs, especially for route testing
2. **Permissions**: Understand command authentication requirements
3. **Data Protection**: Be cautious with `--export` and sensitive data
4. **Audit Trail**: Use KPI analytics to monitor usage patterns

### Workflow Integration

```bash
# Daily development workflow
/build-and-fix --fix
/code-review --strict
/compact

# Pre-deployment checklist
/test-route /api/health --performance
/code-review --scope=./src/production
/kpi-advanced --report=performance

# Documentation maintenance
/dev-docs-update --type=api
/dev-docs-update --type=changelog
```

---

## 🚀 Advanced Features

### Custom Configurations

Many commands support configuration files:

```json
// .slash-commands.json
{
  "build-and-fix": {
    "autoFix": true,
    "excludeDirs": ["node_modules", ".git"],
    "timeout": 30000
  },
  "code-review": {
    "strictMode": true,
    "customRules": ["no-console-log"],
    "maxComplexity": 10
  }
}
```

### Environment Variables

```bash
# Configure behavior
export SLASH_COMMANDS_TIMEOUT=60000
export SLASH_COMMANDS_CACHE_DIR=./.cache
export SLASH_COMMANDS_LOG_LEVEL=debug
```

### Integration with IDE

Commands can be integrated into IDE workflows:

- **VS Code**: Add to tasks.json or create extensions
- **Cursor**: Built-in integration available
- **Vim/Emacs**: Create custom keybindings
- **JetBrains**: Add as external tools

### API Integration

Programmatic access to command functionality:

```javascript
import { getKPIIntegration } from '@skills-fabrik/slash-commands';

const kpi = getKPIIntegration();
await kpi.trackCommand('/build-and-fix --fix', result, sessionId);
const report = await kpi.generateKPIReport();
```

---

## 📚 Additional Resources

### Documentation
- **API Reference**: `/docs/api/slash-commands.md`
- **Architecture Guide**: `/docs/architecture/slash-commands.md`
- **Development Guide**: `/docs/development/contributing.md`

### Community
- **GitHub Issues**: Report bugs and request features
- **Discord Channel**: Real-time help and discussions
- **Blog**: Tips, tricks, and best practices

### Training
- **Video Tutorials**: Step-by-step command guides
- **Interactive Examples**: Try commands in safe environment
- **Workshop Materials**: Comprehensive learning resources

---

## 🎯 Quick Reference Card

```
ESSENTIAL COMMANDS:
/build-and-fix --fix     # Fix code issues
/code-review --strict     # Quality check
/compact                  # Clean workspace
/kpi-advanced            # View analytics

TESTING:
/test-route <route>       # Test API endpoint
/route-research <path>    # Find testing gaps

DOCUMENTATION:
/dev-docs-update         # Update docs

UTILITIES:
/plugin install <pkg>    # Install package
/undo --confirm          # Revert changes
```

---

**Last Updated**: 2025-11-01
**Version**: 1.2.0
**Maintainers**: Skills Fabric Development Team

For the most up-to-date information, visit our [GitHub repository](https://github.com/skills-fabrik/slash-commands) or check the built-in help with `/command --help`.