---
id: policy-s1
version: 0.1.0
type: guardrail
summary: 'Política de ejemplo para operaciones de escritura seguras con validación.'
audience: engineers
when_to_use: 'Cuando se necesita validar y controlar operaciones de escritura en el sistema de archivos.'
severity: high
tags: [policy, security, filesystem, permissions]
name: Policy S1 Example
allowed-tools:
  - fs.write
scripts:
  dry-run: node exec-scripts/plan.js
  run: node exec-scripts/run.js
---

# Policy S1 Example

Habilidad de ejemplo que solicita operaciones de escritura seguras con validación y control de permisos.
