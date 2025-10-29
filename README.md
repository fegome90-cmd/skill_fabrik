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
pnpm -w link --global skills-cli
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
