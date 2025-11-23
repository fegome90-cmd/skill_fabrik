# Diseño de Taxonomía de Anclas Semánticas

## **Objetivo Estratégico**

Reemplazar el sistema frágil de referencias por número de línea (ej. `L148-167`) por un sistema robusto de IDs semánticos que sobreviva a cambios en el archivo, sea searchable y machine-readable.

---

## **PRINCIPIOS DE DISEÑO DE ANCLAS**

### **1. Human-Readable**
Los IDs deben ser comprensibles para humanos sin contexto adicional:
- ✅ `GOVERNANCE-RULES-MAX-001`
- ❌ `GR-M001`

### **2. Machine-Searchable**
Los IDs deben ser fácilmente parseables por herramientas:
- `DOMAIN-CATEGORY-SUBCATEGORY-IDENTIFIER`
- Permite filtering y autocomplete

### **3. Hierarchical Organization**
Reflejar la estructura natural de la documentación:
- `EVIDENCE-TECHNICAL-CODE_PATTERN-BAD`
- Indica: Evidencia → Técnica → Patrones de Código → Malos Patrones

### **4. Version-Resilient**
Los IDs deben ser estables frente a cambios de contenido:
- Basados en conceptos, no en posiciones físicas
- Versionable y rastreable

### **5. Cross-Reference Compatible**
Facilitar enlaces semánticos entre documentos:
- Auto-detect broken references
- Maintain link integrity

---

## **TAXONOMÍA COMPLETA DE ANCLAS**

### **DOMINIO: EVIDENCE (Evidencia Forense)**

#### **Categoría: GOVERNANCE**
```
GOVERNANCE-RULES-MAX        # MAX-001 a MAX-015
GOVERNANCE-RULES-PROH       # PROH-001 a PROH-016
GOVERNANCE-RULES-REFACTOR    # REF-001 a REF-012
GOVERNANCE-RULES-VALIDATION  # Quality gates rules
```

**Ejemplos Específicos:**
```
GOVERNANCE-RULES-MAX-001     # INTEGRIDAD - No modificar repo original
GOVERNANCE-RULES-MAX-002     # CALIDAD - Quality gates obligatorios
GOVERNANCE-RULES-MAX-003     # CLEAN_CODE - Principios clean code
GOVERNANCE-RULES-PROH-001    # NO EJECUTAR código original
GOVERNANCE-RULES-PROH-002    # NO MODIFICAR archivos originales
```

#### **Categoría: TECHNICAL**
```
TECHNICAL-DEBT-ITEM         # Cada item F-001, F-002, etc.
TECHNICAL-SECURITY-RISK     # Cada riesgo de seguridad
TECHNICAL-PERFORMANCE-METRIC # Métricas de rendimiento
TECHNICAL-DEPENDENCY-CONFLICT # Conflictos de dependencias
TECHNICAL-ARCHITECTURAL-ISSUE # Issues de arquitectura
```

**Ejemplos Específicos:**
```
TECHNICAL-DEBT-ITEM-F001        # Authentication bypass vulnerability
TECHNICAL-DEBT-ITEM-F002        # Database connection failures
TECHNICAL-SECURITY-RISK-AUTH     # Authentication-related risks
TECHNICAL-SECURITY-RISK-CONFIG   # Configuration security risks
TECHNICAL-PERFORMANCE-METRIC-DAEMON_STARTUP # Daemon startup time
TECHNICAL-PERFORMANCE-METRIC-ROUTER_THROUGHPUT # Router throughput
TECHNICAL-ARCHITECTURAL-ISSUE-SINGLE_RESPONSIBILITY # SRP violations
```

#### **Categoría: CODE_ANALYSIS**
```
CODE_ANALYSIS-PATTERN-GOOD      # Patrones positivos identificados
CODE_ANALYSIS-PATTERN-BAD       # Anti-patrones encontrados
CODE_ANALYSIS-ANTI_PATTERN      # Anti-patrones específicos
CODE_ANALYSIS-DESIGN_PATTERN     # Patrones de diseño encontrados
```

**Ejemplos Específicos:**
```
CODE_ANALYSIS-PATTERN-GOOD-API_DESIGN         # REST API design pattern
CODE_ANALYSIS-PATTERN-GOOD-SECURITY_MANAGEMENT # Secrets management pattern
CODE_ANALYSIS-PATTERN-BAD-BIG_BALL_OF_MUD     # Daemon monolithic pattern
CODE_ANALYSIS-PATTERN-BAD-HARDCODED_CONFIG   # Configuration hardcoding
CODE_ANALYSIS-ANTI_PATTERN-GOD_OBJECT         # God object anti-pattern
```

---

### **DOMINIO: ACTIONS (Planes de Acción)**

#### **Categoría: PRIORITY**
```
PRIORITY-CRITICAL           # Priority 1 (Ejecutar Hoy)
PRIORITY-HIGH              # Priority 2 (Esta Semana)
PRIORITY-MEDIUM            # Priority 3 (Próximo Quarter)
PRIORITY-LOW               # Priority 4 (Futuro)
```

**Ejemplos Específicos:**
```
PRIORITY-CRITICAL-SECURITY_LOCKDOWN     # Reemplazar secrets hardcodeados
PRIORITY-CRITICAL-PERFORMANCE_BASELINE  # Establecer baselines de rendimiento
PRIORITY-HIGH-TESTING_FOUNDATION       # Crear foundation de tests
PRIORITY-MEDIUM-API_CONTRACTS          # Unificar contratos API
```

#### **Categoría: IMPLEMENTATION**
```
IMPLEMENTATION-COMMAND          # Comandos listos para ejecutar
IMPLEMENTATION-STRATEGY         # Estrategias de implementación
IMPLEMENTATION-MIGRATION_PLAN   # Planes de migración específicos
IMPLEMENTATION-DEPENDENCY       # Dependencias de implementación
```

**Ejemplos Específicos:**
```
IMPLEMENTATION-COMMAND-SECURITY_SCAN       # find . -name "TODO" -exec grep
IMPLEMENTATION-COMMAND-PROFILE_DAEMON     # npm run profile:daemon
IMPLEMENTATION-STRATEGY-INCREMENTAL_REFACTOR # Refactorización incremental
IMPLEMENTATION-MIGRATION_PLAN-ADR_SYSTEM   # Migración a sistema ADR
```

#### **Categoría: VERIFICATION**
```
VERIFICATION-VALIDATION_SCRIPT # Scripts de validación
VERIFICATION-QUALITY_GATE      # Quality gates específicas
VERIFICATION-REGRESSION_TEST   # Tests de regresión
VERIFICATION-EVIDENCE_CHECK   # Validación de evidencia
```

**Ejemplos Específicos:**
```
VERIFICATION-VALIDATION_SCRIPT-CHARACTERIZE_DAEMON # Script de caracterización
VERIFICATION-QUALITY_GATE-LINT_TESTS      # Lint + tests obligatorios
VERIFICATION-REGRESSION_TEST-DAEMON_CORE   # Regresiones en Daemon core
VERIFICATION-EVIDENCE_CHECK-METRIC_VERIFY # Verificación de métricas
```

---

### **DOMINIO: WORKFLOW (Procesos de Trabajo)**

#### **Categoría: PROCESS**
```
PROCESS-DECISION_MAKING     # Proceso de toma de decisiones
PROCESS-REVIEW_WORKFLOW      # Workflow de revisión
PROCESS-APPROVAL_GATE        # Gates de aprobación
PROCESS-ROLLBACK_PROCEDURE  # Procedimientos de rollback
```

#### **Categoría: AUTOMATION**
```
AUTOMATION-CI_CD_PIPELINE     # Pipeline de CI/CD
AUTOMATION-QUALITY_CHECKS     # Checks automáticos de calidad
AUTOMATION-DEPLOYMENT_SCRIPT  # Scripts de deployment
AUTOMATION-MONITORING         # Monitoreo automático
```

---

### **DOMINIO: KNOWLEDGE (Base de Conocimiento)**

#### **Categoría: LEARNING**
```
LEARNING-LESSON_LEARNED      # Lecciones aprendidas
LEARNING-BEST_PRACTICE       # Mejores prácticas
LEARNING-ANTI_PATTERN_GUIDE  # Guías de anti-patrones
LEARNING-PATTERN_CATALOG     # Catálogo de patrones
```

#### **Categoría: DOCUMENTATION**
```
DOCUMENTATION-REFERENCE_MANUAL # Manuales de referencia
DOCUMENTATION-TUTORIAL_GUIDE   # Guías de tutorial
DOCUMENTATION-API_SPECIFICATION # Especificaciones API
DOCUMENTATION-ARCHITECTURAL_DIAGRAM # Diagramas arquitectónicos
```

---

## **ESQUEMA FORMAL DE ANCLAS**

### **Formato Estándar**
```
DOMAIN-CATEGORY-SUBCATEGORY-IDENTIFIER[_VERSION]
```

### **Desglose de Componentes**

#### **DOMAIN (Obligatorio)**
Valores válidos:
- `EVIDENCE` - Evidencia y análisis forense
- `ACTIONS` - Planes de acción y comandos
- `WORKFLOW` - Procesos y flujos de trabajo
- `KNOWLEDGE` - Base de conocimiento y aprendizaje
- `TOOLS` - Herramientas y utilidades
- `RESOURCES` - Recursos y referencias

#### **CATEGORY (Obligatorio)**
Valores válidos por dominio:

**EVIDENCE**:
- `GOVERNANCE` - Reglas y gobernanza
- `TECHNICAL` - Aspectos técnicos
- `CODE_ANALYSIS` - Análisis de código
- `SECURITY` - Análisis de seguridad
- `PERFORMANCE` - Análisis de rendimiento

**ACTIONS**:
- `PRIORITY` - Priorización de acciones
- `IMPLEMENTATION` - Implementación
- `VERIFICATION` - Verificación y testing
- `DEPLOYMENT` - Deployment y producción

**WORKFLOW**:
- `PROCESS` - Procesos definidos
- `AUTOMATION` - Automatización
- `COLLABORATION` - Colaboración
- `GOVERNANCE` - Gobernanza de workflow

**KNOWLEDGE**:
- `LEARNING` - Aprendizaje
- `DOCUMENTATION` - Documentación
- `STANDARDS` - Estándares y convenciones
- `BEST_PRACTICES` - Mejores prácticas

#### **SUBCATEGORY (Opcional)**
Sub-división lógica dentro de la categoría:
- `RULES_MAX`, `RULES_PROH` para GOVERNANCE
- `PATTERN_GOOD`, `PATTERN_BAD` para CODE_ANALYSIS
- `CRITICAL`, `HIGH`, `MEDIUM` para PRIORITY
- `COMMAND`, `STRATEGY` para IMPLEMENTATION

#### **IDENTIFIER (Obligatorio)**
Identificador único dentro del contexto:
- Numérico secuencial: `001`, `002`, etc.
- Alfabético descriptivo: `SECURITY_SCAN`, `AUTHENTICATION`
- Mixto: `F001` (para technical debt items)

#### **VERSION (Opcional)**
Version del anchor para tracking:
- `_V1`, `_V2`, etc.
- `_20251115` (fecha)
- `_1.0.0` (semver)

---

## **EJEMPLOS COMPLETOS DE ANCLAS**

### **Transformación de Referencias Lineales a Semánticas**

#### **Ejemplo 1: Referencia a Governance Rules**
```
# Antes (frágil):
contenido-util-para-refactorizacion.txt:L14-29

# Después (robusto):
GOVERNANCE-RULES-MAX-001-016

# Links navegables:
[GOVERNANCE-RULES-MAX-001](/investigation/evidence/governance#governance-rules-max-001)
[GOVERNANCE-RULES-MAX-016](/investigation/evidence/governance#governance-rules-max-016)
```

#### **Ejemplo 2: Referencia a Technical Debt**
```
# Antes:
contenido-util-para-refactorizacion.txt:L153-167

# Después:
TECHNICAL-DEBT-ITEM-F001-F004

# Link navegable:
[TECHNICAL-DEBT-ITEM-F001](/investigation/evidence/technical-debt#technical-debt-item-f001)
```

#### **Ejemplo 3: Referencia a Actions**
```
# Antes:
contenido-util-para-refactorizacion.txt:L503-530

# Después:
PRIORITY-CRITICAL-IMPLEMENTATION-COMMANDS

# Links navegables:
[PRIORITY-CRITICAL-SECURITY_LOCKDOWN](/investigation/actions/critical#priority-critical-security-lockdown)
[PRIORITY-CRITICAL-PERFORMANCE_BASELINE](/investigation/actions/critical#priority-critical-performance-baseline)
```

---

## **SISTEMA DE INDEXACIÓN**

### **Estructura de Datos para Anclas**
```json
{
  "semanticAnchors": {
    "GOVERNANCE-RULES-MAX-001": {
      "id": "GOVERNANCE-RULES-MAX-001",
      "domain": "EVIDENCE",
      "category": "GOVERNANCE",
      "subcategory": "RULES_MAX",
      "identifier": "001",
      "title": "INTEGRIDAD - No modificar repo original",
      "description": "MAX rule prohibiting modification of original repository",
      "lineRange": {
        "start": 14,
        "end": 14
      },
      "file": "contenido-util-para-refactorizacion.txt",
      "content": "MAX-001: INTEGRIDAD - NO MODIFICAR NADA del repo original",
      "crossReferences": [
        "TECHNICAL-SECURITY-RISK-INTEGRITY",
        "VERIFICATION-VALIDATION_SCRIPT-INTEGRITY_CHECK"
      ],
      "status": "active",
      "version": "1.0",
      "lastUpdated": "2025-11-15T10:30:00Z",
      "tags": ["governance", "integrity", "read-only", "forensic"]
    }
  },
  "index": {
    "byDomain": {
      "EVIDENCE": ["GOVERNANCE-RULES-MAX-001", "TECHNICAL-DEBT-ITEM-F001"],
      "ACTIONS": ["PRIORITY-CRITICAL-SECURITY_LOCKDOWN"],
      "WORKFLOW": ["PROCESS-DECISION_MAKING"]
    },
    "byCategory": {
      "GOVERNANCE": ["GOVERNANCE-RULES-MAX-001", "GOVERNANCE-RULES-PROH-001"],
      "TECHNICAL": ["TECHNICAL-DEBT-ITEM-F001", "TECHNICAL-SECURITY-RISK"],
      "PRIORITY": ["PRIORITY-CRITICAL", "PRIORITY-HIGH"]
    },
    "byTags": {
      "security": ["GOVERNANCE-RULES-MAX-005", "TECHNICAL-SECURITY-RISK"],
      "performance": ["TECHNICAL-PERFORMANCE-METRIC", "IMPLEMENTATION-COMMAND-PROFILE"],
      "refactoring": ["PRIORITY-CRITICAL", "IMPLEMENTATION-STRATEGY"]
    },
    "byStatus": {
      "active": ["GOVERNANCE-RULES-MAX-001", "TECHNICAL-DEBT-ITEM-F001"],
      "deprecated": [],
      "superseded": []
    }
  }
}
```

---

## **VALIDACIÓN Y MANTENIMIENTO DE ANCLAS**

### **Reglas de Validación**
1. **Uniqueness**: Cada anchor debe ser único
2. **Format Consistency**: Seguir el esquema formal
3. **Reference Integrity**: Todas las referencias deben existir
4. **Line Accuracy**: Los rangos de línea deben ser correctos
5. **Cross-Reference Consistency**: Enlaces bidireccionales consistentes

### **Proceso de Mantenimiento**
1. **Scanning Automático**: Escanear cambios y detectar anchors afectados
2. **Validation Check**: Validar integridad del sistema de anchors
3. **Index Update**: Actualizar índice de anclas
4. **Cross-Reference Sync**: Sincronizar referencias cruzadas
5. **Version Control**: Track cambios en anchors

---

## **HERRAMIENTAS DE SOPORTE**

### **Index Generation**
```javascript
// Generar índice automático de anclas
const generateAnchorIndex = (content) => {
  const anchors = extractAnchors(content);
  const index = buildIndex(anchors);
  return { anchors, index };
};
```

### **Reference Validation**
```javascript
// Validar que todas las referencias existan
const validateReferences = (anchors, references) => {
  const broken = references.filter(ref => !anchors[ref]);
  return { broken, valid: references.length - broken.length };
};
```

### **Search Engine**
```javascript
// Motor de búsqueda semántico de anclas
const searchAnchors = (query, anchors) => {
  return anchors.filter(anchor =>
    anchor.id.includes(query) ||
    anchor.title.includes(query) ||
    anchor.tags.some(tag => tag.includes(query))
  );
};
```

---

## **BENEFICIOS DEL SISTEMA DE ANCLAS**

### **Para Humanos**
- **Intuitivo**: IDs comprensibles sin contexto
- **Searchable**: Fácil de encontrar y filtrar
- **Linkable**: URLs estables y navegables
- **Hierarchical**: Organización lógica del contenido

### **Para Máquinas**
- **Parseable**: Estructura predecible para parsing
- **Queryable**: Facilita consultas y filtrados
- **Versionable**: Track de cambios y evolución
- **Automatable**: Soporte para automatización

### **Para la Arquitectura**
- **Resilient**: Survives a cambios en el contenido
- **Scalable**: Soporta miles de anclas sin degradación
- **Maintainable**: Procesos automáticos de mantenimiento
- **Integrable**: Se integra con otros sistemas de documentación

---

## **ESTADO DE IMPLEMENTACIÓN**

### **✅ Completado:**
- Diseño completo de taxonomía
- Esquema formal de anclas
- Ejemplos de transformación
- Estructura de datos para indexación
- Reglas de validación

### **⏳ Pendiente:**
- Implementación de herramienta de anclas
- Migración de referencias existentes
- Integración con VitePress
- Validación automática
- Testing completo

---

**ESTADO**: Diseño de taxonomía completamente definido y listo para implementación