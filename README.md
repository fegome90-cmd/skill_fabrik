# Skills Fabric

Editor-agnostic kit para auto-activación de skills, hooks de calidad, dev-docs estructurados y debugging con PM2.

## Estructura

```
skill-fabric/
├─ packages/
│ ├─ skills-cli/       # CLI: init/lint/pack/install/list/run/mine
│ ├─ router/           # pre-invoke + stop hooks (editor/CLI agnostic)
│ ├─ mcp-adapters/     # fs, git, pm2, metrics (Zen Hub MCP)
│ └─ kpi/              # JSONL/Prometheus events
├─ skills/             # Biblioteca canónica (SKILL.md + resources + scripts)
│ ├─ guidelines/       # frontend-dev, backend-dev, api-contracts
│ ├─ guardrails/       # database-verification, secrets-and-config, migration-safety
│ ├─ workflows/        # plan-architect, plan-save-workflow, testing-plan-designer
│ ├─ analysts/         # repo-auditor, pr-reviewer, test-scaffolder
│ └─ generators/       # plan-architect, testing-plan-designer
├─ registry/           # Índices compilados
│ ├─ index.json        # Metadatos (name, description, tags) para carga rápida
│ └─ bundles/          # Paquetes listos (on-demand)
├─ configs/
│ ├─ skill-rules.schema.json  # Esquema validación
│ ├─ SKILL.template.md         # Plantilla ≤400 líneas
│ └─ repos.yaml                # Repos a minar (ADRs + patrones)
├─ scripts/pm2/ecosystem.config.cjs
├─ obs/kpi/events.jsonl        # Eventos de desempeño
└─ docs/
```

## Instalación

```bash
# Instalar dependencias
pnpm install

# Build de packages
pnpm -w build

# Link global (opcional)
# Enlazar solo el paquete del CLI de forma global
pnpm --filter @skills-fabrik/skills-cli link --global
```

## Uso Rápido

### Crear un nuevo skill

```bash
skills init guideline backend-dev-guidelines
```

### Validar skills

```bash
skills lint
```

### Indexar skills

```bash
skills index ./skills --out ./registry/index.json
```

## Servicios y PM2

### Iniciar servicios

```bash
# Iniciar todos los servicios
pm2 start scripts/pm2/ecosystem.config.cjs --env development

# O iniciar servicios individuales
pm2 start scripts/pm2/ecosystem.config.cjs --only sf-daemon --env development
pm2 start scripts/pm2/ecosystem.config.cjs --only service-discovery --env development
pm2 start scripts/pm2/ecosystem.config.cjs --only router-service --env development
```

### Servicios disponibles

| Servicio          | Puerto | Health Check                 | Descripción                    |
| ----------------- | ------ | ---------------------------- | ------------------------------ |
| sf-daemon         | 7727   | http://127.0.0.1:7727/health | Core daemon service            |
| service-discovery | 8877   | http://127.0.0.1:8877/health | Service registry con CORS      |
| router-service    | 3000   | http://127.0.0.1:3000/health | Router de activación de skills |

### Comandos PM2 útiles

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs <service-name> --lines 200

# Reiniciar servicio
pm2 restart <service-name>

# Reiniciar con nuevas variables de entorno
pm2 restart <service-name> --update-env

# Detener servicio
pm2 stop <service-name>

# Eliminar servicio (útil para limpiar variables cacheadas)
pm2 delete <service-name>

# Guardar configuración actual
pm2 save

# Monitoreo en tiempo real
pm2 monit
```

### Notas operativas

- **Variables de entorno**: Al cambiar `ecosystem.config.cjs`, usar `pm2 restart <service> --update-env` o `pm2 delete <service> && pm2 start ...` para evitar variables cacheadas.
- **CORS**: Configurado con `@fastify/cors ^8.4.0` (compatible con Fastify 4.x). Si actualizas a Fastify 5, cambiar a `@fastify/cors ^11`.
- **wait_ready**: Si un servicio se queda en "waiting" con `wait_ready: true`, asegurar que el código envía `process.send('ready')` tras `listen()` o quitar `wait_ready`.

## Principios

- **Divulgación Progresiva**: SKILL.md ligero (≤400 líneas), recursos on-demand
- **Descripciones de Alta Calidad**: Orientadas a acción, claras sobre cuándo usar/NO usar
- **Guardrails Educativos**: SUGGEST → WARN → BLOCK (multi-nivel)
- **Planning Mode Duro**: No ejecutar sin plan aprobado
- **Zero Errors Left Behind**: Stop hook garantiza calidad post-respuesta

## Documentación

- [Plan de Implementación](documentos/plan-skill-fabric-cloop.md)
- [Informe de Análisis PDFs](documentos/informe-analisis-pdfs-skills.md)
- [Metodología CLOOP](cloop/CLOOP-METHODOLOGY-GUIDE.md)
- [ADR Skills Expansion (Context, Task, Plan, Overview)](docs/adr-skills-expansion/README.md)
