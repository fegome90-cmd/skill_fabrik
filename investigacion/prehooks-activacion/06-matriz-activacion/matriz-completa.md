# Matriz de Activación: Decisión por Tipo de Tarea

## 🎯 **Introducción**

Esta matriz proporciona una guía de decisión rápida para activar las skills correctas basado en el tipo de tarea de sprint, el contexto del proyecto y los objetivos de calidad.

---

## 📊 **Matriz Principal**

### **Por Tipo de Sprint**

| Sprint Type | Skills Primarios | Enforcement | Threshold | Skills Secundarios | Configuración Especial |
|-------------|------------------|-------------|-----------|-------------------|------------------------|
| **Feature Development** | backend-dev, api-design, database-manage | suggest+block | 0.6 | performance-opt, code-review | database-verif: ALWAYS |
| **Bug Fixing** | root-cause, systematic-debug, error-patterns | warn | 0.5 | test-debugging, logging | deep-analysis: ON |
| **Refactoring** | architecture-patterns, error-patterns, code-quality | suggest | 0.6 | performance-opt, testing-guidelines | trace-logging: ENHANCED |
| **Security Audit** | security-testing, secrets-config, database-verif | block+require | 0.4 | compliance-check, audit-guidelines | strict-mode: ENFORCED |
| **Performance** | performance-optimization, backend-arch, caching-strategies | warn | 0.5 | monitoring-setup, metrics-collect | profiling: ENABLED |
| **Testing** | visual-regression, webapp-testing, api-testing | require | 0.5 | test-automation, coverage-analysis | auto-coverage: ON |
| **Migration** | database-migration, data-safety, rollback-strategies | block+require | 0.3 | backup-strategies, validation-testing | dry-run: MANDATORY |

---

## 🎯 **Feature Development**

### **Scenario**: Nueva funcionalidad

```yaml
Sprint Type: "Feature"
Duration: "2-3 semanas"
Team Size: "3-5 desarrolladores"
Priority: "Alta"
```

### **Activación Automática**

```bash
node 08-scripts/activate-sprint.js \
  --type feature \
  --sprint S15 \
  --priority backend,api,database \
  --strict-mode false
```

### **Skills a Activar**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **backend-dev-guidelines** | suggest | 0.6 | Mejores prácticas backend | 5 guías |
| **api-design-and-testing** | suggest | 0.6 | Diseño de APIs | 4 guías |
| **database-management** | require | 0.4 | Gestión de datos | 3 guías |
| **database-verification** | block | 0.2 | **SIEMPRE ACTIVO** | 2 guías |
| **performance-optimization** | warn | 0.5 | Optimización temprana | 3 guías |
| **code-review-checklist** | require | 0.4 | Review obligatorio | 1 checklist |

### **Ejemplo de Prompt y Activación**

**Prompt**: `"Crear API REST para gestión de usuarios con autenticación JWT"`

**Activaciones**:
```
✅ backend-dev-guidelines (score: 0.87)
   → Keywords: api, rest, backend
   → Intent: "crear" + "api" ✓

✅ api-design-and-testing (score: 0.82)
   → Keywords: api, rest, auth
   → Intent: "crear" + "api" ✓

✅ database-management (score: 0.75)
   → Keywords: usuarios, gestión
   → Path: archivos en /api/ ✓

✅ database-verification (score: 0.45)
   → Content: potential deleteMany ✓
   → **BLOQUEADO** hasta revisión

🔍 Total: 4/6 skills activadas
📊 Threshold promedio: 0.36
```

### **Configuración Recomendada**

```json
{
  "profile": "feature-development",
  "skills": [
    "backend-dev-guidelines",
    "api-design-and-testing",
    "database-management",
    "database-verification",
    "performance-optimization",
    "code-review-checklist"
  ],
  "thresholds": {
    "suggest": 0.6,
    "warn": 0.5,
    "require": 0.4,
    "block": 0.2
  },
  "specialConfig": {
    "database-verification": "ALWAYS_ON",
    "code-review": "MANDATORY",
    "performance-monitoring": "ENABLED"
  }
}
```

---

## 🐛 **Bug Fixing**

### **Scenario**: Resolución de errores

```yaml
Sprint Type: "Bug Fix"
Duration: "1-2 semanas"
Team Size: "1-3 desarrolladores"
Priority: "Crítica"
```

### **Activación Automática**

```bash
node 08-scripts/activate-sprint.js \
  --type bugfix \
  --sprint S15 \
  --priority debugging,root-cause \
  --strict-mode false
```

### **Skills a Activar**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **root-cause-tracing** | warn | 0.5 | Análisis profundo | 4 métodos |
| **systematic-debugging** | warn | 0.5 | Metodología sistemática | 5 pasos |
| **error-pattern-standardization** | suggest | 0.6 | Patrones de error | 3 patrones |
| **test-driven-debugging** | warn | 0.5 | Debug con tests | 2 enfoques |
| **logging-best-practices** | suggest | 0.6 | Logging efectivo | 3 estrategias |

### **Ejemplo de Prompt y Activación**

**Prompt**: `"Error 500 en endpoint de login, stack trace muestra null pointer en UserService"`

**Activaciones**:
```
✅ root-cause-tracing (score: 0.78)
   → Keywords: error, stack trace ✓
   → Intent: "error" + "análisis" ✓

✅ systematic-debugging (score: 0.72)
   → Keywords: error 500, endpoint ✓
   → Path: logs/ + error.log ✓

✅ error-pattern-standardization (score: 0.65)
   → Content: "null pointer" pattern ✓

💡 No activadas:
○ test-driven-debugging (score: 0.31 < 0.5)
○ logging-best-practices (score: 0.42 < 0.6)

🔍 Total: 3/5 skills activadas
```

### **Configuración Recomendada**

```json
{
  "profile": "bug-fixing",
  "skills": [
    "root-cause-tracing",
    "systematic-debugging",
    "error-pattern-standardization",
    "test-driven-debugging",
    "logging-best-practices"
  ],
  "thresholds": {
    "suggest": 0.6,
    "warn": 0.5,
    "require": 0.4,
    "block": 0.2
  },
  "specialConfig": {
    "deep-analysis": "ENABLED",
    "trace-logging": "ENHANCED",
    "stack-trace-analysis": "AUTO"
  }
}
```

---

## 🔄 **Refactoring**

### **Scenario**: Mejora de código existente

```yaml
Sprint Type: "Refactor"
Duration: "2-4 semanas"
Team Size: "2-4 desarrolladores"
Priority: "Media-Alta"
```

### **Activación Automática**

```bash
node 08-scripts/activate-sprint.js \
  --type refactor \
  --sprint S15 \
  --priority architecture,quality \
  --strict-mode false
```

### **Skills a Activar**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **backend-architecture-patterns** | suggest | 0.6 | Patrones de arquitectura | 5 patrones |
| **error-pattern-standardization** | warn | 0.5 | Mejora de errores | 3 patrones |
| **code-review-checklist** | require | 0.4 | Review post-refactor | 1 checklist |
| **performance-optimization** | warn | 0.5 | Evitar regressions | 4 técnicas |
| **test-coverage-guidelines** | suggest | 0.6 | Mantener cobertura | 2 guías |

### **Ejemplo de Prompt y Activación**

**Prompt**: `"Refactorizar controladores para aplicar clean architecture y reducir acoplamiento"`

**Activaciones**:
```
✅ backend-architecture-patterns (score: 0.89)
   → Keywords: refactor, architecture ✓
   → Intent: "refactorizar" + "clean" ✓
   → Path: controllers/ ✓

✅ error-pattern-standardization (score: 0.68)
   → Content: error handling patterns ✓

✅ code-review-checklist (score: 0.75)
   → Enforcement: require ✓
   → **SIEMPRE ACTIVO**

✅ performance-optimization (score: 0.52)
   → Keywords: refactor, optimize ✓

💡 No activadas:
○ test-coverage-guidelines (score: 0.45 < 0.6)

🔍 Total: 4/5 skills activadas
```

---

## 🔒 **Security Audit**

### **Scenario**: Auditoría de seguridad

```yaml
Sprint Type: "Security"
Duration: "1-2 semanas"
Team Size: "2-4 especialistas"
Priority: "Crítica"
```

### **Activación Automática**

```bash
node 08-scripts/activate-sprint.js \
  --type security \
  --sprint S15 \
  --priority security,compliance \
  --strict-mode ENFORCED
```

### **Skills a Activar**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **security-testing-guide** | require | 0.4 | Testing de seguridad | 5 métodos |
| **secrets-and-config** | block | 0.2 | **CRÍTICO** | 3 checklists |
| **database-verification** | block | 0.2 | **CRÍTICO** | 2 guías |
| **compliance-checklist** | require | 0.4 | Auditoría compliance | 10 puntos |
| **vulnerability-scanning** | warn | 0.5 | Detección vulnerabilidades | 4 herramientas |

### **Ejemplo de Prompt y Activación**

**Prompt**: `"Auditoría de seguridad: revisar exposición de credenciales y patrones de autenticación"`

**Activaciones**:
```
🚫 secrets-and-config (score: 0.92)
   → **BLOCK - CRÍTICO**
   → Keywords: credenciales, auth ✓
   → Content: potential hardcoded ✓

✅ security-testing-guide (score: 0.85)
   → Keywords: auditoría, security ✓
   → Intent: "auditoría" + "security" ✓

✅ database-verification (score: 0.67)
   → **BLOCK - CRÍTICO**
   → Keywords: seguridad, database ✓

✅ compliance-checklist (score: 0.78)
   → Enforcement: require ✓
   → **SIEMPRE ACTIVO**

✅ vulnerability-scanning (score: 0.71)
   → Keywords: auditoría, security ✓

🔍 Total: 5/5 skills activadas
⚠️ 2 skills en modo BLOCK
```

---

## ⚡ **Performance Optimization**

### **Scenario**: Optimización de rendimiento

```yaml
Sprint Type: "Performance"
Duration: "2-3 semanas"
Team Size: "2-3 desarrolladores"
Priority: "Media-Alta"
```

### **Activación Automática**

```bash
node 08-scripts/activate-sprint.js \
  --type performance \
  --sprint S15 \
  --priority optimization,monitoring \
  --strict-mode false
```

### **Skills a Activar**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **performance-optimization** | warn | 0.5 | Optimización principal | 6 técnicas |
| **backend-architecture-patterns** | suggest | 0.6 | Patrones de performance | 5 patrones |
| **caching-strategies** | warn | 0.5 | Estrategias de cache | 4 estrategias |
| **monitoring-setup** | require | 0.4 | Métricas obligatorias | 3 guías |
| **database-performance** | warn | 0.5 | Optimización BD | 5 técnicas |

### **Configuración Recomendada**

```json
{
  "profile": "performance",
  "skills": [
    "performance-optimization",
    "backend-architecture-patterns",
    "caching-strategies",
    "monitoring-setup",
    "database-performance"
  ],
  "thresholds": {
    "suggest": 0.6,
    "warn": 0.5,
    "require": 0.4,
    "block": 0.2
  },
  "specialConfig": {
    "profiling": "ENABLED",
    "metrics-collection": "AGGRESSIVE",
    "alert-thresholds": "LOW",
    "benchmarking": "AUTO"
  }
}
```

---

## 🧪 **Testing Sprint**

### **Scenario**: Enfoque en testing

```yaml
Sprint Type: "Testing"
Duration: "2-3 semanas"
Team Size: "2-4 testers"
Priority: "Alta"
```

### **Skills a Activar**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **visual-regression-testing** | require | 0.5 | Testing visual | 4 frameworks |
| **webapp-testing-guide** | require | 0.4 | Testing webapp | 5 enfoques |
| **api-testing-best-practices** | warn | 0.5 | Testing APIs | 3 métodos |
| **test-automation** | suggest | 0.6 | Automatización | 4 herramientas |
| **test-coverage-guidelines** | require | 0.4 | Cobertura obligatoria | 2 guías |

---

## 📦 **Migration Sprint**

### **Scenario**: Migración de datos/sistemas

```yaml
Sprint Type: "Migration"
Duration: "3-4 semanas"
Team Size: "3-5 especialistas"
Priority: "Crítica"
```

### **Skills a Activar**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **database-migration** | block | 0.2 | **CRÍTICO** | 5 pasos |
| **data-safety** | block | 0.1 | **CRÍTICO** | 3 checklists |
| **rollback-strategies** | require | 0.3 | Rollback obligatorio | 3 estrategias |
| **backup-strategies** | require | 0.3 | Backup obligatorio | 2 métodos |
| **migration-testing** | require | 0.4 | Testing migraciones | 4 fases |

### **Configuración Recomendada**

```json
{
  "profile": "migration",
  "skills": [
    "database-migration",
    "data-safety",
    "rollback-strategies",
    "backup-strategies",
    "migration-testing"
  ],
  "thresholds": {
    "suggest": 0.6,
    "warn": 0.5,
    "require": 0.3,
    "block": 0.1  // Ultra sensible
  },
  "specialConfig": {
    "dry-run": "MANDATORY",
    "backup-before": "MANDATORY",
    "rollback-plan": "REQUIRED",
    "data-validation": "STRICT"
  }
}
```

---

## 📋 **Tabla de Decisión Rápida**

### **¿Qué skill activar?**

```
PREGUNTA → ACCIÓN → SKILL

¿Operaciones de BD peligrosas?
  → SÍ → database-verification (BLOCK)

¿Nueva funcionalidad?
  → backend-dev-guidelines + api-design (SUGGEST)

¿Arreglando bugs?
  → root-cause + systematic-debug (WARN)

¿Refactorizando?
  → architecture-patterns + error-patterns (SUGGEST)

¿Auditoría de seguridad?
  → security-testing + secrets-config (BLOCK/REQUIRE)

¿Optimizando performance?
  → performance-optimization + caching (WARN)

¿Creando tests?
  → visual-regression + webapp-testing (REQUIRE)

¿Migrando datos?
  → database-migration + data-safety (BLOCK)
```

---

## 🎛️ **Configuración por Archivo**

### **configs/skill-rules.json** (Extracto)

```json
{
  "profiles": {
    "feature": {
      "skills": ["backend-dev-guidelines", "api-design-and-testing"],
      "thresholds": { "suggest": 0.6, "block": 0.2 }
    },
    "bugfix": {
      "skills": ["root-cause-tracing", "systematic-debugging"],
      "thresholds": { "warn": 0.5, "require": 0.4 }
    },
    "security": {
      "skills": ["security-testing", "secrets-config"],
      "thresholds": { "block": 0.1, "require": 0.3 }
    }
  }
}
```

---

## 📊 **Métricas por Tipo de Sprint**

### **Targets de Calidad**

| Sprint Type | Relevant Activations | False Positives | Setup Time | Dev Satisfaction |
|-------------|---------------------|-----------------|------------|------------------|
| Feature | ≥ 90% | ≤ 5% | ≤ 5 min | ≥ 4/5 |
| Bugfix | ≥ 85% | ≤ 7% | ≤ 3 min | ≥ 4/5 |
| Refactor | ≥ 88% | ≤ 6% | ≤ 5 min | ≥ 4/5 |
| Security | ≥ 95% | ≤ 3% | ≤ 7 min | ≥ 4/5 |
| Performance | ≥ 87% | ≤ 6% | ≤ 5 min | ≥ 4/5 |
| Testing | ≥ 92% | ≤ 4% | ≤ 5 min | ≥ 4/5 |
| Migration | ≥ 98% | ≤ 2% | ≤ 10 min | ≥ 4/5 |

---

## ✅ **Checklist de Activación**

### **Pre-Sprint**
- [ ] Identificar tipo de sprint
- [ ] Cargar perfil correspondiente
- [ ] Configurar thresholds específicos
- [ ] Activar skills principales
- [ ] Verificar health de servicios

### **Durante Sprint**
- [ ] Monitorear activaciones diarias
- [ ] Ajustar si hay falsos positivos
- [ ] Añadir skills si es necesario
- [ ] Documentar issues

### **Post-Sprint**
- [ ] Generar reporte de activación
- [ ] Analizar métricas
- [ ] Recopilar feedback
- [ ] Optimizar reglas para próximo sprint

---

## 🔄 **Workflow de Activación**

```bash
#!/bin/bash
# 08-scripts/activate-profile.sh

TYPE=$1  # feature, bugfix, refactor, security, performance, testing, migration

echo "🚀 Activando perfil: $TYPE"

# 1. Cargar configuración
CONFIG=$(load-profile $TYPE)

# 2. Activar skills
for skill in $CONFIG_SKILLS; do
  skills-cli skills activate $skill --profile $TYPE
done

# 3. Configurar thresholds
configure-thresholds --profile $TYPE

# 4. Iniciar monitoreo
start-monitoring --sprint $(get-current-sprint)

# 5. Verificar
verify-activation

echo "✅ Perfil $TYPE activado"
```

---

**Creado**: 2024-11-02
**Versión**: 1.0
**Owner**: Engineering Team
**Última Actualización**: 2024-11-02
