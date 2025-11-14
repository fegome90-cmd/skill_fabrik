# Plan de Remediación – Auditoría Skills Core 2025Q4

## Metadata

```yaml
plan_id: auditoria-skills-core-2025q4-remediation
version: 1.0.0
created: 2025-11-13
status: APPROVED
owner: Technical Auditor
stakeholders:
  - Router Lead
  - Daemon Lead
  - Skills Curator
  - DocOps
  - MemTech Steward
duration_estimate: 40h
complexity: HIGH
innovation_level: MEDIUM
```

---

## Resumen Ejecutivo

**Objetivo:** Remediar los 4 hallazgos críticos identificados en la auditoría Skills Core 2025Q4, estableciendo un sistema de cero deuda técnica mediante TDD, quality gates y automatización de verificaciones.

**Valor de negocio:** Garantizar Single Source of Truth en contratos, eliminar artefactos duplicados/obsoletos y prevenir drift futuro mediante CI/CD integrado.

**Criterios de éxito:**

- ✅ 100% de hallazgos críticos resueltos y validados
- ✅ Contratos consolidados en `docs/skills/` con versión única por dominio
- ✅ Test suite automatizado con cobertura ≥80%
- ✅ Quality gates integrados en CI/CD
- ✅ Documentación actualizada y drift prevention activo

---

## Arquitectura de la Solución

### Principios Fundamentales

1. **Single Source of Truth (SSOT)**
   - Un único contrato canónico por dominio en `docs/skills/`
   - Versionado semántico explícito
   - Fecha de última actualización

2. **Test-Driven Development (TDD)**
   - Tests antes de implementación
   - Cobertura mínima 80%
   - Validación automática en CI

3. **Zero Technical Debt**
   - Quality gates obligatorios
   - No merge sin tests pasando
   - Auditoría periódica automatizada

4. **Traceability**
   - Cada cambio vinculado a hallazgo
   - Decision logs en commits
   - Métricas pre/post remediación

---

## Arquitectura de Verificación (TDD)

### Test Suite Structure

```
tests/
├── contracts/
│   ├── contract-existence.test.ts      # F-004: Verificar presencia de contratos
│   ├── contract-uniqueness.test.ts     # F-002: Detectar duplicados
│   └── contract-version.test.ts        # Validar metadata de versiones
├── artifacts/
│   ├── obsolete-detection.test.ts      # F-003: Detectar sufijos old/copy
│   ├── pm2-config.test.ts              # F-001: Validar configuración PM2
│   └── skills-registry.test.ts         # Verificar skills indexados
├── integration/
│   ├── contract-impl-sync.test.ts      # Contratos vs implementación
│   └── cli-activation.test.ts          # Flujo CLI completo
└── e2e/
    └── audit-workflow.test.ts          # Workflow completo de auditoría
```

### Quality Gates (Pre-commit)

```yaml
gates:
  - name: 'Contract Uniqueness'
    condition: 'No debe existir más de un archivo *CONTRACT_NAME*.md en docs/skills/'
    blocking: true

  - name: 'Obsolete Artifacts'
    condition: 'No archivos con sufijos -old, -copy, -backup, -deprecated'
    blocking: true

  - name: 'Contract Metadata'
    condition: 'Todos los contratos tienen version, date, owner'
    blocking: true

  - name: 'Skills Registry Sync'
    condition: 'Todos los SKILL.md están en registry/index.json'
    blocking: false
    warning: true
```

---

## Fases del Plan

### FASE 0: Preparación y Testing Framework (4h)

**Objetivos:**

- Configurar infraestructura de testing
- Crear test suite base
- Establecer quality gates

**Entregables:**

- [ ] Test framework configurado (Vitest/Jest)
- [ ] Test suite base con 10+ tests
- [ ] Quality gates documentados
- [ ] CI/CD pipeline actualizado

**Quality Gate:**

- Tests ejecutan exitosamente: `pnpm test`
- Cobertura base ≥50%

---

### FASE 1: Resolución F-004 – Contratos Oficiales (8h)

**Prioridad:** P0 (CRÍTICA)

#### 1.1 Discovery de Contratos Dispersos (2h)

**Test primero:**

```typescript
describe('Contract Discovery', () => {
  it('should locate all ROUTER contract versions', async () => {
    const locations = await findContractVersions('ROUTER');
    expect(locations.length).toBeGreaterThan(0);
    expect(locations).toContainLocation('docs/API/ROUTER.md');
  });
});
```

**Tareas:**

- Ejecutar búsqueda exhaustiva: `find . -name '*ROUTER*.md' -o -name '*DAEMON*.md'`
- Documentar ubicaciones en `contract-locations.json`
- Comparar versiones con `diff` y registrar divergencias

**Criterio de aceptación:**

- Inventario completo de contratos en todas las ubicaciones
- Matriz de comparación entre versiones

#### 1.2 Consolidación de Contratos (4h)

**Test primero:**

```typescript
describe('Contract Consolidation', () => {
  it('should have exactly one ROUTER.md in docs/skills/', async () => {
    const contracts = await findFiles('docs/skills/ROUTER*.md');
    expect(contracts).toHaveLength(1);
  });

  it('should have valid metadata', async () => {
    const router = await readContract('docs/skills/ROUTER.md');
    expect(router.metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(router.metadata.date).toBeDefined();
    expect(router.metadata.owner).toBeDefined();
  });
});
```

**Tareas:**

- Crear `docs/skills/ROUTER.md` (versión consolidada)
- Crear `docs/skills/DAEMON.md`
- Crear `docs/skills/SKILL-CONTRACT.md`
- Crear `docs/skills/NMLB.md`
- Añadir metadata estándar:
  ```yaml
  ---
  version: 1.4.0
  date: 2025-11-13
  owner: Router Lead
  status: active
  replaces: [docs/API/ROUTER.md, docs/skills/ROUTER-copy.md]
  ---
  ```

**Criterio de aceptación:**

- 4 contratos en `docs/skills/` con metadata válida
- Tests de uniqueness pasan

#### 1.3 Migración y Deprecation (2h)

**Test primero:**

```typescript
describe('Contract Migration', () => {
  it('should mark old contracts as deprecated', async () => {
    const oldContract = await readFile('docs/API/ROUTER.md');
    expect(oldContract).toContain('DEPRECATED');
    expect(oldContract).toContain('docs/skills/ROUTER.md');
  });
});
```

**Tareas:**

- Añadir warning de deprecación en ubicaciones antiguas
- Crear symlinks si es necesario para compatibilidad
- Actualizar referencias en código y docs

**Criterio de aceptación:**

- Contratos antiguos marcan deprecación clara
- No hay referencias rotas

---

### FASE 2: Resolución F-001 – Ecosistema PM2 (3h)

**Prioridad:** P1

#### 2.1 Análisis de Uso (1h)

**Test primero:**

```typescript
describe('PM2 Configuration', () => {
  it('should have only one active ecosystem file', async () => {
    const ecosystems = await findFiles('**/*ecosystem*.{js,cjs}');
    const active = ecosystems.filter(f => !f.includes('old'));
    expect(active).toHaveLength(1);
  });
});
```

**Tareas:**

- Buscar referencias a `router-ecosystem-old.cjs` en código
- Verificar en logs de producción
- Consultar con Router Lead

**Criterio de aceptación:**

- Documento de decisión sobre si eliminar o archivar

#### 2.2 Remediación (2h)

**Opción A: Eliminar**

```bash
git rm packages/router/scripts/pm2/router-ecosystem-old.cjs
```

**Opción B: Archivar**

```bash
mkdir -p archived/pm2/2025-11
git mv packages/router/scripts/pm2/router-ecosystem-old.cjs \
       archived/pm2/2025-11/router-ecosystem-old.cjs
```

**Criterio de aceptación:**

- Tests de PM2 uniqueness pasan
- No referencias rotas

---

### FASE 3: Resolución F-002 – Contrato ROUTER Duplicado (2h)

**Prioridad:** P1

**Test primero:**

```typescript
describe('ROUTER Contract Uniqueness', () => {
  it('should not have ROUTER-copy.md', async () => {
    const copyExists = await fileExists('docs/skills/ROUTER-copy.md');
    expect(copyExists).toBe(false);
  });
});
```

**Tareas:**

- Comparar `ROUTER.md` vs `ROUTER-copy.md` (diff detallado)
- Incorporar cambios válidos a versión consolidada
- Archivar o eliminar copia

**Criterio de aceptación:**

- Solo existe `docs/skills/ROUTER.md`
- Cambios válidos incorporados

---

### FASE 4: Resolución F-003 – Skill Obsoleto (2h)

**Prioridad:** P2

**Test primero:**

```typescript
describe('Obsolete Skills', () => {
  it('should not have skills with -old suffix', async () => {
    const oldSkills = await findFiles('skills/**/*-old/**/SKILL.md');
    expect(oldSkills).toHaveLength(0);
  });
});
```

**Tareas:**

- Verificar si `backend-dev-old` está en `registry/index.json`
- Buscar referencias en código
- Archivar en `archived/skills/2025-11/`

**Criterio de aceptación:**

- No skills con sufijo `-old` en `skills/`
- Registry actualizado

---

### FASE 5: Automatización y Prevention (8h)

**Prioridad:** P1

#### 5.1 Scripts de Verificación (4h)

**Test primero:**

```typescript
describe('Audit Automation', () => {
  it('should detect contract duplicates automatically', async () => {
    const result = await runAudit('contract-duplicates');
    expect(result.violations).toHaveLength(0);
  });
});
```

**Tareas:**

- Crear `scripts/audit/verify-contracts.ts`
- Crear `scripts/audit/detect-obsolete.ts`
- Crear `scripts/audit/validate-registry.ts`

**Entregables:**

```bash
pnpm audit:contracts    # Verifica contratos
pnpm audit:obsolete     # Detecta artefactos obsoletos
pnpm audit:registry     # Valida skills registry
pnpm audit:all          # Ejecuta todos
```

#### 5.2 Integración CI/CD (4h)

**GitHub Actions workflow:**

```yaml
name: Skills Core Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test:contracts
      - run: pnpm audit:all
      - name: Quality Gate
        run: |
          if [ $? -ne 0 ]; then
            echo "Quality gate failed"
            exit 1
          fi
```

**Criterio de aceptación:**

- Pipeline ejecuta en cada PR
- Quality gates bloquean merge si fallan

---

### FASE 6: Documentación y Cierre (5h)

**Prioridad:** P1

#### 6.1 Actualización de Documentación (3h)

**Tareas:**

- Actualizar `README.md` con nueva estructura de contratos
- Documentar proceso de auditoría en `docs/processes/audit-workflow.md`
- Crear guía de contribución con quality gates
- Actualizar `presprint.md` con lecciones aprendidas

#### 6.2 Métricas Finales (2h)

**Comparación pre/post:**

```json
{
  "before": {
    "contratos_duplicados": 2,
    "artefactos_obsoletos": 2,
    "contratos_dispersos": 4,
    "debt_score": 7.5
  },
  "after": {
    "contratos_duplicados": 0,
    "artefactos_obsoletos": 0,
    "contratos_dispersos": 0,
    "debt_score": 0.0
  }
}
```

**Entregables:**

- [ ] Métricas finales en `metrics-final-2025-11-13.json`
- [ ] Informe de cierre en `presprint.md`
- [ ] Snapshot MemTech guardado

---

## Quality Gates Globales

### Pre-merge Checks

```yaml
quality_gates:
  - name: 'All Tests Pass'
    command: 'pnpm test'
    blocking: true

  - name: 'Contract Audit'
    command: 'pnpm audit:contracts'
    blocking: true

  - name: 'No Obsolete Artifacts'
    command: 'pnpm audit:obsolete'
    blocking: true

  - name: 'Code Coverage'
    threshold: 80
    blocking: true

  - name: 'Documentation Updated'
    files: ['README.md', 'docs/skills/*.md']
    blocking: false
```

### Post-merge Validation

- Smoke tests en staging
- Verificación de symlinks
- Validación de referencias cruzadas

---

## Riesgos y Mitigaciones

| Riesgo                                  | Probabilidad | Impacto | Mitigación                                |
| --------------------------------------- | ------------ | ------- | ----------------------------------------- |
| Contrato consolidado pierde información | Media        | Alto    | Diff exhaustivo antes de consolidar       |
| Referencias rotas post-eliminación      | Alta         | Medio   | Tests de integridad + symlinks temporales |
| Stakeholders no disponibles             | Media        | Alto    | Decisiones documentadas + async review    |
| CI/CD rompe workflows existentes        | Baja         | Alto    | Feature flags + rollback plan             |

---

## Métricas de Éxito

### Métricas Técnicas

- ✅ Test coverage ≥80%
- ✅ 0 contratos duplicados
- ✅ 0 artefactos obsoletos
- ✅ 100% skills en registry
- ✅ CI/CD con quality gates activos

### Métricas de Proceso

- ✅ Tiempo de auditoría: ≤2h (automatizado)
- ✅ Tiempo de remediación: ≤8h para hallazgos P0
- ✅ 100% hallazgos con owner y fecha

### Métricas de Calidad

- ✅ 0 incidentes por contratos desactualizados (90 días post-remediación)
- ✅ 100% nuevos contratos siguen plantilla estándar
- ✅ Drift detection activo en CI/CD

---

## Roadmap de Ejecución

```
Semana 1 (13-17 Nov)
├─ FASE 0: Testing Framework          [Día 1]
├─ FASE 1: F-004 Contratos            [Día 2-3]
└─ FASE 2: F-001 PM2                  [Día 3]

Semana 2 (18-22 Nov)
├─ FASE 3: F-002 ROUTER Copy          [Día 4]
├─ FASE 4: F-003 Skill Obsoleto       [Día 4]
├─ FASE 5: Automatización             [Día 5-6]
└─ FASE 6: Documentación              [Día 7]
```

---

## Criterios de Cierre

El plan se considera completado cuando:

1. ✅ Todos los tests pasan (incluyendo E2E)
2. ✅ Quality gates integrados en CI/CD
3. ✅ Todos los hallazgos marcados como "resolved"
4. ✅ Documentación actualizada y revisada
5. ✅ Métricas finales publicadas
6. ✅ Presprint completado con lecciones aprendadas
7. ✅ Snapshot MemTech guardado

---

## Referencias

- Informe técnico: `informe-activacion-skills.md`
- Hallazgos: `hallazgos.json`
- Métricas: `metrics-2025-11-13.json`
- Contexto completo: `context.md`
- Tareas detalladas: `tasks.md`
