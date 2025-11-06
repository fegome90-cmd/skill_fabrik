---
id: policy-s2
version: 0.1.0
type: guardrail
summary: 'Política de ejemplo para operaciones destructivas con validación estricta.'
audience: engineers
when_to_use: 'Cuando se necesita validar y controlar operaciones potencialmente destructivas en el sistema de archivos.'
severity: critical
tags: [policy, security, destructive, validation]
name: Policy S2 Example
allowed-tools:
  - fs.rm
scripts:
  dry-run: node exec-scripts/plan.js
  run: node exec-scripts/run.js
---

# Policy S2 Example

Habilidad de ejemplo que intenta ejecutar operaciones destructivas con validación estricta y control de seguridad.
