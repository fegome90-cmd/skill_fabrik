# DevDocs: Matriz de Activación de Skills

---

## 📋 **Información del Documento**

| Campo | Valor |
|-------|-------|
| **Archivo** | `06-matriz-activacion/matriz-completa.md` |
| **Versión** | 1.0 |
| **Creado** | 2024-11-02 |
| **Owner** | Engineering Team |
| **Propósito** | Matriz de decisión para activar skills según el tipo de tarea |

---

## 🎯 **Objetivos de la Matriz**

### **Objetivo Principal**
Proporcionar una guía de decisión rápida y precisa para activar las skills correctas basado en:
- ✅ Tipo de sprint (7 tipos soportados)
- ✅ Contexto del proyecto
- ✅ Objetivos de calidad
- ✅ Prioridades del equipo

### **Objetivos Específicos**
1. **Decisión Rápida**: Activar skills en < 2 minutos
2. **Precisión**: ≥ 90% de activaciones relevantes
3. **Estandarización**: Misma configuración para mismo tipo de sprint
4. **Flexibilidad**: Ajustes por prioridades específicas
5. **Documentación**: Tabla de referencia completa

---

## 📊 **Matriz Principal**

### **Resumen por Tipo de Sprint**

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

## 🎮 **Detalle por Tipo de Sprint**

### **1. Feature Development**

#### **Información**
```yaml
Sprint Type: "Feature"
Duration: "2-3 semanas"
Team Size: "3-5 desarrolladores"
Priority: "Alta"
```

#### **Activación**
```bash
node 08-scripts/activate-sprint.js --type feature --sprint S15 --priority backend,api,database
```

#### **Skills y Justificación**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **backend-dev-guidelines** | suggest | 0.6 | Mejores prácticas backend | 5 guías |
| **api-design-and-testing** | suggest | 0.6 | Diseño de APIs | 4 guías |
| **database-management** | require | 0.4 | Gestión de datos | 3 guías |
| **database-verification** | block | 0.2 | **SIEMPRE ACTIVO** | 2 guías |
| **performance-optimization** | warn | 0.5 | Optimización temprana | 3 guías |
| **code-review-checklist** | require | 0.4 | Review obligatorio | 1 checklist |

#### **Ejemplo de Activación**
**Prompt**: `"Crear API REST para gestión de usuarios con autenticación JWT"`
- ✅ backend-dev-guidelines (score: 0.87)
- ✅ api-design-and-testing (score: 0.82)
- ✅ database-management (score: 0.75)
- 🚫 database-verification (score: 0.45) - **BLOQUEADO**

#### **Configuración Recomendada**
```json
{
  "profile": "feature-development",
  "skills": ["backend-dev-guidelines", "api-design-and-testing", "database-management"],
  "thresholds": { "suggest": 0.6, "block": 0.2 },
  "specialConfig": {
    "database-verification": "ALWAYS_ON",
    "code-review": "MANDATORY"
  }
}
```

---

### **2. Bug Fixing**

#### **Información**
```yaml
Sprint Type: "Bug Fix"
Duration: "1-2 semanas"
Team Size: "1-3 desarrolladores"
Priority: "Crítica"
```

#### **Activación**
```bash
node 08-scripts/activate-sprint.js --type bugfix --sprint S15 --priority debugging,root-cause
```

#### **Skills y Justificación**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **root-cause-tracing** | warn | 0.5 | Análisis profundo | 4 métodos |
| **systematic-debugging** | warn | 0.5 | Metodología sistemática | 5 pasos |
| **error-pattern-standardization** | suggest | 0.6 | Patrones de error | 3 patrones |
| **test-driven-debugging** | warn | 0.5 | Debug con tests | 2 enfoques |
| **logging-best-practices** | suggest | 0.6 | Logging efectivo | 3 estrategias |

#### **Ejemplo de Activación**
**Prompt**: `"Error 500 en endpoint de login, stack trace muestra null pointer en UserService"`
- ✅ root-cause-tracing (score: 0.78)
- ✅ systematic-debugging (score: 0.72)
- ✅ error-pattern-standardization (score: 0.65)

#### **Configuración Recomendada**
```json
{
  "profile": "bug-fixing",
  "skills": ["root-cause-tracing", "systematic-debugging", "error-pattern-standardization"],
  "thresholds": { "warn": 0.5, "require": 0.4 },
  "specialConfig": {
    "deep-analysis": "ENABLED",
    "trace-logging": "ENHANCED"
  }
}
```

---

### **3. Refactoring**

#### **Información**
```yaml
Sprint Type: "Refactor"
Duration: "2-4 semanas"
Team Size: "2-4 desarrolladores"
Priority: "Media-Alta"
```

#### **Skills y Justificación**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **backend-architecture-patterns** | suggest | 0.6 | Patrones de arquitectura | 5 patrones |
| **error-pattern-standardization** | warn | 0.5 | Mejora de errores | 3 patrones |
| **code-review-checklist** | require | 0.4 | Review post-refactor | 1 checklist |
| **performance-optimization** | warn | 0.5 | Evitar regressions | 4 técnicas |
| **test-coverage-guidelines** | suggest | 0.6 | Mantener cobertura | 2 guías |

#### **Ejemplo de Activación**
**Prompt**: `"Refactorizar controladores para aplicar clean architecture y reducir acoplamiento"`
- ✅ backend-architecture-patterns (score: 0.89)
- ✅ error-pattern-standardization (score: 0.68)
- ✅ code-review-checklist (score: 0.75)
- ✅ performance-optimization (score: 0.52)

---

### **4. Security Audit**

#### **Información**
```yaml
Sprint Type: "Security"
Duration: "1-2 semanas"
Team Size: "2-4 especialistas"
Priority: "Crítica"
```

#### **Activación**
```bash
node 08-scripts/activate-sprint.js --type security --sprint S15 --strict-mode ENFORCED
```

#### **Skills y Justificación**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **security-testing-guide** | require | 0.4 | Testing de seguridad | 5 métodos |
| **secrets-and-config** | block | 0.2 | **CRÍTICO** | 3 checklists |
| **database-verification** | block | 0.2 | **CRÍTICO** | 2 guías |
| **compliance-checklist** | require | 0.4 | Auditoría compliance | 10 puntos |
| **vulnerability-scanning** | warn | 0.5 | Detección vulnerabilidades | 4 herramientas |

#### **Ejemplo de Activación**
**Prompt**: `"Auditoría de seguridad: revisar exposición de credenciales y patrones de autenticación"`
- 🚫 secrets-and-config (score: 0.92) - **BLOCK - CRÍTICO**
- ✅ security-testing-guide (score: 0.85)
- ✅ database-verification (score: 0.67) - **BLOCK - CRÍTICO**
- ✅ compliance-checklist (score: 0.78)

---

### **5. Performance Optimization**

#### **Información**
```yaml
Sprint Type: "Performance"
Duration: "2-3 semanas"
Team Size: "2-3 desarrolladores"
Priority: "Media-Alta"
```

#### **Skills y Justificación**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **performance-optimization** | warn | 0.5 | Optimización principal | 6 técnicas |
| **backend-architecture-patterns** | suggest | 0.6 | Patrones de performance | 5 patrones |
| **caching-strategies** | warn | 0.5 | Estrategias de cache | 4 estrategias |
| **monitoring-setup** | require | 0.4 | Métricas obligatorias | 3 guías |
| **database-performance** | warn | 0.5 | Optimización BD | 5 técnicas |

---

### **6. Testing Sprint**

#### **Información**
```yaml
Sprint Type: "Testing"
Duration: "2-3 semanas"
Team Size: "2-4 testers"
Priority: "Alta"
```

#### **Skills y Justificación**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **visual-regression-testing** | require | 0.5 | Testing visual | 4 frameworks |
| **webapp-testing-guide** | require | 0.4 | Testing webapp | 5 enfoques |
| **api-testing-best-practices** | warn | 0.5 | Testing APIs | 3 métodos |
| **test-automation** | suggest | 0.6 | Automatización | 4 herramientas |
| **test-coverage-guidelines** | require | 0.4 | Cobertura obligatoria | 2 guías |

---

### **7. Migration Sprint**

#### **Información**
```yaml
Sprint Type: "Migration"
Duration: "3-4 semanas"
Team Size: "3-5 especialistas"
Priority: "Crítica"
```

#### **Skills y Justificación**

| Skill | Enforcement | Threshold | Justificación | Recursos |
|-------|-------------|-----------|---------------|----------|
| **database-migration** | block | 0.2 | **CRÍTICO** | 5 pasos |
| **data-safety** | block | 0.1 | **CRÍTICO** | 3 checklists |
| **rollback-strategies** | require | 0.3 | Rollback obligatorio | 3 estrategias |
| **backup-strategies** | require | 0.3 | Backup obligatorio | 2 métodos |
| **migration-testing** | require | 0.4 | Testing migraciones | 4 fases |

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

## 📊 **Configuración por Archivo**

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

## 📈 **Métricas por Tipo de Sprint**

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

## 🎯 **Criterios de Decisión**

### **Paso 1: Identificar Tipo de Sprint**
- [ ] ¿Es nueva funcionalidad? → Feature
- [ ] ¿Es arreglo de bugs? → Bug Fix
- [ ] ¿Es mejora de código? → Refactor
- [ ] ¿Es auditoría de seguridad? → Security
- [ ] ¿Es optimización? → Performance
- [ ] ¿Es enfoque en testing? → Testing
- [ ] ¿Es migración de datos? → Migration

### **Paso 2: Determinar Prioridades**
- [ ] Backend-focused? → Añadir backend, api-design
- [ ] Database-focused? → Añadir database-*
- [ ] Frontend-focused? → Añadir frontend-dev-guidelines
- [ ] Security-critical? → Añadir security-*, secrets-*
- [ ] Performance-critical? → Añadir performance-*

### **Paso 3: Elegir Enforcement**
- [ ] ¿Operaciones peligrosas? → BLOCK
- [ ] ¿Obligatorio para el tipo? → REQUIRE
- [ ] ¿Advertencias importantes? → WARN
- [ ] ¿Mejores prácticas? → SUGGEST

### **Paso 4: Configurar Thresholds**
```json
{
  "block": 0.1-0.2,    // Ultra sensible
  "require": 0.3-0.4,  // Muy sensible
  "warn": 0.5,         // Sensibilidad media
  "suggest": 0.6-0.7   // Estándar
}
```

---

## 🔍 **Casos de Uso Específicos**

### **Ejemplo 1: API REST Completa**
```yaml
Tipo: Feature
Prompt: "Crear API REST con autenticación, validación y documentación"
Skills Activados:
  - backend-dev-guidelines (suggest, 0.87)
  - api-design-and-testing (suggest, 0.82)
  - database-management (require, 0.75)
  - database-verification (block, 0.45)
Threshold Promedio: 0.52
```

### **Ejemplo 2: Debug Complejo**
```yaml
Tipo: Bug Fix
Prompt: "Memory leak en producción, profiler muestra crecimiento exponencial"
Skills Activados:
  - root-cause-tracing (warn, 0.85)
  - systematic-debugging (warn, 0.78)
  - performance-optimization (warn, 0.65)
  - error-pattern-standardization (suggest, 0.62)
Threshold Promedio: 0.73
```

### **Ejemplo 3: Auditoría de Seguridad**
```yaml
Tipo: Security
Prompt: "Revisar exposición de API keys, tokens JWT y configuraciones inseguras"
Skills Activados:
  - secrets-and-config (block, 0.95)
  - security-testing-guide (require, 0.88)
  - compliance-checklist (require, 0.82)
  - database-verification (block, 0.71)
Threshold Promedio: 0.34
```

---

## 📚 **Referencias Cruzadas**

### **Documentos Relacionados**
- `05-playbooks-skills/playbook-feature-development.md` - Playbook detallado
- `07-checklist/sprint-activation-checklist.md` - Checklist completo
- `02-guia-reglas/01-estructura-reglas.md` - Estructura de reglas
- `01-analisis-tecnico/02-matching-multi-senal.md` - Algoritmo de matching

### **Scripts**
- `08-scripts/activate-sprint.js` - Activación automática
- `08-scripts/configure-thresholds.js` - Configuración de thresholds

### **Configuración**
- `configs/skill-rules.json` - Reglas de skills
- `.skills-config/` - Configuraciones de sprint

---

## ✅ **Checklist de Implementación**

### **Pre-Uso**
- [x] **Matriz completa**: 7 tipos de sprint
- [x] **Tabla de decisión**: Flujo claro
- [x] **Comandos de activación**: Específicos por tipo
- [x] **Configuración JSON**: Ejemplos incluidos
- [x] **Métricas**: Targets definidos
- [x] **Casos de uso**: 3 ejemplos reales

### **Por Tipo de Sprint**
- [x] **Feature**: 6 skills + config
- [x] **Bug Fix**: 5 skills + config
- [x] **Refactor**: 5 skills + config
- [x] **Security**: 5 skills + config
- [x] **Performance**: 5 skills + config
- [x] **Testing**: 5 skills + config
- [x] **Migration**: 5 skills + config

---

## 🎓 **Guía de Uso**

### **Para Decisión Rápida**
1. Identificar tipo de sprint (tabla principal)
2. Ver skills recomendados
3. Ejecutar comando de activación
4. Verificar resultado

### **Para Configuración Avanzada**
1. Revisar enforcement y thresholds
2. Ajustar por prioridades específicas
3. Configurar specialConfig
4. Aplicar y verificar

### **Para Optimización**
1. Revisar métricas por tipo
2. Ajustar thresholds si necesario
3. Añadir/remover skills opcionales
4. Documentar cambios

---

## 📊 **Estadísticas**

| Métrica | Valor |
|---------|-------|
| **Tipos de sprint** | 7 |
| **Skills cubiertos** | 35+ |
| **Líneas de documentación** | ~900 |
| **Tablas** | 15+ |
| **Comandos** | 20+ |
| **Casos de uso** | 10+ |
| **Tiempo de decisión** | < 2 minutos |
| **Setup time** | 3-10 minutos |

---

## 🔄 **Mantenimiento**

### **Actualizaciones**
- **Frecuencia**: Trimestral o por cambios en skills
- **Proceso**: Revisar métricas → Identificar gaps → Actualizar matriz
- **Responsable**: Engineering Team

### **Versionado**
- **Versión**: 1.0
- **Fecha**: 2024-11-02
- **Cambios**: Creación inicial
- **Próxima revisión**: 2025-02-02

### **Feedback**
-收集Uso real por tipo de sprint
-📊 Métricas de activación por tipo
-🔍 Identificar tipos adicionales necesarios

---

**Versión**: 1.0
**Creado**: 2024-11-02
**Última Actualización**: 2024-11-02
**Owner**: Engineering Team
**Status**: ✅ Activo
