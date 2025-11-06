---
id: repo-auditor-deny
version: 0.1.0
type: guideline
summary: 'Auditor sin permisos para probar política deny-by-default.'
audience: engineers
when_to_use: 'Cuando se necesita probar la política de denegación por defecto.'
severity: low
tags: [audit, deny, security, testing]
name: Auditor sin permisos
allowed-tools: []
scripts:
  dry-run: node exec-scripts/plan.js
  run: node exec-scripts/run.js
---

# Auditor sin permisos

Intenta auditar el repositorio pero no tiene herramientas permitidas. Sirve para probar la política deny-by-default.

