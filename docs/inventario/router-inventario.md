# Inventario del paquete `packages/router`

## 1. Contexto general
- Ubicación principal: `packages/router` dentro del monorepo Skills Fabrik.
- Rol del módulo: motor de activación de skills, interfaz con daemon y aplicación de guardrails.
- Componentes críticos: código fuente (`src/`), suites de pruebas (`__tests__/` y `src/__tests__/`), configuraciones (`package.json`, `jest.config.js`, `tsconfig.json`).

## 2. Estructura de alto nivel
- `package.json`, `README.md`, `tsconfig.json`, `vitest.config.ts`.
- Configuración de pruebas: `jest.config.js` + respaldo `jest.config.js.backup`.
- Utilidades E2E: `e2e/simulate.ts`.
- Código fuente consolidado en `src/`.
- Suites de validación extensiva en `__tests__/` (fuera de `src/`).

## 3. Detalle de `src/`
- `src/index.ts`, `src/main.ts`, `src/server.ts`: puntos de arranque y servidor HTTP.
- `src/config/`, `src/logger.ts`, `src/health.ts`, `src/health-checker.ts`: configuración y estado.
- `src/pre-invoke.ts`, `src/advanced-quality-gates.ts`, `src/guardrails.ts`: validaciones previas y control de calidad.
- `src/activation/`: motor de activación con configuraciones, proveedores, optimización y señales (`signals/`).
- `src/daemon-connection.ts`, `src/optimized-daemon-service.ts`: enlace con el daemon.
- `src/resilience/`: utilidades de circuit breaker y reintentos.
- `src/memtech-integration.ts`, `src/project-analyzer.ts`: integraciones adicionales.
- `src/cache/lru-cache.ts`, `src/utils/plan-check.ts`: utilidades de soporte.
- `src/schemas/validation.ts`: esquemas de validación.
- `src/shutdown.ts`, `src/stop.ts`: ciclo de vida.
- `src/__tests__/`: pruebas específicas del core (activación, fuzzy matching, guardrails, pre-invoke y flujo completo).

## 4. Carpeta `__tests__/` en raíz
- Suites temáticas (`bash-validator/`, `build-check/`, `daemon-integration/`, `eslint/`, `guardrails/`, `nmlb/`).
- Cada suite organizada en `unit/`, `integration/`, `e2e/`, `performance/`, `security/` según aplique.
- `__tests__/fixtures/`: datos de apoyo (`database-queries.ts`, `secrets-examples.ts`, `skill-rules-test.json`).
- `__tests__/setup.ts`: inicialización compartida.

## 5. Artefactos adicionales y hallazgos
- Respaldos explícitos: `jest.config.js.backup`, `src/detectors.ts.backup`.
- No se encontraron binarios ni artefactos compilados dentro del paquete.
- Inventario listo para alimentar procesos de auditoría (detección de duplicados, limpieza de backups, consolidación de contratos).

## 6. Próximos pasos sugeridos
- Revisar relevancia de archivos `*.backup` y planificar su eliminación o traslado a `/archived/`.
- Asociar este inventario al proceso `audit:skills` y a la documentación del router.
- Validar que el contrato oficial del router (en `docs/skills/`) cite esta estructura y responsabilidades.

## 7. Diagrama Mermaid del router
```mermaid
graph TD
  subgraph Entradas
    INPUT[Input del cliente/agente]
    SKILLS[Índice de skills y reglas]
    CONTEXTO[Contexto enriquecido]
  end

  subgraph Router Core
    PREHOOKS[Pre Hooks
(validación, enriquecimiento, plan-check)]
    DETECTORES[Detectores & Signals]
    GUARDRAILS[Guardrails & Quality Gates]
    ACTIVACION[Activation Engine]
  end

  subgraph Integraciones
    DAEMON[Daemon service]
    METRICAS[Monitorización & eventos NMLB]
  end

  subgraph Salidas
    DECISION[Skill seleccionado o null]
    LOGS[Logs & trazas]
  end

  INPUT --> PREHOOKS
  SKILLS --> DETECTORES
  CONTEXTO --> PREHOOKS
  PREHOOKS --> DETECTORES
  DETECTORES --> GUARDRAILS
  GUARDRAILS --> ACTIVACION
  ACTIVACION --> DECISION
  ACTIVACION --> DAEMON
  ACTIVACION --> METRICAS
  METRICAS --> LOGS
  DECISION --> LOGS
```

### Explicación del diagrama
- **Entradas**: combinan el input original, el índice de skills y el contexto contextualizado para la decisión.
- **Router Core**: orquesta pre-hooks para saneamiento, detectores con señales de activación, guardrails que aplican políticas y el motor que puntúa y decide la skill.
- **Integraciones**: el daemon recibe la skill elegida y las métricas alimentan No-Mess-Left-Behind (NMLB) y observabilidad.
- **Salidas**: resultado final (skill o “null”), junto con logs y trazas que documentan cada paso.
