---
id: skill-with-tools
version: 1.0.0
name: Skill with Tools
summary: A skill demonstrating allowed-tools configuration
audience: developers
tags: [test, tools, permissions]
allowed-tools:
  - fs.read
  - fs.write
  - bash
  - git
  - npm
scripts:
  run: node scripts/run.js
  dry-run: node scripts/dry-run.js
---

# Skill with Tools

This skill demonstrates comprehensive allowed-tools configuration.
It includes multiple tool permissions to validate tool handling in snapshots.

## Allowed Tools

The skill is configured with the following tool permissions:
- **fs.read**: Read file system access
- **fs.write**: Write file system access
- **bash**: Execute bash commands
- **git**: Git operations
- **npm**: Package management operations

## Security Considerations

Each tool permission represents a security boundary. The snapshot testing
validates that these permissions are correctly preserved across packaging
and unpackaging operations.