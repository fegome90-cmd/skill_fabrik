# Biblioteca de Skills — Guía Rápida

## Convenciones

- **SKILL.md** corto (≤ ~400 líneas), detalles en `/resources`.
- **type**: `guideline` | `guardrail` | `workflow` | `analyst` | `generator`.
- **enforcement**: `suggest` | `require` | `block` (solo guardrails).
- Scripts adjuntos deben ser idempotentes y documentados.

## Estructura de un Skill

```
skills/
└── <category>/
    └── <skill-id>/
        ├── SKILL.md           # Documento principal (≤400 líneas)
        ├── resources/          # Recursos on-demand
        │   ├── reference.md
        │   └── examples.md
        └── scripts/           # Scripts ejecutables (opcional)
            └── validate.sh
```

## Flujo de activación

1. **Pre-invoke**: Calcula score (keywords 20% + intent 30% + path 30% + content 20%)
2. **Si ≥ umbral** (default 0.6): Inyecta banner + carga SKILL.md (recursos on-demand)
3. **Stop hook**: Formateo → typecheck → guardrails → notificaciones → KPIs

## Tipos de Skills

### Guidelines

- **Enforcement**: `suggest`
- Activa sugerencias cuando el contexto es relevante
- Ejemplo: `backend-dev-guidelines`, `frontend-dev-guidelines`

### Guardrails

- **Enforcement**: `block` o `require`
- Bloquea o requiere acciones cuando detecta patrones peligrosos
- Ejemplo: `database-verification`, `secrets-and-config`

### Workflows

- Automa procesos completos
- Ejemplo: `plan-save-workflow`

### Analysts

- Analiza código/repositorio
- Ejemplo: `repo-auditor`, `pr-reviewer`

### Generators

- Genera código/documentación
- Ejemplo: `plan-architect`, `testing-plan-designer`

## Comandos útiles

### Indexar skills

```bash
pnpm skills:index
# o
node packages/skills-cli/dist/index.js skills index ./skills --out ./registry/index.json
```

### Validar skills

```bash
pnpm skills:lint
# o con strict mode
node packages/skills-cli/dist/index.js skills lint ./skills --strict
```

### Generar skill-rules.json

```bash
pnpm skills:rules
# o
node packages/skills-cli/dist/index.js skills rules
```

### Verificar activación de skills

```bash
node packages/skills-cli/dist/index.js skills check "crear endpoint backend" --verbose
```

### Ejecutar E2E

```bash
pnpm e2e
```

## QA mínima por PR

- ✅ `pnpm skills:lint` sin warnings
- ✅ E2E: guardrails bloquean casos peligrosos
- ✅ PM2: servicios levantan, logs accesibles

## Buenas prácticas

1. **Descripciones claras**: Orientadas a acción, explícitas sobre cuándo usar/NO usar
2. **Divulgación progresiva**: SKILL.md ligero, recursos solo cuando se necesitan
3. **Scripts reales**: Todos los scripts referenciados deben existir en el repo
4. **Ejemplos concretos**: Incluir ejemplos ✅/❌ para claridad
5. **Checklists**: Definir DoD claros para cada skill

## Recursos adicionales

- [Plan completo del proyecto](../plan-skill-fabric-cloop.md)
- [Metodología CLOOP](../../cloop/CLOOP-METHODOLOGY-GUIDE.md)
- [Template de SKILL.md](../../configs/SKILL.template.md)

---

**Última actualización**: 2025-01-29
