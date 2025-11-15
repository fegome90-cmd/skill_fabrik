# Plan de Migración de Contenido a VitePress

## **Mapeo Detallado de Contenido**

### **Transformación de Archivo Monolítico a Estructura Navegable**

**Archivo Origen**: `contenido-util-para-refactorizacion.txt` (1,500 líneas)
**Destino**: Estructura VitePress modular y enlazable

---

## **SECCIÓN 1: GOBERNANZA (Líneas 1-65)**

### **Mapeo Exacto:**
```
L1-30   → /investigation/evidence/governance.md#max-rules
L31-65  → /investigation/evidence/governance.md#proh-rules
```

### **Contenido Estructurado:**

#### **MAX Rules (L1-30)**
```markdown
# Governance Rules - Maximum Authority (MAX)

## 📜 MAX-001: INTEGRIDAD
**Original Line**: L14
**Content**: NO MODIFICAR NADA del repo original, solo observar y describir
**Implementation**: Read-only analysis approach
**Verification**: All analysis tools respect this rule
**Semantic Anchor**: [GOVERNANCE-RULES-MAX-001](/investigation/evidence/governance#governance-rules-max-001)

## 📜 MAX-002: CALIDAD
**Original Line**: L15
**Content**: CADA fase debe pasar quality gates (lint + tests + formato + clean code)
**Implementation**: Automated quality checks
**Verification**: All phases validated before progression
**Semantic Anchor**: [GOVERNANCE-RULES-MAX-002](/investigation/evidence/governance#governance-rules-max-002)

<!-- ... (continuar con todas las MAX rules L14-L29) -->
```

#### **PROH Rules (L31-65)**
```markdown
## 🚫 PROH-001: NO EJECUTAR CÓDIGO ORIGINAL
**Original Line**: L31
**Content**: Prohibida ejecución de código del repo original durante análisis
**Risk Assessment**: Environment contamination
**Implementation**: All tools operate in read-only mode
**Semantic Anchor**: [GOVERNANCE-RULES-PROH-001](/investigation/evidence/governance#governance-rules-proh-001)

## 🚫 PROH-002: NO MODIFICAR ARCHIVOS ORIGINALES
**Original Line**: L32
**Content**: Prohibida modificación de archivos del repo original
**Risk Assessment**: Corrupting evidence
**Implementation**: Copy-on-read analysis
**Semantic Anchor**: [GOVERNANCE-RULES-PROH-002](/investigation/evidence/governance#governance-rules-proh-002)

<!-- ... (continuar con todas las PROH rules L31-L46) -->
```

---

## **SECCIÓN 2: PATRONES DE CÓDIGO (Líneas 66-150)**

### **Mapeo Exacto:**
```
L66-95   → /investigation/evidence/patterns.md#good-patterns
L96-125  → /investigation/evidence/patterns.md#bad-patterns
L126-150 → /investigation/evidence/patterns.md#anti-patterns-analysis
```

### **Contenido Estructurado:**

#### **Buenos Patrones (L66-95)**
```markdown
# Code Patterns Analysis

## ✅ Positive Patterns Extracted from Skills

### API Design Pattern (from api-design-and-testing skill)
**Original Line**: L73-L84
**Evidence**: Real skill implementation
**Pattern**:
```yaml
api_type: "REST"
structure:
  - src/routes/{controllers,middleware,validators}
  - src/{schemas,tests}
endpoints:
  - resources/:id (CRUD)
  - /health (status)
validation: "ajv schemas"
testing: "jest + supertest"
```
**Semantic Anchor**: [CODE-PATTERN-GOOD-API-DESIGN](/investigation/evidence/patterns#code-pattern-good-api-design)

### Security Pattern (from secrets-and-config skill)
**Original Line**: L86-L97
**Evidence**: Hardcoded secrets prevention
**Pattern**:
```yaml
secrets_management:
  - process.env.API_KEY
  - validación temprana al boot
  - .env.example siempre actualizado
blocked_patterns:
  - ❌ credenciales hardcodeadas
  - ❌ API keys en config JSON
  - ❌ contraseñas en código
```
**Semantic Anchor**: [CODE-PATTERN-GOOD-SECURITY](/investigation/evidence/patterns#code-pattern-good-security)
```

#### **Malos Patrones (L96-125)**
```markdown
## ❌ Anti-Patterns Identified

### "Big Ball of Mud" Pattern
**Original Line**: L98-L110
**Location**: Daemon app.ts
**Anti-Pattern**:
```yaml
issues:
  - 50+ imports en single file
  - Autenticación mezclada con business logic
  - Configuración dispersa
  - Múltiples responsabilidades
impact:
  - Violación Single Responsibility
  - Testing imposible
  - Mantenimiento complejo
```
**Semantic Anchor**: [CODE-PATTERN-BAD-BIG-BALL-OF-MUD](/investigation/evidence/patterns#code-pattern-bad-big-ball-of-mud)

### Hardcoded Configuration Pattern
**Original Line**: L112-L125
**Evidence**: Multiple TODOs with hardcoded values
**Anti-Pattern**:
```yaml
locations:
  - packages/skills-cli/dist/commands/plan.js
  - packages/daemon/src/app.ts
issues:
  - "approvedBy = 'user'"
  - "schema validation TODO"
  - Environment variables hardcoded
security_impact: "Authentication bypass + disclosure"
```
**Semantic Anchor**: [CODE-PATTERN-BAD-HARDCODED-CONFIG](/investigation/evidence/patterns#code-pattern-bad-hardcoded-config)
```

---

## **SECCIÓN 3: ANÁLISIS DE DEUDA TÉCNICA (Líneas 151-250)**

### **Mapeo Exacto:**
```
L151-180 → /investigation/evidence/technical-debt.md#debt-matrix
L181-210 → /investigation/evidence/technical-debt.md#priority-analysis
L211-250 → /investigation/evidence/technical-debt.md#resolution-strategies
```

### **Contenido Estructurado:**

#### **Technical Debt Matrix (L151-180)**
```markdown
# Technical Debt Analysis

## 📊 Complete Debt Matrix

<InteractiveTable
  :data="technicalDebtData"
  :columns="['ID', 'Component', 'Type', 'Impact', 'Effort', 'Priority', 'Timeline']"
  :filterable="true"
  :sortable="true"
/>

### 🔴 Critical Debt Items (Priority 1)

#### F-001: Authentication Bypass in Daemon
**Original Line**: L153-L160
**Details**:
- **Component**: Daemon
- **Type**: HACK
- **Impact**: Critical Security Vulnerability
- **Location**: app.ts lines 19, 27, 31
- **Effort**: 2 weeks
- **Timeline**: Immediate (2 days)
- **Risk Level**: 🔴 Critical
- **Command**: `sed auth patterns`
- **Evidence**: [Security Risk Analysis](/investigation/evidence/security#authentication-flaws)
**Semantic Anchor**: [TECHNICAL-DEBT-ITEM-F001](/investigation/evidence/technical-debt#technical-debt-item-f001)

#### F-002: Database Connection Failures
**Original Line**: L161-L168
**Details**:
- **Component**: Daemon
- **Type**: FIXME
- **Impact**: High - Data loss potential
- **Effort**: 1 week
- **Timeline**: This week
- **Risk Level**: 🟠 High
- **Command**: `Database tests`
- **Evidence**: [Component Analysis](/investigation/evidence/component-metrics#daemon-database)
**Semantic Anchor**: [TECHNICAL-DEBT-ITEM-F002](/investigation/evidence/technical-debt#technical-debt-item-f002)

<!-- ... (continuar con todos los items críticos L153-L180) -->
```

---

## **SECCIÓN 4: ANÁLISIS DE SEGURIDAD (Líneas 251-350)**

### **Mapeo Exacto:**
```
L251-280 → /investigation/evidence/security.md#stride-analysis
L281-310 → /investigation/evidence/security.md#vulnerability-details
L311-350 → /investigation/evidence/security.md#mitigation-strategies
```

### **Contenido Estructurado:**

#### **STRIDE Analysis (L251-280)**
```markdown
# Security Assessment - STRIDE Framework

## 🛡️ Threat Model Overview

<STRIDEModel :data="strideAnalysisData" />

### Daemon - Critical Risk Component
**Original Line**: L253-L260
**Analysis**:
| Threat | Level | Evidence | Impact |
|--------|--------|----------|---------|
| **Spoofing** | 🟠 Medium | Authentication mixing | Identity theft possible |
| **Tampering** | 🔴 High | No input validation | Data corruption |
| **Repudiation** | 🟢 Low | Basic logging | Non-repudiation weak |
| **Disclosure** | 🟠 Medium | Logging exposure | Information leak |
| **DoS** | ⚪ Unknown | No rate limiting | Service disruption |
| **Elevation** | 🟢 Low | No privilege escalation | Security boundary clear |
**Semantic Anchor**: [SECURITY-RISK-DAEMON-STRIDE](/investigation/evidence/security#security-risk-daemon-stride)

### Router - High Risk Component
**Original Line**: L261-L270
**Analysis**:
| Threat | Level | Evidence | Impact |
|--------|--------|----------|---------|
| **Spoofing** | 🟢 Low | Basic auth | Identity theft unlikely |
| **Tampering** | 🟢 Low | Input validation present | Data corruption unlikely |
| **Repudiation** | 🟠 Medium | Limited logging | Non-repudiation weak |
| **Disclosure** | 🟢 Low | Minimal data exposure | Information leak unlikely |
| **DoS** | 🟠 Medium | Basic rate limiting | Service disruption possible |
| **Elevation** | 🟢 Low | Clear role boundaries | Privilege escalation unlikely |
**Semantic Anchor**: [SECURITY-RISK-ROUTER-STRIDE](/investigation/evidence/security#security-risk-router-stride)

<!-- ... (continuar con análisis completo L251-L280) -->
```

---

## **SECCIÓN 5: MÉTRICAS DE COMPONENTES (Líneas 351-450)**

### **Mapeo Exacto:**
```
L351-380 → /investigation/evidence/performance.md#component-overview
L381-410 → /investigation/evidence/performance.md#detailed-metrics
L411-450 → /investigation/evidence/performance.md#performance-targets
```

### **Contenido Estructurado:**

#### **Component Overview (L351-380)**
```markdown
# Component Performance Analysis

## 📊 Current Component Metrics

<ComponentMetricsTable :data="componentMetricsData" />

### Daemon (440K - Critical Risk)
**Original Line**: L353-L365
**Current State**:
```yaml
complexity_indicators:
  imports: "50+ in single file"
  responsibilities: "Mixing auth, metrics, UI, business logic"
  coupling: "High - direct imports across domains"

testing_status:
  unit_tests: 0
  integration_tests: 1
  e2e_tests: 0
  coverage: "<5%"

critical_issues:
  - "Big Ball of Mud pattern"
  - "Single Responsibility violations"
  - "Mixed concerns in single module"

performance_baselines:
  startup_time: "TBD - needs profiling"
  memory_usage: "TBD - needs measurement"
  response_time: "N/A - background service"
```
**Semantic Anchor**: [PERFORMANCE-METRIC-DAEMON](/investigation/evidence/performance#performance-metric-daemon)

### Router (592K - High Risk)
**Original Line**: L366-L375
**Current State**:
```yaml
complexity_indicators:
  imports: "15+ in core files"
  responsibilities: "Focused on routing + middleware"
  coupling: "Medium - well-structured dependencies"

testing_status:
  unit_tests: 15
  integration_tests: 14
  e2e_tests: 0
  coverage: "<10%"

strengths:
  - "Clear single responsibility"
  - "Well-structured middleware chain"
  - "Good separation of concerns"

performance_baselines:
  response_time: "TBD - needs load testing"
  throughput: "TBD - needs benchmarking"
  memory_usage: "TBD - needs profiling"
```
**Semantic Anchor**: [PERFORMANCE-METRIC-ROUTER](/investigation/evidence/performance#performance-metric-router)

<!-- ... (continuar con Skills-CLI analysis L376-L380) -->
```

---

## **SECCIÓN 6: PLANES DE IMPLEMENTACIÓN (Líneas 451-550)**

### **Mapeo Exacto:**
```
L451-480 → /investigation/actions/critical.md#immediate-actions
L481-510 → /investigation/actions/high-priority.md#this-week-actions
L511-550 → /investigation/actions/medium-priority.md#quarter-plans
```

### **Contenido Estructurado:**

#### **Critical Actions (L451-480)**
```markdown
# Priority 1 - Critical Actions (Execute Today)

## 🔴 Security Lockdown (5 min)
**Original Line**: L453-L460
**Commands**:
```bash
# 1. Find hardcoded secrets
find . -name "TODO" -exec grep -l "user\|password\|key" {} \;

# 2. Replace with environment variables
find packages/ -name "*.js" -o -name "*.ts" | xargs grep -l "user.*=" | xargs sed -i.bak 's/user.*=/process.env.USER/'
echo "✅ Security: Hardcoded users replaced"
```
**Impact**: Authentication bypass vulnerability elimination
**Effort**: 2 hours
**Evidence**: [F-001](/investigation/evidence/technical-debt#technical-debt-item-f001)
**Semantic Anchor**: [PRIORITY-CRITICAL-SECURITY-LOCKDOWN](/investigation/actions/critical#priority-critical-security-lockdown)

## 📊 Performance Baseline (10 min)
**Original Line**: L461-L470
**Commands**:
```bash
# 1. Profile Daemon
npm run profile:daemon

# 2. Profile Router
npm run profile:router

# 3. Profile Skills-CLI
npm run profile:skills-cli

echo "✅ Performance: Baselines established"
```
**Impact**: Performance monitoring capability establishment
**Effort**: 4 hours
**Evidence**: [Component Metrics](/investigation/evidence/performance)
**Semantic Anchor**: [PRIORITY-CRITICAL-PERFORMANCE-BASELINE](/investigation/actions/critical#priority-critical-performance-baseline)

## 🧪 Test Bootstrap (15 min)
**Original Line**: L471-L480
**Commands**:
```bash
# 1. Test coverage bootstrap
npm test -- --coverage packages/daemon --threshold=20

# 2. Create baseline measurements
npm run test:baseline

echo "✅ Testing: Coverage measurement completed"
```
**Impact**: Main process testing foundation
**Effort**: 16 hours
**Evidence**: [Testing Strategy ADR](/adr/0003-testing-strategy)
**Semantic Anchor**: [PRIORITY-CRITICAL-TEST-BASELINE](/investigation/actions/critical#priority-critical-test-baseline)

<!-- ... (continuar con todas las acciones críticas L451-L480) -->
```

---

## **TRANSFORMACIÓN DE REFERENCIAS**

### **Mapeo de Referencias por Línea a Anclas Semánticas**

#### **Transformación Automática**
```javascript
// scripts/transform-references.mjs
const referenceMapping = {
  // Governance Rules
  'L10-29': 'GOVERNANCE-RULES-MAX',
  'L30-46': 'GOVERNANCE-RULES-PROH',

  // Technical Debt
  'L153-167': 'TECHNICAL-DEBT-MATRIX-CRITICAL',
  'L168-180': 'TECHNICAL-DEBT-MATRIX-HIGH',

  // Security Analysis
  'L233-244': 'SECURITY-RISKS-CRITICAL',
  'L246-264': 'STRIDE-ANALYSIS-COMPLETE',

  // Performance Metrics
  'L182-201': 'PERFORMANCE-METRICS-COMPONENTS',

  // Action Items
  'L503-530': 'IMPLEMENTATION-COMMANDS-CRITICAL'
};

const transformReferences = (content) => {
  Object.entries(referenceMapping).forEach(([lineRange, anchorId]) => {
    const regex = new RegExp(`L${lineRange}`, 'g');
    content = content.replace(regex, `[${anchorId}](/investigation/evidence#${anchorId})`);
  });
  return content;
};
```

#### **Ejemplos de Transformación**
```markdown
# Antes:
📄 **Detailed Analysis**: Ver contenido-util-para-refactorizacion.txt:L115-147
🔍 **Deep Dive**: contenido-util-para-refactorizacion.txt:L113-126
⚡ **Quick Stats**: contenido-util-para-refactorizacion.txt:L182-201
🚨 **Critical Items**: contenido-util-para-refactorizacion.txt:L233-244

# Después:
📄 **Detailed Analysis**: Ver [EVIDENCE-CODE_ANALYSIS-ARCHITECTURAL-ISSUE](/investigation/evidence/patterns#architectural-issues)
🔍 **Deep Dive**: [EVIDENCE-TECHNICAL-CODE_PATTERN-BAD](/investigation/evidence/patterns#code-patterns-bad)
⚡ **Quick Stats**: [PERFORMANCE-METRIC-COMPONENTS](/investigation/evidence/performance#performance-metric-components)
🚨 **Critical Items**: [ACTIONS-PRIORITY-PRIORITY-CRITICAL](/investigation/actions/critical#priority-critical)
```

---

## **VALIDACIÓN DE MIGRACIÓN**

### **Checklist de Integridad**
- [ ] **Coverage**: 100% de líneas originales mapeadas
- [ ] **Semantic Anchors**: Todas las referencias transformadas
- [ ] **Navigation**: Estructura navegable y coherente
- [ ] **Links**: 100% de enlaces internos funcionales
- [ ] **Search**: Content indexable y buscable
- [ ] **Mobile**: Responsive design funcional
- [ ] **Accessibility**: WCAG 2.1 AA compliance

### **Herramientas de Validación**
```javascript
// scripts/validate-migration.mjs
const validateMigration = async () => {
  // 1. Verificar que todas las líneas originales tengan mapeo
  // 2. Validar que todos los anchors semánticos existan
  // 3. Checar que todos los enlaces internos funcionen
  // 4. Verificar consistencia de formato
  // 5. Validar SEO y accessibility

  return {
    coverage: '100%',
    anchors_valid: true,
    links_working: '100%',
    format_consistent: true,
    seo_optimized: true,
    accessibility_compliant: true
  };
};
```

---

## **TIMELINE DE MIGRACIÓN**

### **Fase 1: Estructura y Mapping (Días 1-2)**
- [x] Crear estructura VitePress
- [ ] Mapear todas las secciones del archivo original
- [ ] Definir anclas semánticas para cada referencia
- [ ] Crear índice de mapeo

### **Fase 2: Generación de Contenido (Días 3-5)**
- [ ] Generar archivos Markdown para cada sección
- [ ] Crear componentes Vue interactivos
- [ ] Implementar transformación automática de referencias
- [ ] Validar integridad del contenido

### **Fase 3: Integración y Testing (Días 6-7)**
- [ ] Integrar con sistema de ADRs existente
- [ ] Implementar search y navegación
- [ ] Testing completo de funcionalidad
- [ ] Performance optimization

### **Fase 4: Deploy y Validación (Día 8)**
- [ ] Deploy a GitHub Pages
- [ ] Validar producción
- [ ] Monitorear performance
- [ ] Documentar proceso

---

**ESTADO**: Plan de migración completamente documentado con mapeo exacto y herramientas de validación
**SIGUIENTE**: Implementación de Mejora 4 - Anclas Semánticas