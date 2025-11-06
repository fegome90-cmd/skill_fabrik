# context.md — Skill Fabric (Cursor-first → Editor-agnóstico)

Fecha: 2025-10-29  
Versión: 0.2.0

## Estado
- F0 Glue (Cursor): PENDIENTE
- F1 SFP v0.x (Daemon+Schemas): PENDIENTE
- F2 Policy (deny-by-default): PENDIENTE
- F3 Storage Postgres-first + FS fallback: PENDIENTE

## Decisiones
1) CLI único (sf) con namespaces (sf skill|plan|context|task|daemon), alias de compatibilidad antiguos.  
2) SFP v0.x (REST): /activate, /execute, /list, /validate, /health.  
3) Policy en middleware: deny-by-default + allowed-tools por skill.  
4) Storage: FS (L0) fuente de verdad; Postgres (L2) canónico; Redis/Chroma off por defecto.  
5) Evidencia: obs/kpi/events.jsonl + sf_events (Postgres) con evidence_id.

## Interfaces (contrato)
- /activate ↔ heurística + labels @intent/@skill/@guard/@adr  
- /execute ↔ runner estándar (dry-run/real), respeta policy  
- /validate ↔ manifiesto/recursos del skill  
- /list ↔ catálogo local  
- /health ↔ liveness/latencia agregada

## Riesgos (y mitigación)
- Divergencia CLI/editor → tests de paridad + schemas congelados.  
- Reconexión ruidosa (Redis/Chroma) → deshabilitados; fallback silencioso a FS.  
- Latencia > 50 ms en /activate → cache in-proc L0 + perfiles de ruta caliente.  

