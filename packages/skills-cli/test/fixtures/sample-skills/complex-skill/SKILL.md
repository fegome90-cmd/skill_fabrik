---
id: complex-skill
version: 2.1.0
name: Complex Skill with All Features
summary: A comprehensive skill demonstrating all manifest features
audience: developers
when_to_use: When testing all manifest features and configurations
severity: medium
tags: [test, complex, comprehensive, all-features]
allowed-tools:
  - fs.read
  - fs.write
  - bash
  - git
  - npm
  - docker
  - curl
scripts:
  run: node scripts/main.js --mode=production
  dry-run: node scripts/main.js --mode=dry-run --verbose
---

# Complex Skill with All Features

This is a comprehensive skill that demonstrates all available manifest features
for comprehensive snapshot testing. It includes advanced configurations,
multiple tool permissions, and complex script definitions.

## Features

This skill includes:
- Complex version with semantic versioning (2.1.0)
- Comprehensive metadata fields
- Multiple allowed-tools permissions
- Complex script configurations with parameters
- All supported manifest fields

## Allowed Tools

The skill has extensive tool permissions:
- File system operations (fs.read, fs.write)
- Command execution (bash)
- Version control (git)
- Package management (npm)
- Container operations (docker)
- Network operations (curl)

## Scripts

- **run**: Production mode execution with parameters
- **dry-run**: Preview mode with verbose output

## Testing Purpose

This skill is designed to test:
- Complex manifest structure validation
- All field types and configurations
- Script parameter handling
- Tool permission validation
- Metadata field processing
- Cross-platform compatibility