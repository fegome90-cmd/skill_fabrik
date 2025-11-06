---
id: policy-net
version: 0.1.0
type: guardrail
summary: 'Política de ejemplo para solicitudes de red con permisos controlados.'
audience: engineers
when_to_use: 'Cuando se necesita validar y controlar solicitudes de red con permisos restringidos.'
severity: high
tags: [policy, network, security, permissions]
name: Policy NET Example
allowed-tools:
  - net.request
scripts:
  dry-run: node exec-scripts/plan.js
  run: node exec-scripts/run.js
---

# Policy NET Example

Habilidad de ejemplo que intenta realizar solicitudes de red con control de acceso y permisos específicos.
