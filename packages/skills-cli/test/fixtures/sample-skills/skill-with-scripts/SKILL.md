---
id: skill-with-scripts
version: 1.0.0
name: Skill with Scripts
summary: A skill demonstrating scripts configuration
audience: developers
tags: [test, scripts, execution]
allowed-tools:
  - fs.read
  - fs.write
  - bash
scripts:
  run: node index.js
  dry-run: node index.js --dry-run
---

# Skill with Scripts

This skill demonstrates the scripts configuration feature for snapshot testing.
It includes both run and dry-run script definitions to validate script handling.

## Scripts Configuration

The skill defines two scripts:
- **run**: Executes the main functionality
- **dry-run**: Executes in preview mode without making changes

## Execution

Run script: `node index.js`
Dry run script: `node index.js --dry-run`