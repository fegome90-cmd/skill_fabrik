# Tasks – Auditoría Skills Core 2025Q4

## Metadata

```yaml
task_set_id: auditoria-skills-core-2025q4-tasks
version: 1.0.0
parent_plan: plan.md
context_doc: context.md
total_estimated_hours: 40h
task_granularity: 15-30min per task
anti_drift: true
```

---

## Índice de Tareas por Fase

- [FASE 0: Testing Framework](#fase-0-testing-framework-4h) (14 tareas)
- [FASE 1: F-004 Contratos Oficiales](#fase-1-f-004-contratos-oficiales-8h) (24 tareas)
- [FASE 2: F-001 Ecosistema PM2](#fase-2-f-001-ecosistema-pm2-3h) (10 tareas)
- [FASE 3: F-002 Contrato ROUTER Duplicado](#fase-3-f-002-contrato-router-duplicado-2h) (8 tareas)
- [FASE 4: F-003 Skill Obsoleto](#fase-4-f-003-skill-obsoleto-2h) (8 tareas)
- [FASE 5: Automatización](#fase-5-automatización-8h) (16 tareas)
- [FASE 6: Documentación y Cierre](#fase-6-documentación-y-cierre-5h) (12 tareas)

**Total:** 92 mini-tasks | 40h estimadas

---

## FASE 0: Testing Framework (4h)

**Objetivo:** Configurar infraestructura de testing y quality gates base.

### 0.1 Configuración Inicial

#### T0.1.1 - Instalar framework de testing (15min)

```bash
# Working directory: /Users/felipe/Developer/skills-fabrik
pnpm add -D vitest @vitest/ui
```

- [ ] Ejecutar comando
- [ ] Verificar instalación: `pnpm vitest --version`
- [ ] Commit: `chore: add vitest testing framework`

#### T0.1.2 - Crear configuración de Vitest (15min)

```bash
# Archivo: vitest.config.ts (root)
```

- [ ] Crear `vitest.config.ts` con config base
- [ ] Incluir coverage reporter (istanbul)
- [ ] Configurar include: `tests/**/*.test.ts`
- [ ] Commit: `chore: configure vitest with coverage`

#### T0.1.3 - Crear estructura de directorios (10min)

```bash
mkdir -p tests/{contracts,artifacts,integration,e2e}
mkdir -p scripts/audit
```

- [ ] Ejecutar comando
- [ ] Crear `.gitkeep` en cada directorio
- [ ] Commit: `chore: create test directory structure`

#### T0.1.4 - Añadir scripts npm (10min)

```json
// En package.json (root)
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "audit:contracts": "node scripts/audit/verify-contracts.ts",
    "audit:obsolete": "node scripts/audit/detect-obsolete.ts",
    "audit:registry": "node scripts/audit/validate-registry.ts",
    "audit:all": "pnpm audit:contracts && pnpm audit:obsolete && pnpm audit:registry"
  }
}
```

- [ ] Añadir scripts
- [ ] Verificar: `pnpm test --version`
- [ ] Commit: `chore: add audit and test scripts`

---

### 0.2 Tests de Contratos

#### T0.2.1 - Test: contract-existence.test.ts (30min)

```typescript
// tests/contracts/contract-existence.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

describe('Contract Existence', () => {
  const CONTRACTS_DIR = path.join(__dirname, '../../docs/skills');
  const REQUIRED_CONTRACTS = ['ROUTER.md', 'DAEMON.md', 'SKILL-CONTRACT.md'];

  it('should have docs/skills directory', async () => {
    const exists = await fs
      .access(CONTRACTS_DIR)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  REQUIRED_CONTRACTS.forEach(contract => {
    it(`should have ${contract} in docs/skills/`, async () => {
      const contractPath = path.join(CONTRACTS_DIR, contract);
      const exists = await fs
        .access(contractPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });
  });
});
```

- [ ] Crear archivo
- [ ] Ejecutar: `pnpm test contract-existence`
- [ ] Verificar que FALLA (contratos no existen aún)
- [ ] Commit: `test: add contract existence tests (failing)`

#### T0.2.2 - Test: contract-uniqueness.test.ts (30min)

```typescript
// tests/contracts/contract-uniqueness.test.ts
import { describe, it, expect } from 'vitest';
import { glob } from 'glob';

describe('Contract Uniqueness', () => {
  it('should have exactly one ROUTER contract in docs/skills/', async () => {
    const files = await glob('docs/skills/ROUTER*.md');
    expect(files).toHaveLength(1);
    expect(files[0]).toBe('docs/skills/ROUTER.md');
  });

  it('should not have contracts with -copy suffix', async () => {
    const copies = await glob('docs/skills/*-copy.md');
    expect(copies).toHaveLength(0);
  });
});
```

- [ ] Crear archivo
- [ ] Ejecutar test (debe FALLAR por duplicados)
- [ ] Commit: `test: add contract uniqueness tests (failing)`

#### T0.2.3 - Test: contract-metadata.test.ts (30min)

```typescript
// tests/contracts/contract-metadata.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import matter from 'gray-matter';

describe('Contract Metadata', () => {
  it('ROUTER.md should have valid metadata', async () => {
    const content = await fs.readFile('docs/skills/ROUTER.md', 'utf-8');
    const { data } = matter(content);

    expect(data.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(data.date).toBeDefined();
    expect(data.owner).toBeDefined();
    expect(data.status).toBe('active');
  });
});
```

- [ ] Instalar: `pnpm add -D gray-matter`
- [ ] Crear archivo
- [ ] Ejecutar test (debe FALLAR)
- [ ] Commit: `test: add contract metadata validation (failing)`

---

### 0.3 Tests de Artefactos Obsoletos

#### T0.3.1 - Test: obsolete-detection.test.ts (30min)

```typescript
// tests/artifacts/obsolete-detection.test.ts
import { describe, it, expect } from 'vitest';
import { glob } from 'glob';

describe('Obsolete Artifact Detection', () => {
  const OBSOLETE_PATTERNS = ['*-old*', '*-copy*', '*-backup*', '*-deprecated*'];

  it('should not have files with -old suffix', async () => {
    const oldFiles = await glob('**/*-old*/**', {
      ignore: ['node_modules/**', 'dist/**', '.sf/**', 'archived/**'],
    });
    expect(oldFiles).toHaveLength(0);
  });

  it('should not have PM2 ecosystem duplicates', async () => {
    const ecosystems = await glob('**/pm2/*ecosystem*.{js,cjs}');
    const activeEcosystems = ecosystems.filter(f => !f.includes('old'));
    expect(activeEcosystems.length).toBeLessThanOrEqual(1);
  });
});
```

- [ ] Crear archivo
- [ ] Ejecutar test (debe FALLAR por F-001, F-003)
- [ ] Commit: `test: add obsolete artifact detection (failing)`

#### T0.3.2 - Test: skills-registry.test.ts (30min)

```typescript
// tests/artifacts/skills-registry.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import { glob } from 'glob';

describe('Skills Registry Sync', () => {
  it('should have all SKILL.md files registered', async () => {
    const skillFiles = await glob('skills/**/SKILL.md', {
      ignore: ['**/node_modules/**', '**/*-old/**'],
    });

    const registry = JSON.parse(await fs.readFile('skills/registry/index.json', 'utf-8'));

    // Cada SKILL.md debe tener entrada en registry
    for (const skillPath of skillFiles) {
      const skillId = skillPath.split('/')[1]; // e.g., skills/my-skill/SKILL.md -> my-skill
      const registered = registry.skills.some((s: any) => s.id === skillId);
      expect(registered).toBe(true);
    }
  });
});
```

- [ ] Crear archivo
- [ ] Ejecutar test
- [ ] Commit: `test: add skills registry sync validation`

---

### 0.4 Quality Gates

#### T0.4.1 - Crear script de quality gate (30min)

```bash
# scripts/quality-gate.sh
#!/bin/bash
set -e

echo "🔍 Running quality gates..."

echo "1️⃣ Contract uniqueness..."
pnpm test contract-uniqueness

echo "2️⃣ Obsolete artifacts..."
pnpm test obsolete-detection

echo "3️⃣ Test coverage..."
pnpm test:coverage --reporter=json --reporter=text

echo "✅ All quality gates passed!"
```

- [ ] Crear archivo
- [ ] Hacer ejecutable: `chmod +x scripts/quality-gate.sh`
- [ ] Commit: `chore: add quality gate script`

#### T0.4.2 - Documentar quality gates (15min)

```markdown
# docs/processes/quality-gates.md
```

- [ ] Crear documento explicando cada gate
- [ ] Incluir cómo ejecutar: `./scripts/quality-gate.sh`
- [ ] Commit: `docs: add quality gates documentation`

---

### 0.5 Baseline y Cierre de Fase

#### T0.5.1 - Ejecutar test suite completo (15min)

```bash
pnpm test
```

- [ ] Ejecutar todos los tests
- [ ] Capturar output en `tests/baseline-output.txt`
- [ ] Documentar tests que fallan (esperado)
- [ ] Commit: `test: capture baseline test results`

#### T0.5.2 - Actualizar métricas de FASE 0 (15min)

```json
// metrics-2025-11-13.json
{
  "phase_0": {
    "tests_created": 8,
    "tests_passing": 2,
    "tests_failing": 6,
    "coverage": "25%",
    "quality_gates": 4
  }
}
```

- [ ] Actualizar archivo de métricas
- [ ] Commit: `metrics: add phase 0 completion metrics`

---

## FASE 1: F-004 Contratos Oficiales (8h)

**Objetivo:** Localizar, consolidar y crear contratos oficiales en `docs/skills/`.

### 1.1 Discovery de Contratos Dispersos

#### T1.1.1 - Buscar todas las versiones de ROUTER (15min)

```bash
find . -name '*ROUTER*.md' -not -path '*/node_modules/*' \
  | tee docs/inventario/2025Q4/contract-locations-ROUTER.txt
```

- [ ] Ejecutar comando
- [ ] Revisar resultados
- [ ] Documentar ubicaciones encontradas
- [ ] Commit: `audit: locate all ROUTER contract versions`

#### T1.1.2 - Buscar DAEMON contracts (15min)

```bash
find . -name '*DAEMON*.md' -not -path '*/node_modules/*' \
  | tee docs/inventario/2025Q4/contract-locations-DAEMON.txt
```

- [ ] Ejecutar comando
- [ ] Documentar resultados
- [ ] Commit: `audit: locate DAEMON contract versions`

#### T1.1.3 - Buscar SKILL-CONTRACT (15min)

```bash
find . -name '*SKILL*CONTRACT*.md' -o -name 'SKILL.md' -path '*/docs/*' \
  | tee docs/inventario/2025Q4/contract-locations-SKILL.txt
```

- [ ] Ejecutar comando
- [ ] Documentar resultados
- [ ] Commit: `audit: locate SKILL contract versions`

#### T1.1.4 - Comparar versiones de ROUTER (30min)

```bash
# Si existen múltiples versiones
diff -u docs/API/ROUTER.md docs/skills/ROUTER-copy.md \
  > docs/inventario/2025Q4/ROUTER-diff.txt
```

- [ ] Ejecutar diff entre versiones
- [ ] Analizar diferencias significativas
- [ ] Documentar cambios que deben incorporarse
- [ ] Commit: `audit: compare ROUTER contract versions`

#### T1.1.5 - Crear matriz de comparación (30min)

```markdown
# docs/inventario/2025Q4/contract-comparison-matrix.md

| Contrato | Ubicación                  | Versión | Fecha      | Estado    | Notas    |
| -------- | -------------------------- | ------- | ---------- | --------- | -------- |
| ROUTER   | docs/API/ROUTER.md         | 1.3     | 2025-04-12 | Disperso  | Original |
| ROUTER   | docs/skills/ROUTER-copy.md | ?       | 2025-05-10 | Duplicado | Cambios? |
| DAEMON   | ?                          | ?       | ?          | Ausente   | Buscar   |
```

- [ ] Crear documento
- [ ] Completar tabla con hallazgos
- [ ] Commit: `audit: create contract comparison matrix`

#### T1.1.6 - Validar con Router Lead (30min)

- [ ] Compartir matriz de comparación
- [ ] Preguntar sobre diferencias en ROUTER-copy
- [ ] Confirmar qué versión es correcta
- [ ] Documentar decisiones en `hallazgos.json`

---

### 1.2 Consolidación de ROUTER.md

#### T1.2.1 - Crear ROUTER.md consolidado (45min)

```markdown
---
version: 1.4.0
date: 2025-11-13
owner: Router Lead
status: active
replaces:
  - docs/API/ROUTER.md
  - docs/skills/ROUTER-copy.md
changelog:
  - 1.4.0 (2025-11-13): Consolidación oficial, incorpora cambios de ROUTER-copy
  - 1.3.0 (2025-04-12): Versión original
---

# Router Contract

[Contenido consolidado aquí]
```

- [ ] Crear `docs/skills/ROUTER.md`
- [ ] Incorporar metadata estándar
- [ ] Fusionar cambios válidos de ROUTER-copy
- [ ] Commit: `docs: create consolidated ROUTER.md contract`

#### T1.2.2 - Test: Verificar ROUTER.md existe (10min)

```bash
pnpm test contract-existence -- --grep "ROUTER"
```

- [ ] Ejecutar test
- [ ] Verificar que pasa
- [ ] Commit: `test: verify ROUTER.md existence (passing)`

#### T1.2.3 - Test: Verificar metadata (10min)

```bash
pnpm test contract-metadata -- --grep "ROUTER"
```

- [ ] Ejecutar test
- [ ] Verificar version, date, owner, status
- [ ] Commit: `test: verify ROUTER.md metadata (passing)`

---

### 1.3 Consolidación de DAEMON.md

#### T1.3.1 - Consultar con Daemon Lead (30min)

- [ ] Preguntar si existe contrato DAEMON
- [ ] Solicitar contenido si existe versión no documentada
- [ ] Definir alcance del contrato si no existe

#### T1.3.2 - Crear DAEMON.md (45min)

```markdown
---
version: 1.0.0
date: 2025-11-13
owner: Daemon Lead
status: active
---

# Daemon Contract

## Overview

El Daemon es un proceso persistente que...

[Contenido completo]
```

- [ ] Crear `docs/skills/DAEMON.md`
- [ ] Incluir: API, lifecycle, configuración
- [ ] Commit: `docs: create DAEMON.md contract`

#### T1.3.3 - Test: Verificar DAEMON.md (10min)

```bash
pnpm test contract-existence -- --grep "DAEMON"
```

- [ ] Ejecutar test
- [ ] Verificar que pasa
- [ ] Commit: `test: verify DAEMON.md existence (passing)`

---

### 1.4 Consolidación de SKILL-CONTRACT.md

#### T1.4.1 - Consultar con Skills Curator (30min)

- [ ] Revisar estructura actual de SKILL.md
- [ ] Definir elementos obligatorios en contrato
- [ ] Acordar formato de metadata

#### T1.4.2 - Crear SKILL-CONTRACT.md (60min)

````markdown
---
version: 2.0.0
date: 2025-11-13
owner: Skills Curator
status: active
---

# Skill Contract

## Metadata Required

Todos los SKILL.md deben incluir:

```yaml
---
id: skill-name
version: 1.0.0
category: core | guidelines | experimental
owner: Owner Name
status: active | deprecated
---
```
````

[Resto del contrato]

````
- [ ] Crear `docs/skills/SKILL-CONTRACT.md`
- [ ] Definir estructura obligatoria
- [ ] Incluir ejemplos
- [ ] Commit: `docs: create SKILL-CONTRACT.md`

#### T1.4.3 - Test: Verificar SKILL-CONTRACT.md (10min)
```bash
pnpm test contract-existence -- --grep "SKILL-CONTRACT"
````

- [ ] Ejecutar test
- [ ] Commit: `test: verify SKILL-CONTRACT.md (passing)`

---

### 1.5 Migración y Deprecación

#### T1.5.1 - Marcar docs/API/ROUTER.md como deprecated (20min)

```markdown
<!-- docs/API/ROUTER.md -->

> ⚠️ **DEPRECATED**: Este documento ha sido reemplazado por [`docs/skills/ROUTER.md`](../skills/ROUTER.md)
>
> Por favor, consulta la nueva ubicación para la versión oficial y actualizada.
```

- [ ] Añadir warning al inicio del archivo
- [ ] Incluir link a versión oficial
- [ ] Commit: `docs: deprecate old ROUTER.md location`

#### T1.5.2 - Crear symlink para compatibilidad (15min)

```bash
# Opcional: si hay muchas referencias
cd docs/API
ln -s ../skills/ROUTER.md ROUTER.md
```

- [ ] Evaluar si es necesario
- [ ] Crear symlink si procede
- [ ] Documentar en `contract-migration-notes.md`
- [ ] Commit: `docs: add symlink for ROUTER.md compatibility`

#### T1.5.3 - Actualizar referencias en código (45min)

```bash
rg "docs/API/ROUTER" --type ts --type md -l
```

- [ ] Buscar referencias a ubicación antigua
- [ ] Actualizar imports/links
- [ ] Verificar que nada se rompe
- [ ] Commit: `refactor: update ROUTER contract references`

#### T1.5.4 - Test: Verificar no hay referencias rotas (20min)

```typescript
// tests/integration/contract-references.test.ts
it('should not have broken contract references', async () => {
  // Buscar links a contratos en markdown
  // Verificar que todos apuntan a docs/skills/
});
```

- [ ] Crear test
- [ ] Ejecutar
- [ ] Commit: `test: verify no broken contract references`

---

### 1.6 Cierre de F-004

#### T1.6.1 - Ejecutar test suite de contratos (15min)

```bash
pnpm test tests/contracts/
```

- [ ] Ejecutar todos los tests de contratos
- [ ] Verificar que todos pasan
- [ ] Capturar output

#### T1.6.2 - Actualizar hallazgos.json (15min)

```json
{
  "id": "F-004",
  "status": "resolved",
  "resolution_date": "2025-11-XX",
  "resolution_notes": "Contratos consolidados en docs/skills/ con metadata estándar"
}
```

- [ ] Actualizar status
- [ ] Añadir notas de resolución
- [ ] Commit: `audit: resolve F-004 - contracts consolidated`

#### T1.6.3 - Actualizar métricas (15min)

```json
{
  "phase_1": {
    "contracts_created": 4,
    "contracts_consolidated": 2,
    "tests_passing": 14,
    "debt_score": 2.5
  }
}
```

- [ ] Actualizar `metrics-2025-11-13.json`
- [ ] Commit: `metrics: add phase 1 completion metrics`

---

## FASE 2: F-001 Ecosistema PM2 (3h)

**Objetivo:** Resolver duplicado de configuración PM2.

### 2.1 Análisis de Uso

#### T2.1.1 - Buscar referencias en código (20min)

```bash
rg "router-ecosystem-old" --type ts --type js -n
```

- [ ] Ejecutar búsqueda
- [ ] Documentar resultados en `F-001-analysis.md`
- [ ] Commit: `audit: search for PM2 old ecosystem references`

#### T2.1.2 - Revisar logs de producción (30min)

- [ ] Consultar con Router Lead sobre uso en prod
- [ ] Verificar si `router-ecosystem-old.cjs` está en uso
- [ ] Documentar hallazgos

#### T2.1.3 - Comparar ecosystems (20min)

```bash
diff -u packages/router/scripts/pm2/router-ecosystem.cjs \
        packages/router/scripts/pm2/router-ecosystem-old.cjs \
  > docs/inventario/2025Q4/pm2-ecosystem-diff.txt
```

- [ ] Ejecutar diff
- [ ] Analizar diferencias
- [ ] Documentar cambios significativos
- [ ] Commit: `audit: compare PM2 ecosystem configurations`

#### T2.1.4 - Decisión con Router Lead (20min)

- [ ] Presentar análisis
- [ ] Preguntar: ¿Eliminar o archivar?
- [ ] Documentar decisión en `hallazgos.json`

---

### 2.2 Remediación

#### T2.2.1 - Test: Verificar PM2 uniqueness (15min)

```typescript
// tests/artifacts/pm2-config.test.ts
it('should have only one active PM2 ecosystem', async () => {
  const ecosystems = await glob('**/pm2/*ecosystem*.{js,cjs}');
  const active = ecosystems.filter(f => !f.includes('old') && !f.includes('archived'));
  expect(active).toHaveLength(1);
});
```

- [ ] Crear test
- [ ] Ejecutar (debe FALLAR)
- [ ] Commit: `test: add PM2 ecosystem uniqueness test (failing)`

#### T2.2.2 - Archivar o eliminar (30min)

**Opción A: Archivar**

```bash
mkdir -p archived/pm2/2025-11
git mv packages/router/scripts/pm2/router-ecosystem-old.cjs \
       archived/pm2/2025-11/router-ecosystem-old.cjs
```

**Opción B: Eliminar**

```bash
git rm packages/router/scripts/pm2/router-ecosystem-old.cjs
```

- [ ] Ejecutar opción elegida
- [ ] Commit: `refactor: remove PM2 old ecosystem [F-001]`

#### T2.2.3 - Verificar test pasa (10min)

```bash
pnpm test pm2-config
```

- [ ] Ejecutar test
- [ ] Verificar que pasa
- [ ] Commit: `test: verify PM2 uniqueness (passing)`

#### T2.2.4 - Actualizar hallazgos.json (10min)

```json
{
  "id": "F-001",
  "status": "resolved",
  "resolution_date": "2025-11-XX",
  "resolution_action": "archived" // o "deleted"
}
```

- [ ] Actualizar status
- [ ] Commit: `audit: resolve F-001 - PM2 duplicate removed`

---

## FASE 3: F-002 Contrato ROUTER Duplicado (2h)

**Objetivo:** Eliminar `ROUTER-copy.md` tras incorporar cambios válidos.

### 3.1 Análisis de Duplicado

#### T3.1.1 - Comparar versiones detalladamente (30min)

```bash
diff -u docs/skills/ROUTER.md docs/skills/ROUTER-copy.md \
  > docs/inventario/2025Q4/ROUTER-copy-diff.txt
```

- [ ] Ejecutar diff
- [ ] Identificar secciones diferentes
- [ ] Marcar cambios que deben incorporarse
- [ ] Commit: `audit: detailed diff of ROUTER vs ROUTER-copy`

#### T3.1.2 - Validar con Router Lead (20min)

- [ ] Compartir diff
- [ ] Confirmar qué cambios son válidos
- [ ] Documentar decisiones

---

### 3.2 Incorporación de Cambios

#### T3.2.1 - Incorporar cambios válidos a ROUTER.md (30min)

- [ ] Aplicar cambios identificados
- [ ] Actualizar version: `1.4.0` → `1.5.0`
- [ ] Actualizar date y changelog
- [ ] Commit: `docs: incorporate valid changes from ROUTER-copy [F-002]`

#### T3.2.2 - Test: Verificar uniqueness (10min)

```bash
pnpm test contract-uniqueness -- --grep "ROUTER"
```

- [ ] Ejecutar test (debe FALLAR aún)
- [ ] Confirmar que detecta ROUTER-copy.md

---

### 3.3 Eliminación de Duplicado

#### T3.3.1 - Eliminar ROUTER-copy.md (10min)

```bash
git rm docs/skills/ROUTER-copy.md
```

- [ ] Ejecutar comando
- [ ] Commit: `refactor: remove ROUTER-copy.md duplicate [F-002]`

#### T3.3.2 - Verificar test pasa (10min)

```bash
pnpm test contract-uniqueness
```

- [ ] Ejecutar test
- [ ] Verificar que pasa
- [ ] Commit: `test: verify contract uniqueness (passing)`

#### T3.3.3 - Actualizar hallazgos.json (10min)

```json
{
  "id": "F-002",
  "status": "resolved",
  "resolution_date": "2025-11-XX",
  "resolution_notes": "Cambios válidos incorporados a ROUTER.md v1.5.0, duplicado eliminado"
}
```

- [ ] Actualizar status
- [ ] Commit: `audit: resolve F-002 - ROUTER duplicate removed`

---

## FASE 4: F-003 Skill Obsoleto (2h)

**Objetivo:** Archivar `backend-dev-old` skill.

### 4.1 Análisis de Skill

#### T4.1.1 - Verificar registry (15min)

```bash
cat skills/registry/index.json | jq '.skills[] | select(.id=="backend-dev-old")'
```

- [ ] Ejecutar comando
- [ ] Confirmar que NO está registrado
- [ ] Documentar resultado

#### T4.1.2 - Buscar referencias (20min)

```bash
rg "backend-dev-old" --type ts --type md -n
```

- [ ] Buscar referencias en código
- [ ] Buscar menciones en docs
- [ ] Documentar hallazgos
- [ ] Commit: `audit: search for backend-dev-old references`

#### T4.1.3 - Comparar con versión actual (20min)

```bash
diff -r skills/guidelines/backend-dev/ \
        skills/guidelines/backend-dev-old/ \
  > docs/inventario/2025Q4/backend-dev-comparison.txt
```

- [ ] Ejecutar diff
- [ ] Verificar si `-old` tiene cambios únicos
- [ ] Documentar diferencias

---

### 4.2 Archivo de Skill

#### T4.2.1 - Crear directorio archived (10min)

```bash
mkdir -p archived/skills/2025-11
```

- [ ] Crear directorio
- [ ] Añadir README explicando propósito
- [ ] Commit: `chore: create archived/skills directory`

#### T4.2.2 - Mover skill a archived (15min)

```bash
git mv skills/guidelines/backend-dev-old \
       archived/skills/2025-11/backend-dev-old
```

- [ ] Ejecutar comando
- [ ] Commit: `refactor: archive backend-dev-old skill [F-003]`

#### T4.2.3 - Test: Verificar no obsolete artifacts (10min)

```bash
pnpm test obsolete-detection
```

- [ ] Ejecutar test
- [ ] Verificar que pasa
- [ ] Commit: `test: verify no obsolete skills (passing)`

#### T4.2.4 - Actualizar hallazgos.json (10min)

```json
{
  "id": "F-003",
  "status": "resolved",
  "resolution_date": "2025-11-XX",
  "resolution_action": "archived to archived/skills/2025-11/"
}
```

- [ ] Actualizar status
- [ ] Commit: `audit: resolve F-003 - obsolete skill archived`

---

## FASE 5: Automatización (8h)

**Objetivo:** Crear scripts de auditoría y quality gates en CI/CD.

### 5.1 Script: verify-contracts.ts

#### T5.1.1 - Crear estructura base (30min)

```typescript
// scripts/audit/verify-contracts.ts
import { glob } from 'glob';
import fs from 'fs/promises';
import matter from 'gray-matter';

interface ContractIssue {
  type: 'missing' | 'duplicate' | 'invalid_metadata';
  contract: string;
  details: string;
}

async function verifyContracts(): Promise<ContractIssue[]> {
  const issues: ContractIssue[] = [];

  // 1. Verificar existencia
  // 2. Verificar uniqueness
  // 3. Verificar metadata

  return issues;
}

// Main
const issues = await verifyContracts();
if (issues.length > 0) {
  console.error('❌ Contract issues found:');
  issues.forEach(i => console.error(`  - ${i.type}: ${i.contract} - ${i.details}`));
  process.exit(1);
} else {
  console.log('✅ All contracts valid');
}
```

- [ ] Crear archivo base
- [ ] Commit: `feat: create verify-contracts script structure`

#### T5.1.2 - Implementar verificación de existencia (20min)

```typescript
const REQUIRED_CONTRACTS = ['ROUTER.md', 'DAEMON.md', 'SKILL-CONTRACT.md'];

for (const contract of REQUIRED_CONTRACTS) {
  const path = `docs/skills/${contract}`;
  const exists = await fs
    .access(path)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    issues.push({
      type: 'missing',
      contract,
      details: `Contract not found at ${path}`,
    });
  }
}
```

- [ ] Implementar lógica
- [ ] Commit: `feat: add contract existence check`

#### T5.1.3 - Implementar verificación de uniqueness (20min)

```typescript
for (const contract of REQUIRED_CONTRACTS) {
  const baseName = contract.replace('.md', '');
  const variants = await glob(`docs/skills/${baseName}*.md`);

  if (variants.length > 1) {
    issues.push({
      type: 'duplicate',
      contract,
      details: `Found ${variants.length} variants: ${variants.join(', ')}`,
    });
  }
}
```

- [ ] Implementar lógica
- [ ] Commit: `feat: add contract uniqueness check`

#### T5.1.4 - Implementar verificación de metadata (30min)

```typescript
for (const contractPath of await glob('docs/skills/*.md')) {
  const content = await fs.readFile(contractPath, 'utf-8');
  const { data } = matter(content);

  if (!data.version || !data.date || !data.owner || !data.status) {
    issues.push({
      type: 'invalid_metadata',
      contract: contractPath,
      details: `Missing required metadata fields`,
    });
  }

  if (data.version && !/^\d+\.\d+\.\d+$/.test(data.version)) {
    issues.push({
      type: 'invalid_metadata',
      contract: contractPath,
      details: `Invalid version format: ${data.version}`,
    });
  }
}
```

- [ ] Implementar lógica
- [ ] Commit: `feat: add contract metadata validation`

#### T5.1.5 - Test del script (20min)

```bash
node scripts/audit/verify-contracts.ts
```

- [ ] Ejecutar script
- [ ] Verificar output
- [ ] Ajustar si es necesario
- [ ] Commit: `test: verify contracts script works`

---

### 5.2 Script: detect-obsolete.ts

#### T5.2.1 - Crear estructura base (30min)

```typescript
// scripts/audit/detect-obsolete.ts
import { glob } from 'glob';

const OBSOLETE_PATTERNS = ['*-old*', '*-copy*', '*-backup*', '*-deprecated*'];
const IGNORE_PATTERNS = ['node_modules/**', 'dist/**', 'archived/**', '.sf/**'];

async function detectObsolete() {
  const obsolete = [];

  for (const pattern of OBSOLETE_PATTERNS) {
    const files = await glob(`**/${pattern}/**`, { ignore: IGNORE_PATTERNS });
    obsolete.push(...files);
  }

  return obsolete;
}
```

- [ ] Crear archivo
- [ ] Commit: `feat: create detect-obsolete script`

#### T5.2.2 - Implementar detección por patrón (20min)

- [ ] Completar lógica de detección
- [ ] Añadir output formateado
- [ ] Commit: `feat: implement obsolete artifact detection`

#### T5.2.3 - Test del script (15min)

```bash
node scripts/audit/detect-obsolete.ts
```

- [ ] Ejecutar script
- [ ] Verificar que NO encuentra artefactos obsoletos
- [ ] Commit: `test: verify obsolete detection script`

---

### 5.3 Script: validate-registry.ts

#### T5.3.1 - Crear validación de registry (45min)

```typescript
// scripts/audit/validate-registry.ts
import { glob } from 'glob';
import fs from 'fs/promises';

async function validateRegistry() {
  // 1. Leer registry
  const registry = JSON.parse(await fs.readFile('skills/registry/index.json', 'utf-8'));

  // 2. Buscar todos los SKILL.md
  const skillFiles = await glob('skills/**/SKILL.md', {
    ignore: ['**/node_modules/**', '**/*-old/**'],
  });

  // 3. Verificar que todos estén registrados
  const issues = [];
  for (const skillPath of skillFiles) {
    const skillId = skillPath.split('/')[1];
    const registered = registry.skills.some((s: any) => s.id === skillId);

    if (!registered) {
      issues.push(`Skill not registered: ${skillId} (${skillPath})`);
    }
  }

  return issues;
}
```

- [ ] Crear archivo
- [ ] Implementar lógica
- [ ] Commit: `feat: create validate-registry script`

#### T5.3.2 - Test del script (15min)

```bash
node scripts/audit/validate-registry.ts
```

- [ ] Ejecutar
- [ ] Verificar output
- [ ] Commit: `test: verify registry validation script`

---

### 5.4 GitHub Actions Integration

#### T5.4.1 - Crear workflow de auditoría (45min)

```yaml
# .github/workflows/skills-audit.yml
name: Skills Core Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  audit:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run contract verification
        run: pnpm audit:contracts

      - name: Detect obsolete artifacts
        run: pnpm audit:obsolete

      - name: Validate skills registry
        run: pnpm audit:registry

      - name: Run test suite
        run: pnpm test:coverage

      - name: Check coverage threshold
        run: |
          coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$coverage < 80" | bc -l) )); then
            echo "Coverage $coverage% is below 80% threshold"
            exit 1
          fi
```

- [ ] Crear archivo
- [ ] Commit: `ci: add skills audit workflow`

#### T5.4.2 - Crear workflow de quality gate (30min)

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate

on:
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: ./scripts/quality-gate.sh
```

- [ ] Crear archivo
- [ ] Commit: `ci: add quality gate workflow`

#### T5.4.3 - Test workflows localmente (30min)

```bash
# Usar act para testing local
act pull_request -W .github/workflows/quality-gate.yml
```

- [ ] Instalar `act` si es necesario
- [ ] Ejecutar workflow localmente
- [ ] Ajustar si hay errores
- [ ] Commit: `ci: test workflows locally`

#### T5.4.4 - Crear PR de prueba (20min)

- [ ] Crear branch: `feat/test-ci-workflows`
- [ ] Hacer cambio menor
- [ ] Crear PR
- [ ] Verificar que workflows ejecutan
- [ ] Documentar resultados

---

## FASE 6: Documentación y Cierre (5h)

**Objetivo:** Actualizar documentación y completar presprint.

### 6.1 Actualización de Documentación

#### T6.1.1 - Actualizar README principal (30min)

```markdown
# Skills Fabrik

## Contract Documentation

All official contracts are located in `docs/skills/`:

- [ROUTER.md](docs/skills/ROUTER.md) - Router orchestrator contract
- [DAEMON.md](docs/skills/DAEMON.md) - Daemon process contract
- [SKILL-CONTRACT.md](docs/skills/SKILL-CONTRACT.md) - Global skill contract

[Resto del README]
```

- [ ] Actualizar sección de contratos
- [ ] Añadir links a nueva ubicación
- [ ] Commit: `docs: update README with contract locations`

#### T6.1.2 - Crear docs/processes/audit-workflow.md (60min)

```markdown
# Audit Workflow

## Overview

Proceso de auditoría automatizada para Skills Core.

## Frecuencia

- Automática en cada PR (CI/CD)
- Manual mensual (full audit)

## Comandos

\`\`\`bash
pnpm audit:all
\`\`\`

[Guía completa]
```

- [ ] Crear documento
- [ ] Incluir ejemplos
- [ ] Commit: `docs: add audit workflow guide`

#### T6.1.3 - Crear guía de contribución (45min)

```markdown
# docs/CONTRIBUTING.md

## Quality Gates

Before submitting a PR, ensure:

- [ ] All tests pass: `pnpm test`
- [ ] No obsolete artifacts: `pnpm audit:obsolete`
- [ ] Contracts are valid: `pnpm audit:contracts`
- [ ] Coverage ≥80%: `pnpm test:coverage`

[Resto de la guía]
```

- [ ] Crear guía
- [ ] Incluir quality gates
- [ ] Commit: `docs: add contributing guide with quality gates`

#### T6.1.4 - Actualizar docs de skills (30min)

```markdown
# docs/skills/README.md

# Official Contracts

This directory contains the official contracts for Skills Fabrik components.

## Available Contracts

- **ROUTER.md**: Router orchestrator (v1.5.0)
- **DAEMON.md**: Daemon process (v1.0.0)
- **SKILL-CONTRACT.md**: Global skill contract (v2.0.0)

## Contract Structure

All contracts follow this metadata format:
\`\`\`yaml

---

version: X.Y.Z
date: YYYY-MM-DD
owner: Component Lead
status: active | deprecated

---

\`\`\`
```

- [ ] Actualizar README
- [ ] Commit: `docs: update skills/README with contract index`

---

### 6.2 Presprint - Lecciones Aprendidas

#### T6.2.1 - Documentar cobertura final (30min)

```markdown
# Presprint · Inventario Skills Core 2025Q4

## Cobertura

- ✅ 100% de packages auditados (daemon, router, tools)
- ✅ 68 skills revisados
- ✅ 4 contratos consolidados
- ✅ 0 artefactos obsoletos residuales
```

- [ ] Completar sección de cobertura
- [ ] Incluir números finales

#### T6.2.2 - Documentar deuda resuelta (30min)

```markdown
## Deuda Resuelta

- ✅ F-004: Contratos consolidados en docs/skills/
- ✅ F-001: Ecosistema PM2 duplicado archivado
- ✅ F-002: Contrato ROUTER duplicado eliminado
- ✅ F-003: Skill obsoleto archivado

**Debt Score:** 7.5 → 0.0 (-100%)
```

- [ ] Completar sección
- [ ] Calcular reducción de deuda

#### T6.2.3 - Documentar lecciones aprendidas (45min)

```markdown
## Lecciones Aprendidas

### Proceso

1. **TDD fue fundamental**: Tests antes de implementación previno regresiones
2. **Triada plan/context/tasks**: Facilitó continuidad y onboarding
3. **Quality gates automatizados**: Detectan drift antes de merge

### Herramientas

1. **PBv2 requiere contexto manual**: Pero genera prompts de alta calidad
2. **Tests de integridad son esenciales**: Detectan inconsistencias temprano
3. **Scripts de auditoría son reutilizables**: Inversión que paga dividendos

### Contratos

1. **SSOT no es negociable**: Dispersión genera drift inevitable
2. **Metadata estándar es crítica**: Version, date, owner, status obligatorios
3. **Duplicados con fechas recientes son peligrosos**: Pueden tener cambios no incorporados
```

- [ ] Completar lecciones
- [ ] Incluir insights específicos

#### T6.2.4 - Documentar próximos pasos (30min)

```markdown
## Próximos Pasos

### Corto plazo (1 mes)

- [ ] Monitorear quality gates en producción
- [ ] Entrenar equipo en nuevo flujo de auditoría
- [ ] Crear dashboard de métricas de calidad

### Mediano plazo (3 meses)

- [ ] Implementar auditoría automática mensual
- [ ] Expandir cobertura de tests (objetivo 90%)
- [ ] Crear plantillas de contratos para nuevos componentes

### Largo plazo (6 meses)

- [ ] Sistema de versionado automático de contratos
- [ ] Integration tests entre contratos e implementaciones
- [ ] Drift detection continuo
```

- [ ] Completar próximos pasos
- [ ] Priorizar acciones

#### T6.2.5 - Documentar riesgos residuales (20min)

```markdown
## Riesgos Residuales

| Riesgo                                    | Probabilidad | Mitigación                            |
| ----------------------------------------- | ------------ | ------------------------------------- |
| Nuevos desarrolladores no siguen guía     | Media        | Training + PR reviews                 |
| Quality gates deshabilitados por urgencia | Baja         | Requiere approval de 2 leads          |
| Contratos desactualizados vs código       | Media        | Integration tests + auditoría mensual |
```

- [ ] Completar riesgos
- [ ] Definir mitigaciones

#### T6.2.6 - Commit final de presprint (10min)

- [ ] Revisar presprint completo
- [ ] Commit: `docs: complete presprint with lessons learned`

---

### 6.3 Métricas Finales

#### T6.3.1 - Generar métricas finales (30min)

```json
// metrics-final-2025-11-13.json
{
  "cycle": "2025Q4",
  "date_start": "2025-11-13",
  "date_end": "2025-11-XX",
  "before": {
    "contracts_duplicated": 2,
    "artifacts_obsolete": 2,
    "contracts_dispersed": 4,
    "debt_score": 7.5,
    "test_coverage": 0,
    "quality_gates": 0
  },
  "after": {
    "contracts_duplicated": 0,
    "artifacts_obsolete": 0,
    "contracts_dispersed": 0,
    "debt_score": 0.0,
    "test_coverage": 85,
    "quality_gates": 4
  },
  "improvement": {
    "debt_reduction": "100%",
    "test_coverage_increase": "+85%",
    "quality_gates_added": 4
  }
}
```

- [ ] Crear archivo de métricas finales
- [ ] Calcular mejoras
- [ ] Commit: `metrics: add final audit metrics`

#### T6.3.2 - Snapshot MemTech (opcional) (20min)

```bash
node packages/skills-cli/dist/index.js plan save auditoria-skills-core-2025q4
```

- [ ] Ejecutar snapshot
- [ ] Documentar ubicación
- [ ] Commit: `chore: create MemTech snapshot of audit`

#### T6.3.3 - Actualizar narrativa final (20min)

```markdown
# skills-core-inventario.md

## Estado actual

- **Descubrimiento**: ✅ Completado
- **Hallazgos**: ✅ 4/4 resueltos
- **Acciones**: ✅ Todas completadas
- **Métricas**: ✅ Debt score 0.0
- **Prompt operativo**: ✅ Tests y quality gates activos
```

- [ ] Actualizar inventario
- [ ] Marcar todo como completado
- [ ] Commit: `docs: update inventory with completion status`

---

### 6.4 Cierre Formal

#### T6.4.1 - Ejecutar test suite completo (20min)

```bash
pnpm test
pnpm test:coverage
pnpm audit:all
```

- [ ] Ejecutar todos los tests
- [ ] Verificar que todos pasan
- [ ] Capturar output

#### T6.4.2 - Ejecutar quality gates (15min)

```bash
./scripts/quality-gate.sh
```

- [ ] Ejecutar script
- [ ] Verificar que todos los gates pasan
- [ ] Documentar resultados

#### T6.4.3 - Crear PR final (30min)

- [ ] Crear branch consolidado: `audit/skills-core-2025q4-complete`
- [ ] Merge de todas las ramas de trabajo
- [ ] Crear PR con resumen ejecutivo
- [ ] Solicitar review de stakeholders

#### T6.4.4 - Celebrar y documentar (15min)

- [ ] Notificar a stakeholders de cierre exitoso
- [ ] Compartir métricas finales
- [ ] Agradecer a colaboradores
- [ ] 🎉

---

## Checklist de Cierre

### Criterios de Éxito Globales

- [ ] ✅ Todos los tests pasan (100%)
- [ ] ✅ Test coverage ≥80%
- [ ] ✅ Quality gates integrados en CI/CD
- [ ] ✅ 4/4 hallazgos marcados como "resolved"
- [ ] ✅ Contratos consolidados en `docs/skills/`
- [ ] ✅ 0 artefactos con sufijos sospechosos
- [ ] ✅ Documentación actualizada
- [ ] ✅ Presprint completado
- [ ] ✅ Métricas finales publicadas
- [ ] ✅ PR aprobado y merged

### Verificación Final

```bash
# Ejecutar este checklist antes de cerrar
pnpm test                      # ✅ Todos los tests pasan
pnpm test:coverage             # ✅ Coverage ≥80%
pnpm audit:all                 # ✅ Cero issues
./scripts/quality-gate.sh      # ✅ Gates pasan
git status                     # ✅ Todo commiteado
```

---

## Notas para Ejecución

### Anti-Drift Strategies

1. **Una tarea a la vez**: No avanzar sin completar tarea actual
2. **Commits frecuentes**: Commit después de cada tarea completada
3. **Tests primero**: Escribir test antes de implementación
4. **Validación inmediata**: Ejecutar test/script después de crearlo
5. **Documentación continua**: Actualizar docs conforme avanzas

### Tiempo Estimado por Tarea

- ⚡ Rápida: 10-15min
- 🏃 Normal: 20-30min
- 🚶 Larga: 45-60min

### Orden de Prioridad

1. **P0 (crítico)**: FASE 1 (F-004) - Contratos oficiales
2. **P1 (alto)**: FASE 2, 3, 5 - PM2, ROUTER, Automatización
3. **P2 (medio)**: FASE 4 - Skill obsoleto
4. **P3 (bajo)**: FASE 6 - Documentación final

### Recuperación de Contexto

Si pierdes contexto durante ejecución:

1. Lee este archivo (`tasks.md`)
2. Revisa `context.md` sección relevante
3. Verifica `hallazgos.json` para ver estado actual
4. Ejecuta `git log --oneline --since="2025-11-13"` para ver progreso

---

## Changelog

| Fecha      | Autor             | Cambio                             |
| ---------- | ----------------- | ---------------------------------- |
| 2025-11-13 | Technical Auditor | Creación inicial con 92 mini-tasks |

---

**Nota final:** Este documento de tareas está diseñado para ejecutarse linealmente, evitando deriva y manteniendo foco. Cada tarea tiene criterios de aceptación claros y tiempo estimado. Sigue el orden sugerido para máxima eficiencia.
