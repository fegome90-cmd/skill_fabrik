# Insumos de Discovery · 2025Q4

- **Fecha de inicio**: 2025-11-13
- **Equipo auditor**: Auditor Técnico (lead), Router Lead, Daemon Lead, Skills Curator, DocOps.
- **Contexto**: Primera iteración del inventario Skills Core siguiendo metodología CLOOP.

## Tareas pendientes

- [x] Ejecutar prompt `Discovery Sweep` con `discovery-20251113-filled.md`.
- [x] Registrar archivos sospechosos (sufijos `old`, `copy`, `backup`, `deprecated`).
- [x] Calcular conteos por dominio.
- [ ] Subir raw logs (si aplica) a `logs/auditoria-2025-11-13.jsonl`.
- [x] Generar prompt `contract-consistency-20251113-filled.md` para revisión de contratos.
- [x] Generar plan con CLI: `node packages/skills-cli/dist/index.js plan create "auditoria-skills-core-2025q4" --v2`
- [x] Aprobar plan (triada creada en `dev/active/auditoria-skills-core-2025q4`): `node packages/skills-cli/dist/index.js plan save mhxknb6e-bd6b0f3 --approve`

## Notas

- `rg --files -g '*old*' ...` → generó `rg-filenames-20251113-1219.txt` (ver hallazgos F-001 a F-003).
- `contract-consistency-20251113-filled.md` disponible como guía para revisar DOCS vs implementación. Resultado inicial: `docs/skills/` solo contiene README.md (ver F-004).
- `find packages ...` y `find skills ...` → `raw-files-packages.txt`, `raw-skills.txt` actualizados 2025-11-13.
- Pendiente: subir logs detallados a `logs/auditoria-2025-11-13.jsonl`.
- Mantener triada (plan/context/tasks) abierta para futuros prompts PBv2.
