---
id: repo-auditor
version: 0.1.0
type: guideline
summary: 'Auditor de repositorio de solo lectura para inspeccionar estructura y estado sin modificaciones.'
audience: engineers
when_to_use: 'Cuando se necesita inspeccionar el estado del repositorio sin realizar cambios.'
severity: low
tags: [audit, repository, readonly, inspection]
name: Auditor de repositorio (read-only)
allowed-tools:
  - fs.read
  - git.status
  - git.diff
scripts:
  dry-run: node exec-scripts/plan.js
  run: node exec-scripts/run.js
---

# Auditor de repositorio (read-only)

Inspecciona estructura y estado del repositorio sin modificar nada.

## Qué hace
- Reporta `git status` (porcelain).
- Reporta `git diff` (sin color, unified=0).

## Límites
- No realiza cambios. Solo lectura.

