## Informe de Auditoría Conceptual – Skills Core

### 1. Alcance
- Auditoría conceptual del ecosistema Skills Core (router, daemon, pm2, skills y documentación).
- Revisión de duplicados, archivos sospechosos, contratos vigentes y vacíos de gobernanza.

### 2. Inventario Relevante
- `packages/daemon`: núcleo de orquestación; contiene `src/app.ts.backup` y múltiples esquemas JSON.
- `packages/router`: motor de detección/activación; incluye `jest.config.js.backup` y `src/detectors.ts.backup`.
- `packages/skills-cli`: CLI con directorios `dist.backup.*` y archivos `.bak` en `src/core`.
- `scripts/pm2/ecosystem.config.cjs`: único ecosistema oficial con cuatro procesos (daemon, router, service-discovery, skills-cli).
- `skills/*/SKILL.md`: catálogo de skills sin duplicados; recursos adjuntos por skill.
- Contratos detectados:
  - Router: `docs/API/ROUTER.md`.
  - Daemon: `docs/API/DAEMON.md`.
  - Skills contract: **no existe** `SKILL-CONTRACT.md`.
  - No-Mess-Left-Behind: sin contrato formal; referencias dispersas (`packages/router/src/stop.ts`, `ci/GATES.yml`, documentación general).

### 3. Hallazgos y Severidad
| Severidad | Artefactos | Impacto | Acción recomendada |
| --- | --- | --- | --- |
| Alta | `packages/daemon/src/app.ts.backup`, `packages/router/src/detectors.ts.backup`, `scripts/pre-deployment-check*.bak` | Posibles divergencias vs. fuente oficial; riesgo de ejecución accidental | Revisar contenido, migrar cambios útiles y mover a `archived/` o eliminar |
| Alta | `packages/skills-cli/src/core/*.bak`, `packages/skills-cli/dist.backup.*` | Confusión en builds del CLI | Definir versión activa; archivar o borrar copias tras validación |
| Media | `docs/backups/*`, `mcp/.../backup.*` | Sin política de retención; mezcla con fuentes activas | Consolidar en `archived/backups/` con metadatos |
| Media | Reportes analíticos múltiples sobre router/daemon | Riesgo de contradicción con contratos | Mantener un índice maestro que referencie versión oficial |
| Baja | Archivos con “legacy/old” en contextos distintos (fonts, planes) | Ruido en auditorías automáticas | Ajustar filtros para ignorar extensiones binarias o rutas de investigación |

### 4. Vacíos de Documentación
- Falta un contrato unificado `SKILL-CONTRACT.md` dentro de `docs/skills/`.
- No existe `NMLB.md` que normalice el proceso No-Mess-Left-Behind.
- `docs/skills/` solo contiene `README.md`; se requiere repositorio de contratos oficiales por dominio.

### 5. Recomendaciones Prioritarias
1. **Single Source of Truth**: crear `docs/skills/GOVERNANCE.md`, `SKILL-CONTRACT.md` y `NMLB.md`; enlazar desde CLI, router y daemon.
2. **Gestión de Backups**: establecer `archived/` en la raíz para cualquier `.bak`, `.backup` o distros históricos; registrar fecha y responsable.
3. **Política pm2**: documentar en `scripts/pm2/README.md` que `ecosystem.config.cjs` es la única referencia oficial y que cualquier override debe derivarse de él.
4. **CI Gate**: añadir verificación que falle si aparecen nuevas copias no autorizadas o contratos duplicados fuera de `docs/skills/`.
5. **Informe Automatizable**: producir versiones `skills-audit.md` y `skills-audit.json` con estos hallazgos para alimentar agentes de limpieza futura.

### 6. Próximos Pasos
- Validar cada backup con responsables de `daemon`, `router` y `skills-cli`.
- Consolidar contratos y republicarlos con versionado semántico.
- Integrar reglas de auditoría en CI y documentar el flujo en `docs/skills/GOVERNANCE.md`.


