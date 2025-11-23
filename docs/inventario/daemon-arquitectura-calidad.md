## Arquitectura y Calidad de Código – `packages/daemon`

### 1. Visión General de la Arquitectura
- **Objetivo**: servicio central que ejecuta skills, coordina herramientas y expone API para activación/ejecución.
- **Entradas principales**:
  - Peticiones HTTP/gRPC vía `index.ts` (Fastify/Fastify-like bootstrap).
  - Confirmaciones y acciones desde router/CLI (`client/daemon-client.ts`).
  - Configuración YAML (`config/default.yaml`, `production.yaml`) consumida por `config/daemon-config.ts`.
- **Componentes clave**:
  - `app.ts`: configura servidor, middlewares, rutas, métricas y arranque.
  - `auth/`, `middleware/auth.ts`: validación de credenciales (API Key/JWT).
  - `skills.ts`, `skillManagerMapper.ts`: catálogo dinámico de skills y mapeo de definición (`SKILL.md`) a ejecuciones.
  - `needs.ts`, `tools.ts`: resolución de recursos y adaptadores externos.
  - `persistence/`: event store + backup/recovery del estado de ejecución.
  - `resilience/`: circuit breaker, retry y gestión de fallos controlados.
  - `observability/`: logging estructurado, OpenTelemetry, métricas Prometheus, panel tiempo real (`real-time-dashboard.ts`).
  - `state/`: capa de estado distribuido con adaptador Redis.
  - `policy.ts`, `policyLevels.ts`: enforcement de políticas y guardrails.
- **Flujo típico**:
  1. API recibe `activate`/`execute`.
  2. Autenticación + validación schema (`schemas/*.json`).
  3. Resolución de skill y necesidades (tools, permisos).
  4. Ejecución controlada (sandbox, políticas, resiliencia).
  5. Registro de eventos, métricas y estado distribuido.
  6. Respuesta al cliente y emisión a observabilidad.

### 2. Integraciones y Dependencias
- **Router**: espera endpoint estable para activaciones (puerto 7727). Depende de consistencia en `skills.ts` y `policy.ts`.
- **PM2**: ecosistema (`scripts/pm2/ecosystem.config.cjs`) gestiona proceso `sf-daemon`; rely en `dist/index.js`.
- **Servicios externos**:
  - Redis (estado distribuido).
  - PostgreSQL (tablas verificadas via `ensurePostgresTables.ts`).
  - Observabilidad (Prometheus, OpenTelemetry exporters).
  - Event store propio (archivos JSONL y drivers en `persistence/`).

### 3. Calidad de Código – Evaluación
**Fortalezas**
- **Modularidad alta**: carpetas dedicadas por responsabilidad (auth, persistence, resilience, observability).
- **Cobertura de pruebas**: suite extensa (`test/`) cubre activación, confirmación, políticas, resiliencia, snapshots, estado distribuido, clientes.
- **Patrones resilientes**: circuit breakers, retries y registro de eventos permiten tolerancia de fallos.
- **Observabilidad integrada**: métricas Prometheus + tracing otel; panel en tiempo real.
- **Uso de esquemas JSON**: asegura consistencia en requests/responses (calidad de API).

**Riesgos / Debilidades**
- **Backups sin gobernanza**: `src/app.ts.backup` y `persistence/backup.ts` sugieren refactors incompletos; riesgo de divergencia y confusión.
- **Acoplamientos implícitos**: `skills.ts`, `tools.ts`, `needs.ts` dependen de convenciones del router y de `SKILL.md` sin contrato formal consolidado.
- **Complejidad creciente**: `app.ts` y `index.ts` pueden volverse monolíticos; revisar tamaño y responsabilidades para mantener mantenibilidad.
- **Depósitos de estado múltiple**: interacción entre event-store, Redis y backup requiere documentación precisa para evitar estados corruptos.
- **Falta de métricas/CI actualizadas**: no hay evidencia de umbrales automáticos sobre coverage, lint o deuda (se asume pero no se confirma en el repo actual).

### 4. Observaciones Específicas
- **Políticas de seguridad**: `policy.ts` + `policyLevels.ts` están alineadas con tests, pero dependen de definiciones externas en `router`/`shared`; definir interfaces contractuales.
- **Herramientas y necesidades**: la resolución de `needs.ts` debería documentarse para evitar nuevos recursos sin pruebas.
- **Dependencias directas**: no hay separación explícita entre lógica HTTP y core de ejecución; considerar adaptadores/ports para permitir drivers alternativos.
- **Configuración**: `config/default.yaml` y `production.yaml` bien diferenciados, pero faltan validaciones automáticas para scripts/entornos.

### 5. Recomendaciones
1. **Eliminar o archivar backups** tras validar diferencias; incorporar política oficial en documentación.
2. **Contrato formal Skill/Daemon**: crear `docs/skills/SKILL-CONTRACT.md` y enlazar requisitos (needs, tools, hooks).
3. **Descomponer `app.ts`** en módulos (registrar plugins, rutas, observabilidad) para mantener cohesión baja y facilitar testing unitario.
4. **Automatizar métricas de calidad**: introducir CI que mida cobertura, lint y complejidad; reportar en dashboards (`obs/kpi`).
5. **Documento de arquitectura viva**: actualizar `docs/API/DAEMON.md` con diagramas de alto nivel (componentes, secuencia). Incluir flow de persistencia y resiliencia.
6. **Pruebas de regresión para backups**: si se conservan rutas de recuperación (`persistence/backup.ts`), garantizar prueba dedicada y documentación de uso.
7. **Detallar flujos de estado distribuido**: explicar cómo Redis y event store interactúan; definir procedimientos para fallos parciales.

### 6. Próximos pasos sugeridos
- Revisión técnica con responsables del daemon para validar eliminación de archivos obsoletos.
- Taller arquitectónico Router–Daemon para documentar contratos y dependencias.
- Integrar herramientas de análisis estático/complexity (Sonar, ESLint rules avanzadas) y registrar resultados.
- Mantener matriz de responsabilidades (RASCI) para módulos críticos (auth, persistence, resilience).


