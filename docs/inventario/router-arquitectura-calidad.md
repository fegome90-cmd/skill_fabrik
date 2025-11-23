# Informe de Arquitectura y Calidad del Código — `packages/router`

## 1. Visión general de la arquitectura
- **Propósito**: Actuar como capa de decisión que determina qué skill se activa frente a un input, coordinando pre-validaciones, señales y guardrails antes de delegar en el daemon.
- **Entrada/salida**: recibe contexto enriquecido de CLI/hooks, aplica evaluación y devuelve skill elegida o `null`, manteniendo telemetría para No-Mess-Left-Behind (NMLB).
- **Interacciones principales**: comunicación con daemon (`daemon-connection.ts`, `optimized-daemon-service.ts`), monitoreo (`activation/monitoring`, `memtech-integration.ts`) y pipeline de pre/post hooks (`pre-invoke.ts`, `stop.ts`).

## 2. Capas y componentes clave
- **Capa de preprocesamiento**: `pre-invoke.ts`, `advanced-quality-gates.ts`, `guardrails.ts`; garantizan inputs limpios y reglas de seguridad.
- **Motor de activación**: `activation/ActivationEngine.ts`, `activation/signals/`, `activation/optimization/`; calcula puntuaciones y aplica optimizaciones en tiempo real.
- **Gestión de configuración**: `config/config.ts`, `logger.ts`, `health.ts`; centralizan parámetros y salud del servicio.
- **Integraciones externas**: `daemon-connection.ts`, `memtech-integration.ts`, `project-analyzer.ts`; conectan con daemon, almacenamiento MemTech y análisis de proyecto.
- **Resiliencia y lifecycle**: `resilience/circuit-breaker.ts`, `resilience/retry.ts`, `shutdown.ts`, `stop.ts`; aportan tolerancia a fallos y apagado seguro.
- **Estrategia de pruebas**: `src/__tests__/` + `__tests__/` externa con suites por dominio (bash-validator, guardrails, build-check, nmlb, etc.).

## 3. Flujos principales
1. **Recepción de solicitud** → `server.ts` / `main.ts` → normalización en `pre-invoke.ts`.
2. **Evaluación** → detectores y señales ponderan candidatas (`detectors.ts`, `activation/signals`).
3. **Control de riesgos** → `advanced-quality-gates.ts` y `guardrails.ts` filtran escenarios peligrosos.
4. **Selección y despacho** → `ActivationEngine` elige skill o `null`, registrando métricas.
5. **Entrega al daemon** → `optimized-daemon-service.ts` gestiona conexión eficiente.
6. **Telemetría y cleanup** → `stop.ts`, `health-checker.ts`, integration con NMLB.

## 4. Evaluación de calidad del código
- **Fortalezas**
  - Modularidad clara (carpetas separadas para señales, resiliencia, cache, integraciones).
  - Cobertura de pruebas amplia: suites unitarias, integración, e2e, performance y seguridad organizadas por dominio.
  - Presencia de mecanismos de resiliencia (retry, circuit breaker) y salud (`health.ts`).
  - Integración con observabilidad (monitoring, memtech) y soporte para guardrails estrictos.
- **Oportunidades de mejora**
  - Respaldos (`*.backup`) indican necesidad de limpieza o documentación de su propósito.
  - Multiplicidad de configuraciones de pruebas (Jest y Vitest) puede generar duplicidad; evaluar convergencia o documentación de uso.
  - Revisar consistencia tipada: coexistencia de `types.ts`, `types.d.ts`, `types.js` sugiere build artefacts dentro del repo; definir si deben ignorarse o generarse en build.
  - Analizar deuda en integraciones externas para asegurar desac acoplamiento (ej. `project-analyzer.ts` vs. CLI).

## 5. Riesgos identificados
- **R1: Archivos de respaldo** → generan incertidumbre sobre la versión activa del detector o configuración. *Mitigación*: absorber cambios en contratos oficiales y archivar/borrar respaldos tras revisión.
- **R2: Configuración de test duplicada** → `jest.config.js` y `vitest.config.ts` podrían divergir, causando resultados inconsistentes. *Mitigación*: documentar alcance de cada runner o unificar.
- **R3: Artefactos generados en `src/activation`** → conservar solo fuentes (`types.ts`) y mover artefactos compilados a `dist/` o excluir de Git. *Mitigación*: ajustar proceso de build.
- **R4: Dependencia de hooks externos** → garantizar que cambios en Pre/Stop Hooks estén sincronizados con contratos NMLB. *Mitigación*: revisar contrato NMLB al modificar hooks.

## 6. Recomendaciones de mejora continua
1. **Normalizar contratos**: vincular el contrato oficial del router con esta arquitectura, integrando secciones de señales, guardrails y resiliencia.
2. **Auditoría recurrente**: incluir `packages/router` en `audit:skills` para vigilar duplicados, artefactos generados y consistencia de pruebas.
3. **Telemetría alineada con NMLB**: documentar métricas clave (tiempo de activación, fallos de guardrail) y garantizar registro en JSONL oficial.
4. **Revisión de dependencias**: evaluar si `memtech-integration.ts` y `project-analyzer.ts` deben residir aquí o en módulos compartidos para reducir duplicidad.
5. **Refuerzo de documentación técnica**: añadir sección “Arquitectura del Router” en `docs/skills/router-contract.md` (cuando exista) enlazando a este informe.

## 7. Próximos pasos sugeridos
- Programar limpieza y archivado de archivos `*.backup` con soporte del futuro proceso de auditoría.
- Revisar pipelines de build/test para evitar coexistencia de artefactos compilados en la carpeta fuente.
- Incorporar checklist de calidad en PRs del router (verificar pruebas, guardrails, contratos actualizados).
- Publicar este informe junto al inventario y mantenerlo versionado como referencia para CI y auditorías.
